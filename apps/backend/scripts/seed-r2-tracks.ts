/**
 * One-shot seed: list R2 buckets `music-flow` (audio) + `music-flow-images`
 * (covers), parse "Artist - Title.wav" filenames, match covers by artist, fetch
 * the first 4 KiB of each WAV to read its fmt header (sampleRate + byteRate)
 * for accurate duration, and insert Track rows for the admin user.
 *
 * Idempotent: dedupes on (userId, fileHash) where fileHash = sha256(key).
 *
 * Run with:
 *   pnpm --filter @musicflow/backend run seed:r2
 */
import { createHash } from "crypto";
import { readFileSync } from "fs";
import { join } from "path";
import {
  GetObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3";
import { PrismaClient } from "@prisma/client";

// ── env loading (we don't depend on Nest config here) ────────────────────────
function loadEnv() {
  const text = readFileSync(join(__dirname, "..", ".env"), "utf8");
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
}
loadEnv();

const REQUIRED = [
  "DATABASE_URL",
  "R2_ENDPOINT",
  "R2_ACCESS_KEY",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_AUDIO",
  "R2_BUCKET_IMAGES",
  "R2_PUBLIC_AUDIO_URL",
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

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Normalize a string for fuzzy matching: lowercase, strip non-alphanum. */
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

/**
 * Parse audio key "Artist - Title.wav" → { artist, title }.
 * Tolerates the variants in the bucket: "Artist- Title", "Artist-Title",
 * "Artist – Title" (em dash), and unparseable names fall back to title-only.
 */
function parseAudioKey(key: string): { artist: string; title: string } {
  const noExt = key.replace(/\.(wav|mp3|flac|ogg|m4a)$/i, "");
  // Try common separators in order of strictness.
  const seps = [/ — /, / – /, / - /, / -/, /- /, /-/, / · /];
  for (const sep of seps) {
    const idx = noExt.search(sep);
    if (idx > 0) {
      const artist = noExt.slice(0, idx).trim();
      const titlePart = noExt.slice(idx + (sep.source.length || 1)).trim();
      // Some titles have a trailing artist suffix like ", Artist2". Keep as-is.
      if (artist && titlePart) return { artist, title: titlePart };
    }
  }
  return { artist: "Unknown Artist", title: noExt.trim() };
}

/**
 * Parse cover key "Album Name - Artist.jpg" → { album, artist }.
 * Tolerates the same variants as audio keys.
 */
function parseCoverKey(key: string): { album: string; artist: string } {
  const noExt = key.replace(/\.(jpe?g|png|webp)$/i, "");
  // Covers consistently use " - " with the artist as the LAST segment.
  const parts = noExt.split(/ - /);
  if (parts.length >= 2) {
    const artist = parts[parts.length - 1].trim();
    const album = parts.slice(0, -1).join(" - ").trim();
    return { album, artist };
  }
  return { album: noExt.trim(), artist: "Unknown" };
}

/** Build the public URL for an R2 key (proper percent-encoding for spaces, ', etc). */
function publicUrl(base: string, key: string): string {
  // encodeURI keeps the slash structure; we manually encode characters that
  // encodeURI leaves alone but Cloudflare expects encoded (apostrophe).
  return `${base}/${encodeURI(key).replace(/'/g, "%27").replace(/!/g, "%21")}`;
}

/**
 * Fetch the first ~4 KiB of an audio file via Range request and try to parse a
 * WAV header. Returns { durationMs, sampleRate, bitrate } or null if unparseable.
 *
 * WAV layout (RIFF): "RIFF" <size> "WAVE" "fmt " <chunkSize> <format chunk>
 * The "fmt " chunk gives sampleRate (offset 12 within chunk) and byteRate
 * (offset 16). Duration ≈ (totalSize - headerBytes) / byteRate.
 */
async function probeWavDuration(
  bucket: string,
  key: string,
  totalBytes: number,
): Promise<{ durationMs: number; sampleRate?: number; bitrate?: number } | null> {
  try {
    const obj = await s3.send(
      new GetObjectCommand({ Bucket: bucket, Key: key, Range: "bytes=0-4095" }),
    );
    const chunks: Uint8Array[] = [];
    for await (const c of obj.Body as AsyncIterable<Uint8Array>) chunks.push(c);
    const buf = Buffer.concat(chunks.map((c) => Buffer.from(c)));

    if (buf.slice(0, 4).toString("ascii") !== "RIFF") return null;
    if (buf.slice(8, 12).toString("ascii") !== "WAVE") return null;

    // Walk chunks starting at offset 12 until we find "fmt ".
    let cursor = 12;
    while (cursor + 8 <= buf.length) {
      const id = buf.slice(cursor, cursor + 4).toString("ascii");
      const size = buf.readUInt32LE(cursor + 4);
      if (id === "fmt ") {
        // Format chunk: <PCM tag 2><channels 2><sampleRate 4><byteRate 4>...
        const sampleRate = buf.readUInt32LE(cursor + 8 + 4);
        const byteRate = buf.readUInt32LE(cursor + 8 + 8);
        if (byteRate > 0) {
          const audioBytes = Math.max(0, totalBytes - 44);
          const durationMs = Math.round((audioBytes / byteRate) * 1000);
          return { durationMs, sampleRate, bitrate: Math.round((byteRate * 8) / 1000) };
        }
        return null;
      }
      cursor += 8 + size + (size % 2); // chunks are word-aligned
    }
  } catch (e) {
    console.warn(`  probe failed for ${key}: ${(e as Error).message}`);
  }
  return null;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function listAll(bucket: string) {
  const all: { Key: string; Size: number; LastModified?: Date }[] = [];
  let token: string | undefined;
  do {
    const r: { Contents?: { Key?: string; Size?: number; LastModified?: Date }[]; IsTruncated?: boolean; NextContinuationToken?: string } =
      await s3.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          ContinuationToken: token,
          MaxKeys: 1000,
        }),
      );
    for (const o of r.Contents ?? []) {
      if (o.Key && typeof o.Size === "number") {
        all.push({ Key: o.Key, Size: o.Size, LastModified: o.LastModified });
      }
    }
    token = r.IsTruncated ? r.NextContinuationToken : undefined;
  } while (token);
  return all;
}

async function main() {
  console.log("→ Loading admin user");
  const admin = await prisma.user.findFirst({
    where: { email: "admin@musicflow.app" },
    select: { id: true, email: true },
  });
  if (!admin) {
    console.error("Admin user not found. Run the auth seed first.");
    process.exit(1);
  }
  console.log("  owner =", admin.email, `(${admin.id})`);

  console.log("→ Listing R2 buckets");
  const audios = await listAll(process.env.R2_BUCKET_AUDIO!);
  const covers = await listAll(process.env.R2_BUCKET_IMAGES!);
  console.log(`  audio: ${audios.length} objects · images: ${covers.length}`);

  // Build artist → coverUrl map (first cover per artist wins).
  const coverByArtist = new Map<string, string>();
  for (const c of covers) {
    const { artist } = parseCoverKey(c.Key);
    const norm_ = norm(artist);
    if (!coverByArtist.has(norm_)) {
      coverByArtist.set(
        norm_,
        publicUrl(process.env.R2_PUBLIC_IMAGES_URL!, c.Key),
      );
    }
  }
  // Manual aliases for the bucket's known typos.
  // "Billie Elish" (typo) → match "Billie Eilish" and vice-versa.
  if (coverByArtist.has(norm("Billie Elish")) && !coverByArtist.has(norm("Billie Eilish"))) {
    coverByArtist.set(norm("Billie Eilish"), coverByArtist.get(norm("Billie Elish"))!);
  }
  if (coverByArtist.has(norm("The Weekend")) && !coverByArtist.has(norm("The Weeknd"))) {
    coverByArtist.set(norm("The Weeknd"), coverByArtist.get(norm("The Weekend"))!);
  }
  if (coverByArtist.has(norm("Guns And Roses")) && !coverByArtist.has(norm("Guns N' Roses"))) {
    coverByArtist.set(norm("Guns N' Roses"), coverByArtist.get(norm("Guns And Roses"))!);
  }

  let created = 0,
    skipped = 0,
    failed = 0;

  for (const a of audios) {
    const { artist, title } = parseAudioKey(a.Key);
    const cover = coverByArtist.get(norm(artist)) ?? null;
    const fileUrl = publicUrl(process.env.R2_PUBLIC_AUDIO_URL!, a.Key);
    const fileHash = createHash("sha256")
      .update(`r2://${process.env.R2_BUCKET_AUDIO}/${a.Key}`)
      .digest("hex");

    // Dedupe.
    const existing = await prisma.track.findUnique({
      where: { userId_fileHash: { userId: admin.id, fileHash } },
      select: { id: true },
    });
    if (existing) {
      skipped++;
      continue;
    }

    const probe = await probeWavDuration(
      process.env.R2_BUCKET_AUDIO!,
      a.Key,
      a.Size,
    );
    // Fallback: assume CD-quality stereo (176_400 byte/s) if probe failed.
    const durationMs =
      probe?.durationMs ?? Math.round((a.Size - 44) / 176.4);

    try {
      await prisma.track.create({
        data: {
          userId: admin.id,
          title,
          artist,
          album: "",
          albumArtist: artist,
          genre: "",
          durationMs,
          fileUrlRemote: fileUrl,
          fileHash,
          fileSizeBytes: BigInt(a.Size),
          codec: "wav",
          bitrate: probe?.bitrate ?? null,
          sampleRate: probe?.sampleRate ?? null,
          coverArt: cover,
          source: "SYNCED",
          syncStatus: "SYNCED",
        },
      });
      created++;
      console.log(
        `  +${created}/${audios.length}  ${artist} — ${title}  (${(a.Size / 1e6).toFixed(1)} MB, ${(durationMs / 1000).toFixed(0)}s)`,
      );
    } catch (e) {
      failed++;
      console.warn(`  FAIL ${a.Key}: ${(e as Error).message}`);
    }
  }

  console.log(
    `\nDone. created=${created} skipped=${skipped} failed=${failed} (covers matched=${
      audios.filter((a) => coverByArtist.has(norm(parseAudioKey(a.Key).artist))).length
    })`,
  );
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
