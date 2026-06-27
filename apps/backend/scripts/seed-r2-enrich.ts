/**
 * Enriches the catalog from two R2 buckets:
 *   - music-flow-songs-lyrics  ("Artist - Title.lrc") → Track.lyricsLrc
 *   - music-flow-artist-image  ("Artist_Name.webp")   → Track.artistImage
 *
 * Artist images are copied into the public images bucket under `artists/` so
 * the browser can load them directly (the same public URL covers already use).
 * Lyrics content is stored verbatim in the DB and never logged.
 *
 * Idempotent. Run with:  pnpm --filter @musicflow/backend run seed:enrich
 */
import { readFileSync } from "fs";
import { join } from "path";
import {
  CopyObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3";
import { PrismaClient } from "@prisma/client";

function loadEnv() {
  const text = readFileSync(join(__dirname, "..", ".env"), "utf8");
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2].trim().replace(/^(['"])(.*)\1$/, "$2");
    }
  }
}
loadEnv();

const REQUIRED = [
  "DATABASE_URL",
  "R2_ENDPOINT",
  "R2_ACCESS_KEY",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_IMAGES",
  "R2_BUCKET_LYRICS",
  "R2_BUCKET_ARTIST_IMAGES",
  "R2_PUBLIC_IMAGES_URL",
];
for (const k of REQUIRED) {
  if (!process.env[k]) {
    console.error(`Missing env var ${k}`);
    process.exit(1);
  }
}

const s3 = new S3Client({
  endpoint: process.env.R2_ENDPOINT,
  region: process.env.R2_REGION || "auto",
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});
const prisma = new PrismaClient();

function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/[áàäâ]/g, "a")
    .replace(/[éèëê]/g, "e")
    .replace(/[íìïî]/g, "i")
    .replace(/[óòöô]/g, "o")
    .replace(/[úùüû]/g, "u")
    .replace(/ñ/g, "n")
    .replace(/[^a-z0-9]+/g, "");
}

function publicUrl(base: string, key: string): string {
  return `${base}/${encodeURI(key).replace(/'/g, "%27").replace(/!/g, "%21")}`;
}

async function listAll(bucket: string): Promise<string[]> {
  const keys: string[] = [];
  let token: string | undefined;
  do {
    const out = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        ContinuationToken: token,
        MaxKeys: 1000,
      }),
    );
    for (const o of out.Contents ?? []) if (o.Key) keys.push(o.Key);
    token = out.IsTruncated ? out.NextContinuationToken : undefined;
  } while (token);
  return keys;
}

/** Split "Artist - Title.lrc" → norm(artist)+"|"+norm(title). */
function lyricsMatchKey(fileKey: string): string | null {
  const noExt = fileKey.replace(/\.(lrc|txt)$/i, "");
  const idx = noExt.indexOf(" - ");
  if (idx === -1) return null;
  return norm(noExt.slice(0, idx)) + "|" + norm(noExt.slice(idx + 3));
}

async function main() {
  const tracks = await prisma.track.findMany({
    where: { isCatalog: true },
    select: { id: true, artist: true, title: true, lyricsLrc: true },
  });
  console.log(`Catalog tracks: ${tracks.length}`);

  // ── 1) LYRICS ──────────────────────────────────────────────────────────────
  const lyricKeys = await listAll(process.env.R2_BUCKET_LYRICS!);
  const lyricsByKey = new Map<string, string>();
  for (const k of lyricKeys) {
    const mk = lyricsMatchKey(k);
    if (mk && !lyricsByKey.has(mk)) lyricsByKey.set(mk, k);
  }
  let lyricsSet = 0;
  let lyricsMiss = 0;
  for (const t of tracks) {
    const mk = norm(t.artist) + "|" + norm(t.title);
    const fileKey = lyricsByKey.get(mk);
    if (!fileKey) {
      lyricsMiss++;
      continue;
    }
    if (t.lyricsLrc) continue; // already populated
    const obj = await s3.send(
      new GetObjectCommand({
        Bucket: process.env.R2_BUCKET_LYRICS!,
        Key: fileKey,
      }),
    );
    // Stored verbatim; never logged.
    const body = await obj.Body!.transformToString("utf-8");
    await prisma.track.update({
      where: { id: t.id },
      data: { lyricsLrc: body },
    });
    lyricsSet++;
  }
  console.log(`Lyrics: ${lyricsSet} set, ${lyricsMiss} without a match.`);

  // ── 2) ARTIST IMAGES ────────────────────────────────────────────────────────
  const imgKeys = await listAll(process.env.R2_BUCKET_ARTIST_IMAGES!);
  // norm(name-from-filename) → public URL (after copying into images bucket).
  const imgByNorm = new Map<string, string>();
  for (const key of imgKeys) {
    const name = key.replace(/\.(webp|jpg|jpeg|png)$/i, "").replace(/_/g, " ");
    const destKey = `artists/${key}`;
    try {
      await s3.send(
        new CopyObjectCommand({
          Bucket: process.env.R2_BUCKET_IMAGES!,
          CopySource: encodeURI(`${process.env.R2_BUCKET_ARTIST_IMAGES}/${key}`),
          Key: destKey,
          ContentType: "image/webp",
          MetadataDirective: "REPLACE",
        }),
      );
    } catch (e) {
      console.warn(`  copy failed for ${key}: ${(e as Error).name}`);
      continue;
    }
    imgByNorm.set(norm(name), publicUrl(process.env.R2_PUBLIC_IMAGES_URL!, destKey));
  }

  // Resolve an image URL for an artist: exact → containment → manual alias.
  const ALIAS: Record<string, string> = {
    "billie eilish": "billie elish",
    "maroon 5": "marron 5",
    "guns n' roses": "guns and roses",
    camila: "camila grupo",
    "grupo 5": "grupo5",
    "katy perry": "katty perry",
    "wisin y yandel": "wisin yandel",
  };
  function imageForArtist(artist: string): string | null {
    const a = norm(artist);
    if (imgByNorm.has(a)) return imgByNorm.get(a)!;
    const alias = ALIAS[artist.toLowerCase()];
    if (alias && imgByNorm.has(norm(alias))) return imgByNorm.get(norm(alias))!;
    // containment either way (e.g. "camila" ⊂ "camilagrupo")
    for (const [n, url] of imgByNorm) {
      if (n.length >= 4 && (n.includes(a) || a.includes(n))) return url;
    }
    return null;
  }

  const artists = [...new Set(tracks.map((t) => t.artist))];
  let imgSet = 0;
  const unmatched: string[] = [];
  for (const artist of artists) {
    const url = imageForArtist(artist);
    if (!url) {
      unmatched.push(artist);
      continue;
    }
    const res = await prisma.track.updateMany({
      where: { artist, isCatalog: true },
      data: { artistImage: url },
    });
    imgSet += res.count;
  }
  console.log(
    `Artist images: applied to ${imgSet} tracks across ${artists.length - unmatched.length}/${artists.length} artists.`,
  );
  if (unmatched.length) console.log(`  Unmatched artists: ${unmatched.join(", ")}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
