/**
 * One-time backfill: mirror every track's lyrics from the DB into the lyrics
 * bucket as a `.lrc` object keyed by track id — matching StorageService.uploadLyrics.
 *
 * The DB stays the read source; this just brings the bucket in sync with what
 * already exists. Idempotent (overwrites the same key). Run:
 *   pnpm --filter @musicflow/backend run mirror:lyrics
 */
import { readFileSync } from "fs";
import { join } from "path";
import { PrismaClient } from "@prisma/client";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

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

const prisma = new PrismaClient();

const endpoint =
  process.env.R2_ENDPOINT ??
  process.env.AWS_S3_ENDPOINT ??
  "http://localhost:9000";

const s3 = new S3Client({
  endpoint,
  region: process.env.R2_REGION ?? process.env.AWS_S3_REGION ?? "auto",
  credentials: {
    accessKeyId:
      process.env.R2_ACCESS_KEY ?? process.env.AWS_ACCESS_KEY_ID ?? "",
    secretAccessKey:
      process.env.R2_SECRET_ACCESS_KEY ??
      process.env.AWS_SECRET_ACCESS_KEY ??
      "",
  },
  forcePathStyle: !endpoint.includes("r2.cloudflarestorage.com"),
});

const BUCKET = process.env.R2_BUCKET_LYRICS ?? "music-flow-songs-lyrics";

async function main() {
  const tracks = await prisma.track.findMany({
    where: {
      OR: [{ lyricsLrc: { not: null } }, { lyricsText: { not: null } }],
    },
    select: { id: true, title: true, lyricsLrc: true, lyricsText: true },
  });

  console.log(
    `Found ${tracks.length} tracks with lyrics. Mirroring to bucket "${BUCKET}"…`,
  );

  let ok = 0;
  let failed = 0;
  for (const t of tracks) {
    const lrc = t.lyricsLrc ?? t.lyricsText;
    if (!lrc) continue;
    try {
      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: `${t.id}.lrc`,
          Body: lrc,
          ContentType: "text/plain; charset=utf-8",
        }),
      );
      ok += 1;
    } catch (err) {
      failed += 1;
      console.error(`  ✗ ${t.title} (${t.id}): ${(err as Error).message}`);
    }
  }

  console.log(`Done. Mirrored ${ok}, failed ${failed}.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
