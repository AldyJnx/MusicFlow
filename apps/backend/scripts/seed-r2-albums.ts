/**
 * Seeds Album entities from the cover bucket, whose keys are
 * "Album Name - Artist.jpg". The audio filenames carry no album, so tracks are
 * NOT auto-assigned here (that mapping doesn't exist in the data and guessing
 * would be wrong) — the admin assigns tracks to albums in the catalog UI. This
 * just gives them a populated, cover-art-rich starting point per artist.
 *
 * Matches each cover's artist to an existing Artist row (exact → alias →
 * containment, same strategy as seed-r2-enrich). Idempotent: upserts on the
 * (artistId, title) unique key. Run with:
 *   pnpm --filter @musicflow/backend run seed:albums
 */
import { readFileSync } from "fs";
import { join } from "path";
import { ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
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

/** Parse "Album Name - Artist.jpg" → { album, artist } (artist is last segment). */
function parseCoverKey(key: string): { album: string; artist: string } | null {
  const noExt = key.replace(/\.(jpe?g|png|webp)$/i, "");
  const parts = noExt.split(/ - /);
  if (parts.length < 2) return null;
  const artist = parts[parts.length - 1].trim();
  const album = parts.slice(0, -1).join(" - ").trim();
  if (!artist || !album) return null;
  return { album, artist };
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

// Cover-filename artist spelling → DB artist spelling, for the bucket's typos.
const ALIAS: Record<string, string> = {
  "the weekend": "the weeknd",
  "guns and roses": "guns n' roses",
  "enantios verdes": "enanitos verdes",
  "billie elish": "billie eilish",
  "maroon 5": "marron 5",
};

async function main() {
  const artists = await prisma.artist.findMany({
    select: { id: true, name: true, imageUrl: true },
  });
  const idByNorm = new Map<string, string>();
  for (const a of artists) idByNorm.set(norm(a.name), a.id);

  function artistIdFor(coverArtist: string): string | null {
    const n = norm(coverArtist);
    if (idByNorm.has(n)) return idByNorm.get(n)!;
    const alias = ALIAS[coverArtist.toLowerCase()];
    if (alias && idByNorm.has(norm(alias))) return idByNorm.get(norm(alias))!;
    for (const [dn, id] of idByNorm) {
      if (dn.length >= 4 && (dn.includes(n) || n.includes(dn))) return id;
    }
    return null;
  }

  const covers = await listAll(process.env.R2_BUCKET_IMAGES!);
  console.log(`Cover objects: ${covers.length}`);

  let created = 0;
  let updated = 0;
  const unmatched = new Set<string>();
  // De-dupe (artistId,title) within this run so two covers don't fight.
  const seen = new Set<string>();

  for (const key of covers) {
    const parsed = parseCoverKey(key);
    if (!parsed) continue;
    const artistId = artistIdFor(parsed.artist);
    if (!artistId) {
      unmatched.add(parsed.artist);
      continue;
    }
    const dedupeKey = `${artistId}::${norm(parsed.album)}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    const coverUrl = publicUrl(process.env.R2_PUBLIC_IMAGES_URL!, key);
    const existing = await prisma.album.findUnique({
      where: { artistId_title: { artistId, title: parsed.album } },
      select: { id: true },
    });
    if (existing) {
      await prisma.album.update({
        where: { id: existing.id },
        data: { coverArt: coverUrl },
      });
      updated++;
    } else {
      await prisma.album.create({
        data: { artistId, title: parsed.album, coverArt: coverUrl },
      });
      created++;
    }
  }

  console.log(`Albums: ${created} created, ${updated} updated.`);
  if (unmatched.size) {
    console.log(
      `  Unmatched cover artists (no Artist row): ${[...unmatched].join(", ")}`,
    );
  }
  const total = await prisma.album.count();
  console.log(`Total albums now: ${total}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
