/**
 * Transcode uncompressed catalog audio (WAV/PCM) to a lightweight streaming
 * asset (AAC .m4a) and repoint the DB at it, while preserving the lossless
 * original for the offline-download feature.
 *
 * For each matching track it:
 *   1. downloads the original from R2 (public URL),
 *   2. re-encodes to AAC with ffmpeg (`-movflags +faststart` for instant play),
 *   3. uploads the `.m4a` next to the original in the audio bucket,
 *   4. moves the old WAV URL into `originalUrlRemote` and points `fileUrlRemote`
 *      at the compressed asset, refreshing `codec`/`bitrate`/`fileSizeBytes`.
 *
 * Idempotent: skips tracks whose `originalUrlRemote` is already set (i.e. already
 * transcoded). The WAV objects in R2 are never deleted.
 *
 * Usage:
 *   pnpm --filter @musicflow/backend exec ts-node scripts/transcode-catalog.ts [--limit N] [--bitrate 256] [--dry]
 *     --limit N     process at most N tracks (default: all)
 *     --bitrate K   AAC bitrate in kbps (default: 256)
 *     --dry         transcode + measure only; do NOT upload or touch the DB
 */
import { spawnSync } from "child_process";
import { createHash } from "crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { PrismaClient } from "@prisma/client";
// ffmpeg-static's module.exports is the binary path string; require keeps it
// robust regardless of esModuleInterop settings under ts-node.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ffmpegPath: string | null = require("ffmpeg-static");

// ── env loading (standalone, like seed-r2-tracks.ts) ─────────────────────────
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
  "R2_BUCKET_AUDIO",
  "R2_PUBLIC_AUDIO_URL",
];
for (const k of REQUIRED) {
  if (!process.env[k]) {
    console.error(`Missing env var ${k}`);
    process.exit(1);
  }
}

// ── args ─────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
function argVal(name: string): string | undefined {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
}
const LIMIT = argVal("--limit") ? parseInt(argVal("--limit")!, 10) : Infinity;
const BITRATE = argVal("--bitrate") ? parseInt(argVal("--bitrate")!, 10) : 256;
const DRY = argv.includes("--dry");

const AUDIO_BASE = process.env.R2_PUBLIC_AUDIO_URL!.replace(/\/+$/, "");

const s3 = new S3Client({
  endpoint: process.env.R2_ENDPOINT,
  region: process.env.R2_REGION || "auto",
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});
const prisma = new PrismaClient();

// ── helpers ──────────────────────────────────────────────────────────────────
const mb = (n: number | bigint) => (Number(n) / 1024 / 1024).toFixed(1) + " MB";

/** Extract the R2 object key from a public URL. */
function keyFromUrl(url: string): string {
  return decodeURIComponent(new URL(url).pathname.replace(/^\/+/, ""));
}

/** Build a public URL for an object key (spaces → %20, keeps the path flat). */
function urlFromKey(key: string): string {
  return `${AUDIO_BASE}/${encodeURIComponent(key)}`;
}

async function main() {
  if (!ffmpegPath) {
    console.error("ffmpeg-static did not resolve a binary path.");
    process.exit(1);
  }

  // Candidates: catalog tracks not yet transcoded, whose original is a lossless
  // container. We key idempotency off originalUrlRemote so re-runs are safe.
  const candidates = await prisma.track.findMany({
    where: {
      originalUrlRemote: null,
      fileUrlRemote: { not: null },
      OR: [
        { fileUrlRemote: { endsWith: ".wav" } },
        { fileUrlRemote: { endsWith: ".WAV" } },
        { fileUrlRemote: { endsWith: ".flac" } },
        { codec: { in: ["wav", "WAV", "PCM", "flac"] } },
      ],
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      artist: true,
      fileUrlRemote: true,
      fileSizeBytes: true,
      codec: true,
    },
  });

  const batch = candidates.slice(0, LIMIT);
  console.log(
    `Found ${candidates.length} track(s) to transcode; processing ${batch.length}` +
      ` @ AAC ${BITRATE}k${DRY ? " (DRY RUN — no upload/DB writes)" : ""}\n`,
  );

  const tmp = mkdtempSync(join(tmpdir(), "mf-transcode-"));
  let ok = 0;
  let origTotal = 0;
  let newTotal = 0;

  try {
    for (const [i, t] of batch.entries()) {
      const label = `[${i + 1}/${batch.length}] ${t.artist} — ${t.title}`;
      try {
        const srcKey = keyFromUrl(t.fileUrlRemote!);
        const outKey = srcKey.replace(/\.[^.]+$/, "") + ".m4a";
        const inPath = join(tmp, "in" + createHash("md5").update(srcKey).digest("hex").slice(0, 8));
        const outPath = join(tmp, "out.m4a");

        // 1. download original
        const res = await fetch(t.fileUrlRemote!);
        if (!res.ok) throw new Error(`download HTTP ${res.status}`);
        const srcBuf = Buffer.from(await res.arrayBuffer());
        writeFileSync(inPath, srcBuf);

        // 2. transcode → AAC (.m4a), faststart so the moov atom is up front
        const ff = spawnSync(
          ffmpegPath as string,
          ["-y", "-i", inPath, "-vn", "-c:a", "aac", "-b:a", `${BITRATE}k`, "-movflags", "+faststart", outPath],
          { stdio: ["ignore", "ignore", "pipe"], maxBuffer: 64 * 1024 * 1024 },
        );
        if (ff.status !== 0) {
          throw new Error("ffmpeg failed: " + (ff.stderr?.toString().split("\n").slice(-3).join(" ") ?? ""));
        }
        const outBuf = readFileSync(outPath);

        origTotal += srcBuf.length;
        newTotal += outBuf.length;
        const pct = ((1 - outBuf.length / srcBuf.length) * 100).toFixed(0);
        console.log(`${label}\n   ${mb(srcBuf.length)} → ${mb(outBuf.length)}  (-${pct}%)`);

        if (!DRY) {
          // 3. upload compressed asset
          await s3.send(
            new PutObjectCommand({
              Bucket: process.env.R2_BUCKET_AUDIO!,
              Key: outKey,
              Body: outBuf,
              ContentType: "audio/mp4",
            }),
          );
          // 4. repoint DB, preserving the lossless original
          await prisma.track.update({
            where: { id: t.id },
            data: {
              originalUrlRemote: t.fileUrlRemote,
              fileUrlRemote: urlFromKey(outKey),
              codec: "aac",
              bitrate: BITRATE,
              fileSizeBytes: BigInt(outBuf.length),
            },
          });
          console.log(`   ✓ uploaded ${outKey} + DB updated`);
        }

        rmSync(inPath, { force: true });
        ok++;
      } catch (err) {
        console.error(`${label}\n   ✗ ${(err as Error).message}`);
      }
    }
  } finally {
    rmSync(tmp, { recursive: true, force: true });
    await prisma.$disconnect();
  }

  console.log(
    `\nDone: ${ok}/${batch.length} ok. Total ${mb(origTotal)} → ${mb(newTotal)}` +
      (origTotal ? `  (-${((1 - newTotal / origTotal) * 100).toFixed(0)}%)` : ""),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
