/**
 * Migrate admin uploads created by the legacy `catalog/<uuid>.<ext>` flow to
 * the root-level `Artist - Song.<ext>` convention required by MusicFlow.
 *
 * Safe by default: without `--apply` it only prints the plan. In apply mode it
 * copies first, updates every matching Track row, verifies the target object,
 * and deletes the legacy key last. Unreferenced keys are reported and are
 * deleted only with the additional explicit `--prune-orphans` flag.
 */
import { createHash } from "crypto";
import { readFileSync } from "fs";
import { join } from "path";
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3";
import { PrismaClient } from "@prisma/client";

import { buildCatalogAudioKey } from "../src/modules/storage/storage.service";

function loadEnv() {
  const text = readFileSync(join(__dirname, "..", ".env"), "utf8");
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (match && process.env[match[1]] === undefined) {
      process.env[match[1]] = match[2].trim().replace(/^(['"])(.*)\1$/, "$2");
    }
  }
}

loadEnv();

const required = [
  "DATABASE_URL",
  "R2_ENDPOINT",
  "R2_ACCESS_KEY",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_AUDIO",
  "R2_PUBLIC_AUDIO_URL",
] as const;
for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing env var ${key}`);
}

const apply = process.argv.includes("--apply");
const pruneOrphans = process.argv.includes("--prune-orphans");
const keepSource = process.argv.includes("--keep-source");
if (pruneOrphans && !apply) {
  throw new Error("--prune-orphans requires --apply");
}
if (pruneOrphans && keepSource) {
  throw new Error("--prune-orphans and --keep-source cannot be combined");
}
const bucket = process.env.R2_BUCKET_AUDIO!;
const publicBase = process.env.R2_PUBLIC_AUDIO_URL!.replace(/\/+$/, "");
const prisma = new PrismaClient();
const s3 = new S3Client({
  endpoint: process.env.R2_ENDPOINT,
  region: process.env.R2_REGION || "auto",
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

function argument(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv
    .find((value) => value.startsWith(prefix))
    ?.slice(prefix.length);
}

function extractLegacyKey(url: string | null): string | null {
  if (!url) return null;
  const prefix = `${publicBase}/`;
  if (!url.startsWith(prefix)) return null;
  const key = decodeURIComponent(url.slice(prefix.length));
  return key.startsWith("catalog/") ? key : null;
}

function publicUrl(key: string): string {
  return `${publicBase}/${encodeURI(key)
    .replace(/'/g, "%27")
    .replace(/!/g, "%21")}`;
}

function copySource(key: string): string {
  return encodeURIComponent(`${bucket}/${key}`).replace(/%2F/g, "/");
}

type LegacyObject = {
  key: string;
  lastModified: Date;
};

async function listLegacyObjects(): Promise<LegacyObject[]> {
  const objects: LegacyObject[] = [];
  let token: string | undefined;
  do {
    const page = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: "catalog/",
        ContinuationToken: token,
      }),
    );
    for (const item of page.Contents ?? []) {
      if (item.Key) {
        objects.push({
          key: item.Key,
          lastModified: item.LastModified ?? new Date(0),
        });
      }
    }
    token = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (token);
  return objects.sort(
    (left, right) => right.lastModified.getTime() - left.lastModified.getTime(),
  );
}

async function sha256Object(key: string): Promise<string> {
  const object = await s3.send(
    new GetObjectCommand({ Bucket: bucket, Key: key }),
  );
  if (!object.Body) throw new Error(`R2 returned an empty body for ${key}`);
  const hash = createHash("sha256");
  for await (const chunk of object.Body as AsyncIterable<Uint8Array>) {
    hash.update(chunk);
  }
  return hash.digest("hex");
}

async function main() {
  const search = argument("search")?.toLocaleLowerCase();
  if (search) {
    const matches: string[] = [];
    let token: string | undefined;
    do {
      const page = await s3.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          ContinuationToken: token,
        }),
      );
      for (const object of page.Contents ?? []) {
        if (object.Key?.toLocaleLowerCase().includes(search)) {
          matches.push(object.Key);
        }
      }
      token = page.IsTruncated ? page.NextContinuationToken : undefined;
    } while (token);
    console.log(
      matches.length
        ? `R2 matches:\n${matches.map((key) => `  ${key}`).join("\n")}`
        : `No R2 object contains "${search}"`,
    );
    return;
  }

  const checkKey = argument("check-key");
  if (checkKey) {
    const object = await s3.send(
      new HeadObjectCommand({ Bucket: bucket, Key: checkKey }),
    );
    console.log(
      `R2 object exists: ${checkKey} (${object.ContentLength ?? 0} bytes, ${object.ContentType ?? "unknown type"})`,
    );
    return;
  }

  const tracks = await prisma.track.findMany({
    where: { isCatalog: true },
    select: {
      id: true,
      title: true,
      artist: true,
      fileHash: true,
      fileUrlRemote: true,
      artistRef: { select: { name: true } },
    },
  });

  const legacyObjects = await listLegacyObjects();
  const objectByKey = new Map(
    legacyObjects.map((object) => [object.key, object]),
  );
  const plans = tracks.flatMap((track) => {
    const sourceKey = extractLegacyKey(track.fileUrlRemote);
    if (!sourceKey || !objectByKey.has(sourceKey)) return [];
    const extension = sourceKey.split(".").pop() ?? "";
    return [
      {
        trackId: track.id,
        sourceKey,
        targetKey: buildCatalogAudioKey(
          track.artistRef?.name ?? track.artist,
          track.title,
          extension,
        ),
      },
    ];
  });

  // A later catalog refresh may already have changed fileUrlRemote while the
  // legacy R2 object remains. Match those cases using the content SHA-256 that
  // MusicFlow stores in Track.fileHash. When duplicate legacy objects contain
  // the same bytes, the newest one is the migration source.
  const plannedTrackIds = new Set(plans.map((plan) => plan.trackId));
  const tracksByHash = new Map<string, typeof tracks>();
  for (const track of tracks) {
    if (plannedTrackIds.has(track.id)) continue;
    const matches = tracksByHash.get(track.fileHash) ?? [];
    matches.push(track);
    tracksByHash.set(track.fileHash, matches);
  }
  for (const object of legacyObjects) {
    if (plans.some((plan) => plan.sourceKey === object.key)) continue;
    const hash = await sha256Object(object.key);
    const matchingTracks = tracksByHash.get(hash) ?? [];
    for (const track of matchingTracks) {
      if (plannedTrackIds.has(track.id)) continue;
      const extension = object.key.split(".").pop() ?? "";
      plans.push({
        trackId: track.id,
        sourceKey: object.key,
        targetKey: buildCatalogAudioKey(
          track.artistRef?.name ?? track.artist,
          track.title,
          extension,
        ),
      });
      plannedTrackIds.add(track.id);
    }
  }

  const grouped = new Map<string, { targetKey: string; trackIds: string[] }>();
  for (const plan of plans) {
    const group = grouped.get(plan.sourceKey) ?? {
      targetKey: plan.targetKey,
      trackIds: [],
    };
    if (group.targetKey !== plan.targetKey) {
      throw new Error(
        `Conflicting targets for ${plan.sourceKey}: ${group.targetKey} / ${plan.targetKey}`,
      );
    }
    group.trackIds.push(plan.trackId);
    grouped.set(plan.sourceKey, group);
  }

  const manualSourceKey = argument("source-key");
  const manualArtist = argument("artist");
  const manualTitle = argument("title");
  const manualValues = [manualSourceKey, manualArtist, manualTitle].filter(
    Boolean,
  );
  if (manualValues.length > 0 && manualValues.length !== 3) {
    throw new Error(
      "Manual repair requires --source-key, --artist and --title together",
    );
  }
  if (manualSourceKey && manualArtist && manualTitle) {
    if (!objectByKey.has(manualSourceKey)) {
      throw new Error(`Legacy source ${manualSourceKey} does not exist in R2`);
    }
    const extension = manualSourceKey.split(".").pop() ?? "";
    const targetKey = buildCatalogAudioKey(
      manualArtist,
      manualTitle,
      extension,
    );
    const existing = grouped.get(manualSourceKey);
    if (existing && existing.targetKey !== targetKey) {
      throw new Error(
        `Manual target ${targetKey} conflicts with detected target ${existing.targetKey}`,
      );
    }
    grouped.set(manualSourceKey, existing ?? { targetKey, trackIds: [] });
  }

  console.log(
    apply ? "APPLY legacy R2 key repair" : "DRY RUN legacy R2 key repair",
  );
  for (const [sourceKey, group] of grouped) {
    console.log(
      `  ${sourceKey} -> ${group.targetKey} (${group.trackIds.length} track row(s))`,
    );
  }

  const referencedKeys = new Set(grouped.keys());
  const orphanKeys = legacyObjects
    .map((object) => object.key)
    .filter((key) => !referencedKeys.has(key));
  if (orphanKeys.length) {
    console.log(
      pruneOrphans
        ? "Unreferenced legacy objects to delete:"
        : "Unreferenced legacy objects (left untouched):",
    );
    for (const key of orphanKeys) console.log(`  ${key}`);
  }

  if (!apply) {
    console.log(
      `Dry run complete: ${grouped.size} object(s) to migrate, ${orphanKeys.length} orphan(s).`,
    );
    return;
  }

  let migrated = 0;
  for (const [sourceKey, group] of grouped) {
    const source = await s3.send(
      new HeadObjectCommand({ Bucket: bucket, Key: sourceKey }),
    );
    let targetExists = false;
    try {
      const target = await s3.send(
        new HeadObjectCommand({ Bucket: bucket, Key: group.targetKey }),
      );
      targetExists = true;
      if (target.ContentLength !== source.ContentLength) {
        throw new Error(
          `Target ${group.targetKey} already exists with a different size`,
        );
      }
    } catch (error) {
      if (
        (error as { $metadata?: { httpStatusCode?: number } }).$metadata
          ?.httpStatusCode !== 404
      ) {
        throw error;
      }
    }

    if (!targetExists) {
      await s3.send(
        new CopyObjectCommand({
          Bucket: bucket,
          Key: group.targetKey,
          CopySource: copySource(sourceKey),
        }),
      );
    }
    await s3.send(
      new HeadObjectCommand({ Bucket: bucket, Key: group.targetKey }),
    );

    if (group.trackIds.length > 0) {
      await prisma.track.updateMany({
        where: { id: { in: group.trackIds } },
        data: { fileUrlRemote: publicUrl(group.targetKey) },
      });
    }

    if (!keepSource) {
      await s3.send(
        new DeleteObjectCommand({ Bucket: bucket, Key: sourceKey }),
      );
    }
    migrated += 1;
  }

  if (pruneOrphans) {
    for (const key of orphanKeys) {
      await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    }
  }

  console.log(
    `Repair complete: ${migrated} object(s) migrated; ${
      pruneOrphans ? orphanKeys.length : 0
    } orphan(s) deleted; ${pruneOrphans ? 0 : orphanKeys.length} orphan(s) left untouched; sources ${
      keepSource ? "retained" : "removed after verification"
    }.`,
  );
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
