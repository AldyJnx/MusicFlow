/**
 * Streams each Track's WAV from R2, parses the RIFF header, walks PCM samples,
 * downsamples to N=2000 normalized peaks per channel, and writes them as JSON
 * to `tracks.peaks`. Idempotent — skips tracks that already have peaks.
 *
 * Why peaks: a 3:30 CD-quality WAV is ~37 MB on the wire and ~75 MB of
 * decoded PCM in RAM. Wavesurfer can render the waveform from a 2 000-entry
 * peaks array instead — ~20 KB on the wire, instant.
 *
 *   pnpm --filter @musicflow/backend run peaks:backfill
 */
import { readFileSync } from "fs";
import { join } from "path";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { PrismaClient } from "@prisma/client";

// ── env ──────────────────────────────────────────────────────────────────────
function loadEnv() {
  const text = readFileSync(join(__dirname, "..", ".env"), "utf8");
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
}
loadEnv();

const PEAKS_N = Number(process.env.PEAKS_N ?? 2000);

const s3 = new S3Client({
  endpoint: process.env.R2_ENDPOINT,
  region: process.env.R2_REGION || "auto",
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const prisma = new PrismaClient();

// ── WAV header parsing ───────────────────────────────────────────────────────

interface WavHeader {
  audioFormat: number; // 1 = PCM, 3 = IEEE float
  channels: number;
  sampleRate: number;
  bitsPerSample: number;
  dataOffset: number; // byte offset of PCM samples
  dataSize: number;
}

function parseWavHeader(buf: Buffer): WavHeader | null {
  if (buf.slice(0, 4).toString("ascii") !== "RIFF") return null;
  if (buf.slice(8, 12).toString("ascii") !== "WAVE") return null;

  let cursor = 12;
  let audioFormat = 1;
  let channels = 0;
  let sampleRate = 0;
  let bitsPerSample = 0;
  let dataOffset = 0;
  let dataSize = 0;

  while (cursor + 8 <= buf.length) {
    const id = buf.slice(cursor, cursor + 4).toString("ascii");
    const size = buf.readUInt32LE(cursor + 4);
    const body = cursor + 8;

    if (id === "fmt ") {
      audioFormat = buf.readUInt16LE(body + 0);
      channels = buf.readUInt16LE(body + 2);
      sampleRate = buf.readUInt32LE(body + 4);
      bitsPerSample = buf.readUInt16LE(body + 14);
    } else if (id === "data") {
      dataOffset = body;
      dataSize = size;
      break; // data is what we'll stream; stop walking
    }
    cursor = body + size + (size % 2);
  }

  if (!channels || !sampleRate || !bitsPerSample || !dataOffset) return null;
  return {
    audioFormat,
    channels,
    sampleRate,
    bitsPerSample,
    dataOffset,
    dataSize,
  };
}

// ── Peak extraction ──────────────────────────────────────────────────────────

/**
 * Read one normalized sample (-1..1) from a buffer at the given byte offset for
 * the given PCM/float format. Returns NaN if format isn't supported.
 */
function readSample(
  buf: Buffer,
  offset: number,
  audioFormat: number,
  bitsPerSample: number,
): number {
  if (audioFormat === 1) {
    // PCM signed integer
    if (bitsPerSample === 16) {
      return buf.readInt16LE(offset) / 32768;
    }
    if (bitsPerSample === 24) {
      // little-endian 24-bit signed
      const b0 = buf[offset];
      const b1 = buf[offset + 1];
      const b2 = buf[offset + 2];
      let v = (b2 << 16) | (b1 << 8) | b0;
      if (v & 0x800000) v |= ~0xffffff;
      return v / 8388608;
    }
    if (bitsPerSample === 32) {
      return buf.readInt32LE(offset) / 2147483648;
    }
    if (bitsPerSample === 8) {
      // unsigned 8-bit
      return (buf.readUInt8(offset) - 128) / 128;
    }
  } else if (audioFormat === 3 && bitsPerSample === 32) {
    return buf.readFloatLE(offset);
  }
  return NaN;
}

/**
 * Stream a WAV from the public r2.dev URL (fetch is faster + more resilient
 * than the S3 SDK here — buckets are public anyway). Produces peaks[N] (mono
 * mix), normalized -1..1.
 */
async function extractPeaksFromUrl(
  audioUrl: string,
): Promise<{ peaks: number[]; channels: number; sampleRate: number } | null> {
  const resp = await fetch(audioUrl);
  if (!resp.ok || !resp.body) {
    throw new Error(`HTTP ${resp.status} ${resp.statusText}`);
  }

  // Buffer until we have the WAV header fully parsed, then stream-walk PCM.
  const reader = resp.body.getReader();
  let header: WavHeader | null = null;
  let carry = Buffer.alloc(0);
  let totalBytesRead = 0;

  const N = PEAKS_N;
  let peaks: number[] = new Array(N).fill(0);
  let framesPerBucket = 1;
  let frameIdx = 0;
  let pcmStart = 0;

  // Read until done.
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    const chunk = Buffer.from(value);
    totalBytesRead += chunk.length;
    carry = carry.length ? Buffer.concat([carry, chunk]) : chunk;

    // Parse header lazily once we have enough bytes.
    if (!header) {
      if (carry.length < 64) continue;
      header = parseWavHeader(carry);
      if (!header) {
        if (carry.length > 1_000_000) return null; // give up if we never see fmt+data
        continue;
      }
      pcmStart = header.dataOffset;
      const bytesPerSample = header.bitsPerSample / 8;
      const frameSize = bytesPerSample * header.channels;
      const totalFrames = Math.floor(header.dataSize / frameSize);
      if (totalFrames === 0) return null;
      framesPerBucket = Math.max(1, Math.floor(totalFrames / N));
    }

    // Walk full frames in the buffer starting at the current PCM cursor.
    const bytesPerSample = header.bitsPerSample / 8;
    const frameSize = bytesPerSample * header.channels;
    const startInBuf = Math.max(0, pcmStart - (totalBytesRead - carry.length));
    if (startInBuf >= carry.length) continue;
    const fullFromStart =
      Math.floor((carry.length - startInBuf) / frameSize) * frameSize;
    const end = startInBuf + fullFromStart;

    for (let off = startInBuf; off + frameSize <= end; off += frameSize) {
      let sum = 0;
      for (let ch = 0; ch < header.channels; ch++) {
        sum += readSample(
          carry,
          off + ch * bytesPerSample,
          header.audioFormat,
          header.bitsPerSample,
        );
      }
      const mono = sum / header.channels;
      const bucket = Math.min(N - 1, Math.floor(frameIdx / framesPerBucket));
      const v = Math.abs(mono);
      if (v > peaks[bucket]) peaks[bucket] = v;
      frameIdx++;
    }

    // Drop processed bytes from the buffer to keep memory bounded.
    carry = carry.slice(end);
    pcmStart += end - startInBuf;
  }

  if (!header) return null;

  for (let i = 0; i < N; i++) {
    peaks[i] = Math.round(Math.min(1, peaks[i]) * 1000) / 1000;
  }

  return { peaks, channels: header.channels, sampleRate: header.sampleRate };
}

/** Retry wrapper for transient `fetch aborted` / network blips. */
async function extractPeaksWithRetry(
  audioUrl: string,
  attempts = 3,
): Promise<{ peaks: number[]; channels: number; sampleRate: number } | null> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await extractPeaksFromUrl(audioUrl);
    } catch (e) {
      lastErr = e;
      // Exponential-ish backoff. R2 free tier rate-limits aggressively.
      await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
    }
  }
  throw lastErr;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // Use raw SQL because the generated client may not yet know `peaks` column
  // (dev box couldn't re-run `prisma generate` due to a file lock).
  type Row = {
    id: string;
    title: string;
    artist: string;
    file_url_remote: string | null;
    file_size_bytes: bigint | null;
    has_peaks: boolean;
  };
  const tracks = await prisma.$queryRaw<Row[]>`
    SELECT id, title, artist, file_url_remote, file_size_bytes,
           (peaks IS NOT NULL) AS has_peaks
    FROM tracks
    WHERE file_url_remote IS NOT NULL
    ORDER BY artist, title
  `;

  console.log(`→ ${tracks.length} tracks total`);
  const bucketBase = process.env.R2_PUBLIC_AUDIO_URL!;
  const CONCURRENCY = Number(process.env.PEAKS_CONCURRENCY ?? 4);
  let done = 0,
    skipped = 0,
    failed = 0;

  // Build a job list, filtering skipped tracks up front so the worker pool
  // only sees actionable work.
  const jobs = tracks
    .filter((t) => {
      if (t.has_peaks) {
        skipped++;
        return false;
      }
      if (!t.file_url_remote || !t.file_url_remote.startsWith(bucketBase)) {
        console.warn(`  skip ${t.title}: URL outside R2 audio bucket`);
        skipped++;
        return false;
      }
      return true;
    })
    .map((t) => t); // keep as Row[]

  let cursor = 0;
  async function worker(workerId: number) {
    while (true) {
      const idx = cursor++;
      if (idx >= jobs.length) return;
      const t = jobs[idx];
      const size = Number(t.file_size_bytes ?? 0);
      const label = `[w${workerId}] ${t.artist} — ${t.title}`;
      const t0 = Date.now();
      try {
        const result = await extractPeaksWithRetry(t.file_url_remote!);
        if (!result) {
          console.log(`  ${label} … unsupported`);
          failed++;
          continue;
        }
        const payload = {
          v: 1,
          n: result.peaks.length,
          channels: result.channels,
          sampleRate: result.sampleRate,
          peaks: result.peaks,
        };
        await prisma.$executeRawUnsafe(
          `UPDATE tracks
           SET peaks = $1::jsonb,
               updated_at = NOW()
           WHERE id = $2`,
          JSON.stringify(payload),
          t.id,
        );
        done++;
        const dt = ((Date.now() - t0) / 1000).toFixed(1);
        console.log(
          `  +${done}/${jobs.length} ${label} (${(size / 1e6).toFixed(1)} MB) OK ${dt}s`,
        );
      } catch (e) {
        failed++;
        console.log(`  ${label} FAIL ${(e as Error).message}`);
      }
    }
  }

  await Promise.all(
    Array.from({ length: CONCURRENCY }, (_, i) => worker(i + 1)),
  );

  console.log(
    `\nDone. computed=${done} skipped=${skipped} failed=${failed} (N=${PEAKS_N})`,
  );
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
