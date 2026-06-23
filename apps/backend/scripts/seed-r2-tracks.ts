/**
 * One-shot seed/sync: list R2 buckets `music-flow` (audio) + `music-flow-images`
 * (covers), parse "Artist - Title.wav" filenames, match covers by title/album
 * first and artist fallback second, fetch the first 4 KiB of each WAV to read
 * its fmt header (sampleRate + byteRate) for accurate duration, and upsert Track
 * rows for the admin user.
 *
 * Idempotent: dedupes on (userId, fileHash) where fileHash = sha256(key). When
 * a track already exists, it still refreshes catalog visibility, coverArt and
 * album if a better cover match is found.
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
  const noExt = key.replace(/\.(wav|mp3|flac|ogg|m4a|mpeg)$/i, "");
  // Try common separators in order of strictness.
  const seps = [/ — /, / – /, / - /, / -/, /- /, /-/, / · /];
  for (const sep of seps) {
    const match = noExt.match(sep);
    if (match?.index && match.index > 0) {
      const artist = noExt.slice(0, match.index).trim();
      const titlePart = noExt.slice(match.index + match[0].length).trim();
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

type CoverCandidate = {
  key: string;
  url: string;
  album: string;
  artist: string;
  normAlbum: string;
  normArtist: string;
};

type TrackMetadata = {
  artist: string;
  title: string;
  coverArtist?: string;
  coverAlbum?: string;
};

function audioIdentity(key: string): string {
  return norm(key.replace(/\.(wav|mp3|flac|ogg|m4a|mpeg)$/i, ""));
}

function r2FileHash(bucket: string, key: string): string {
  return createHash("sha256").update(`r2://${bucket}/${key}`).digest("hex");
}

function addArtistAlias(
  coversByArtist: Map<string, CoverCandidate[]>,
  from: string,
  to: string,
) {
  const source = coversByArtist.get(norm(from));
  if (source && !coversByArtist.has(norm(to))) {
    coversByArtist.set(norm(to), source);
  }
}

function findCoverByArtistAlbum(
  coversByArtist: Map<string, CoverCandidate[]>,
  artist: string,
  album: string,
): CoverCandidate | null {
  return (
    coversByArtist
      .get(norm(artist))
      ?.find((cover) => cover.normAlbum === norm(album)) ?? null
  );
}

function resolveCover(
  artist: string,
  title: string,
  coversByArtist: Map<string, CoverCandidate[]>,
): CoverCandidate | null {
  const artistKeys = artist
    .split(/,| feat\.? | ft\.? | & /i)
    .map((part) => norm(part))
    .filter(Boolean);
  artistKeys.unshift(norm(artist));

  const candidates = artistKeys
    .flatMap((artistKey) => coversByArtist.get(artistKey) ?? [])
    .filter((cover, index, all) => {
      return all.findIndex((item) => item.key === cover.key) === index;
    });
  if (candidates.length === 0) return null;

  const normTitle = norm(title);
  const exactTitle = candidates.find((cover) => cover.normAlbum === normTitle);
  if (exactTitle) return exactTitle;

  const containsTitle = candidates.find((cover) => {
    return (
      normTitle.length >= 4 &&
      (cover.normAlbum.includes(normTitle) ||
        normTitle.includes(cover.normAlbum))
    );
  });
  if (containsTitle) return containsTitle;

  return candidates[0];
}

function normalizeAudioMetadata(
  key: string,
  coversByArtist: Map<string, CoverCandidate[]>,
): { artist: string; title: string } {
  const parsed = parseAudioKey(key);
  if (coversByArtist.has(norm(parsed.artist))) return parsed;

  const swapped = { artist: parsed.title, title: parsed.artist };
  if (coversByArtist.has(norm(swapped.artist))) return swapped;

  const firstTitlePart = parsed.title.split(/,| feat\.? | ft\.? | & /i)[0];
  if (coversByArtist.has(norm(firstTitlePart))) {
    return { artist: firstTitlePart.trim(), title: parsed.artist };
  }

  return parsed;
}

function resolveTrackMetadata(
  key: string,
  coversByArtist: Map<string, CoverCandidate[]>,
  metadataOverrides: Map<string, TrackMetadata>,
): TrackMetadata {
  return (
    metadataOverrides.get(audioIdentity(key)) ??
    normalizeAudioMetadata(key, coversByArtist)
  );
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
): Promise<{
  durationMs: number;
  sampleRate?: number;
  bitrate?: number;
} | null> {
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
          return {
            durationMs,
            sampleRate,
            bitrate: Math.round((byteRate * 8) / 1000),
          };
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
    const r: {
      Contents?: { Key?: string; Size?: number; LastModified?: Date }[];
      IsTruncated?: boolean;
      NextContinuationToken?: string;
    } = await s3.send(
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
  const ownerEmail = process.env.R2_SEED_OWNER_EMAIL;
  console.log("→ Loading seed owner user");
  const owner = await prisma.user.findFirst({
    where: ownerEmail
      ? { email: ownerEmail }
      : {
          OR: [{ role: "ADMIN" }, { isActive: true }],
        },
    orderBy: ownerEmail ? undefined : [{ role: "asc" }, { createdAt: "asc" }],
    select: { id: true, email: true },
  });
  if (!owner) {
    console.error(
      ownerEmail
        ? `Seed owner ${ownerEmail} not found. Create that user or update R2_SEED_OWNER_EMAIL.`
        : "No users found. Create an account before running the R2 seed.",
    );
    process.exit(1);
  }
  console.log("  owner =", owner.email, `(${owner.id})`);

  console.log("→ Listing R2 buckets");
  const audios = await listAll(process.env.R2_BUCKET_AUDIO!);
  const covers = await listAll(process.env.R2_BUCKET_IMAGES!);
  console.log(`  audio: ${audios.length} objects · images: ${covers.length}`);

  // Build artist → covers map. Exact title/album match is preferred; the first
  // cover for an artist is only a fallback when the bucket has no better clue.
  const coversByArtist = new Map<string, CoverCandidate[]>();
  for (const c of covers) {
    const { album, artist } = parseCoverKey(c.Key);
    const candidate: CoverCandidate = {
      key: c.Key,
      url: publicUrl(process.env.R2_PUBLIC_IMAGES_URL!, c.Key),
      album,
      artist,
      normAlbum: norm(album),
      normArtist: norm(artist),
    };
    const bucket = coversByArtist.get(candidate.normArtist) ?? [];
    bucket.push(candidate);
    coversByArtist.set(candidate.normArtist, bucket);
  }
  for (const list of coversByArtist.values()) {
    list.sort((a, b) => {
      const artistCompare = a.normArtist.localeCompare(b.normArtist);
      return artistCompare || a.normAlbum.localeCompare(b.normAlbum);
    });
  }
  // Manual aliases for the bucket's known typos and artist variants.
  addArtistAlias(coversByArtist, "Billie Elish", "Billie Eilish");
  addArtistAlias(coversByArtist, "Billie Eilish", "Billie Elish");
  addArtistAlias(coversByArtist, "The Weekend", "The Weeknd");
  addArtistAlias(coversByArtist, "The Weeknd", "The Weekend");
  addArtistAlias(coversByArtist, "Guns And Roses", "Guns N' Roses");
  addArtistAlias(coversByArtist, "Guns N' Roses", "Guns And Roses");
  addArtistAlias(coversByArtist, "Maroon 5", "Marron 5");
  addArtistAlias(coversByArtist, "Marron 5", "Maroon 5");

  const metadataOverrides = new Map<string, TrackMetadata>([
    [
      norm("Good Old-Fashioned Lover Boy"),
      {
        artist: "Queen",
        title: "Good Old-Fashioned Lover Boy",
        coverArtist: "Queen",
        coverAlbum: "A day at the Races",
      },
    ],
    [
      norm("Crazy Little Thing Called Love"),
      {
        artist: "Queen",
        title: "Crazy Little Thing Called Love",
        coverArtist: "Queen",
        coverAlbum: "The Game",
      },
    ],
    [
      norm("Love Of My Life"),
      {
        artist: "Queen",
        title: "Love Of My Life",
        coverArtist: "Queen",
        coverAlbum: "A Night at the Opera",
      },
    ],
    [
      norm("The black Eyed Peas Just Can’t Get Enough"),
      {
        artist: "The Black Eyed Peas",
        title: "Just Can't Get Enough",
        coverArtist: "The Black Eyed Peas",
        coverAlbum: "THE END (THE ENERGY NEVER DIES) Deluxe Version",
      },
    ],
    [
      norm("There Is a Light That Never Goes Out - The Smiths"),
      {
        artist: "The Smiths",
        title: "There Is a Light That Never Goes Out",
      },
    ],
    [
      norm("Thriller - Michael Jackson"),
      {
        artist: "Michael Jackson",
        title: "Thriller",
        coverArtist: "Michael Jackson",
        coverAlbum: "Thriller",
      },
    ],
  ]);

  let created = 0,
    skipped = 0,
    refreshed = 0,
    failed = 0,
    removedFromCatalog = 0;
  const liveFileHashes = new Set<string>();

  for (const a of audios) {
    const metadata = resolveTrackMetadata(
      a.Key,
      coversByArtist,
      metadataOverrides,
    );
    const { artist, title } = metadata;
    const cover =
      (metadata.coverArtist && metadata.coverAlbum
        ? findCoverByArtistAlbum(
            coversByArtist,
            metadata.coverArtist,
            metadata.coverAlbum,
          )
        : null) ?? resolveCover(artist, title, coversByArtist);
    const fileUrl = publicUrl(process.env.R2_PUBLIC_AUDIO_URL!, a.Key);
    const fileHash = r2FileHash(process.env.R2_BUCKET_AUDIO!, a.Key);
    liveFileHashes.add(fileHash);

    // Dedupe.
    const existing = await prisma.track.findUnique({
      where: { userId_fileHash: { userId: owner.id, fileHash } },
      select: {
        id: true,
        isCatalog: true,
        title: true,
        artist: true,
        albumArtist: true,
        coverArt: true,
        album: true,
      },
    });
    if (existing) {
      const updateData: {
        isCatalog?: true;
        title?: string;
        artist?: string;
        albumArtist?: string;
        coverArt?: string;
        album?: string;
      } = {};
      if (!existing.isCatalog) updateData.isCatalog = true;
      if (existing.title !== title) updateData.title = title;
      if (existing.artist !== artist) updateData.artist = artist;
      if (existing.albumArtist !== artist) updateData.albumArtist = artist;
      if (cover?.url && existing.coverArt !== cover.url) {
        updateData.coverArt = cover.url;
      }
      if (cover?.album && (!existing.album || existing.album !== cover.album)) {
        updateData.album = cover.album;
      }
      if (Object.keys(updateData).length > 0) {
        await prisma.track.update({
          where: { id: existing.id },
          data: updateData,
        });
        refreshed++;
      }
      skipped++;
      continue;
    }

    const probe = await probeWavDuration(
      process.env.R2_BUCKET_AUDIO!,
      a.Key,
      a.Size,
    );
    // Fallback: assume CD-quality stereo (176_400 byte/s) if probe failed.
    const durationMs = probe?.durationMs ?? Math.round((a.Size - 44) / 176.4);

    try {
      await prisma.track.create({
        data: {
          userId: owner.id,
          title,
          artist,
          album: cover?.album ?? "",
          albumArtist: artist,
          genre: "",
          durationMs,
          fileUrlRemote: fileUrl,
          fileHash,
          fileSizeBytes: BigInt(a.Size),
          codec: "wav",
          bitrate: probe?.bitrate ?? null,
          sampleRate: probe?.sampleRate ?? null,
          coverArt: cover?.url ?? null,
          isCatalog: true,
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

  const staleCatalog = await prisma.track.updateMany({
    where: {
      userId: owner.id,
      isCatalog: true,
      source: "SYNCED",
      fileUrlRemote: { startsWith: process.env.R2_PUBLIC_AUDIO_URL! },
      fileHash: { notIn: Array.from(liveFileHashes) },
    },
    data: { isCatalog: false },
  });
  removedFromCatalog = staleCatalog.count;

  console.log(
    `\nDone. created=${created} skipped=${skipped} refreshed=${refreshed} removedFromCatalog=${removedFromCatalog} failed=${failed} (covers matched=${
      audios.filter((a) => {
        const metadata = resolveTrackMetadata(
          a.Key,
          coversByArtist,
          metadataOverrides,
        );
        return (
          (metadata.coverArtist && metadata.coverAlbum
            ? findCoverByArtistAlbum(
                coversByArtist,
                metadata.coverArtist,
                metadata.coverAlbum,
              )
            : null) ??
          resolveCover(metadata.artist, metadata.title, coversByArtist)
        );
      }).length
    })`,
  );
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
