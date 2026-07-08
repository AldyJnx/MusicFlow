import { createHash } from "crypto";
import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { StorageService } from "@/modules/storage/storage.service";
import {
  extractEmbeddedCover,
  extractEmbeddedLyrics,
} from "@/common/audio/track-metadata";
import { Prisma, TrackSource, SyncStatus } from "@prisma/client";
import { attachEqStatus } from "./eq-status.util";

function hasLrcTimestamps(value: string): boolean {
  return /\[\d{1,2}:\d{2}(?:\.\d{1,3})?\]/.test(value);
}

function uniqueKeys(keys: string[]): string[] {
  return [...new Set(keys.map((key) => key.trim()).filter(Boolean))];
}

@Injectable()
export class TracksService {
  private readonly logger = new Logger(TracksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  /**
   * Upload an audio file: extracts metadata, dedupes by hash, uploads to R2.
   * Returns the created Track row (or the existing one if hash collides).
   */
  async uploadFromFile(
    userId: string,
    file: Express.Multer.File,
    overrides?: Partial<{ title: string; artist: string; album: string }>,
  ) {
    const fileHash = createHash("sha256").update(file.buffer).digest("hex");

    const existing = await this.prisma.track.findUnique({
      where: { userId_fileHash: { userId, fileHash } },
    });
    if (existing) {
      throw new ConflictException({
        message: "Track already exists",
        trackId: existing.id,
      });
    }

    // Lazy-import music-metadata (ESM-only) so NestJS Jest config doesn't choke.
    const mm = await import("music-metadata");
    const meta = await mm
      .parseBuffer(file.buffer, file.mimetype)
      .catch(() => null);

    const upload = await this.storage.uploadAudio(file, `tracks/${userId}`);

    // Embedded artwork (ID3 APIC etc.) → R2, and embedded USLT/SYLT lyrics.
    const coverArt = await extractEmbeddedCover(
      meta,
      this.storage,
      `tracks/${userId}/covers`,
    );
    const lyrics = extractEmbeddedLyrics(meta);

    const created = await this.prisma.track.create({
      data: {
        user: { connect: { id: userId } },
        title:
          overrides?.title ??
          meta?.common.title ??
          file.originalname.replace(/\.[^.]+$/, ""),
        artist: overrides?.artist ?? meta?.common.artist ?? "Unknown Artist",
        album: overrides?.album ?? meta?.common.album ?? "",
        albumArtist: meta?.common.albumartist,
        genre: meta?.common.genre?.[0],
        year: meta?.common.year ?? undefined,
        trackNumber: meta?.common.track?.no ?? undefined,
        discNumber: meta?.common.disk?.no ?? undefined,
        composer: meta?.common.composer?.[0],
        durationMs: Math.round((meta?.format.duration ?? 0) * 1000),
        fileUrlRemote: upload.url,
        fileHash,
        fileSizeBytes: BigInt(file.size),
        codec: meta?.format.codec,
        bitrate: meta?.format.bitrate
          ? Math.round(meta.format.bitrate / 1000)
          : undefined,
        sampleRate: meta?.format.sampleRate,
        coverArt: coverArt ?? undefined,
        ...lyrics,
        source: TrackSource.SYNCED,
        syncStatus: SyncStatus.SYNCED,
      },
    });

    // Mirror embedded lyrics into the lyrics bucket (best-effort; the DB stays
    // the read source, so a storage hiccup must not fail the upload).
    const lrc = lyrics.lyricsLrc ?? lyrics.lyricsText;
    if (lrc) {
      try {
        await this.storage.uploadLyrics(created.id, lrc);
      } catch (err) {
        this.logger.warn(
          `Lyrics bucket write-through failed for track ${created.id}: ${
            (err as Error).message
          }`,
        );
      }
    }

    return created;
  }

  async findAll(
    userId: string,
    params?: {
      skip?: number;
      take?: number;
      search?: string;
      artist?: string;
      album?: string;
      genre?: string;
    },
  ) {
    // Note: Nest's `enableImplicitConversion` turns missing `?: number` query
    // params into NaN, not undefined — so destructuring defaults don't kick in.
    // Sanitize before handing them to Prisma.
    const rawSkip = params?.skip;
    const rawTake = params?.take;
    const skip = Number.isFinite(rawSkip) ? (rawSkip as number) : 0;
    const take = Number.isFinite(rawTake) ? (rawTake as number) : 50;
    const { search, artist, album, genre } = params || {};

    // The library view mixes the caller's private uploads with the global
    // catalog (Spotify-style). Ownership for edit/delete is still checked
    // against `userId` in the mutation services; this is read-only.
    const visibility: Prisma.TrackWhereInput = {
      OR: [{ userId }, { isCatalog: true }],
    };

    const filters: Prisma.TrackWhereInput[] = [];
    if (search) {
      filters.push({
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { artist: { contains: search, mode: "insensitive" } },
          { album: { contains: search, mode: "insensitive" } },
        ],
      });
    }
    if (artist)
      filters.push({ artist: { contains: artist, mode: "insensitive" } });
    if (album)
      filters.push({ album: { contains: album, mode: "insensitive" } });
    if (genre)
      filters.push({ genre: { contains: genre, mode: "insensitive" } });

    const where: Prisma.TrackWhereInput =
      filters.length > 0 ? { AND: [visibility, ...filters] } : visibility;

    const [rows, total] = await Promise.all([
      this.prisma.track.findMany({
        where,
        skip,
        take,
        // `id` is the final tiebreaker so pagination is deterministic even when
        // many rows share artist/album/trackNumber (e.g. empty album, null track
        // number) — otherwise page boundaries shift and rows can duplicate or
        // vanish across pages.
        orderBy: [
          { artist: "asc" },
          { album: "asc" },
          { trackNumber: "asc" },
          { id: "asc" },
        ],
      }),
      this.prisma.track.count({ where }),
    ]);

    // Strip the potentially-large lyrics from list payloads — they're fetched
    // on demand via GET /tracks/:id/lyrics. Keeps the catalog/library fast.
    const stripped = rows.map(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ({ lyricsLrc, lyricsText, ...rest }) => rest,
    );
    const tracks = await attachEqStatus(this.prisma, userId, stripped);

    return { tracks, total, skip, take };
  }

  async findById(id: string, userId: string) {
    const track = await this.prisma.track.findFirst({
      where: { id, OR: [{ userId }, { isCatalog: true }] },
      include: {
        segments: {
          include: { eqConfig: true },
          orderBy: { startMs: "asc" },
        },
      },
    });

    if (!track) {
      throw new NotFoundException("Track not found");
    }

    return track;
  }

  async getLyrics(id: string, userId: string) {
    const track = await this.prisma.track.findFirst({
      where: { id, OR: [{ userId }, { isCatalog: true }] },
      select: {
        id: true,
        artist: true,
        title: true,
        lyricsLrc: true,
        lyricsText: true,
      },
    });

    if (!track) {
      throw new NotFoundException("Track not found");
    }

    const bucketLrc = await this.findLyricsInBucket(track);
    const lrc = bucketLrc ?? track.lyricsLrc ?? null;
    const text =
      track.lyricsText ?? (lrc && !hasLrcTimestamps(lrc) ? lrc : null);

    return {
      trackId: track.id,
      lrc,
      text,
      hasLyrics: Boolean(lrc || text),
    };
  }

  private async findLyricsInBucket(track: {
    id: string;
    artist: string;
    title: string;
  }): Promise<string | null> {
    const keys = [
      `${track.id}.lrc`,
      `${track.artist} - ${track.title}.lrc`,
      `${track.artist}-${track.title}.lrc`,
    ];

    for (const key of uniqueKeys(keys)) {
      try {
        const lrc = await this.storage.getTextObject("lyrics", key);
        if (lrc?.trim()) return lrc;
      } catch (err) {
        this.logger.warn(
          `Lyrics bucket read failed for ${track.id}/${key}: ${
            (err as Error).message
          }`,
        );
      }
    }
    return null;
  }

  async create(userId: string, data: Prisma.TrackCreateWithoutUserInput) {
    return this.prisma.track.create({
      data: {
        ...data,
        user: { connect: { id: userId } },
      },
    });
  }

  async update(id: string, userId: string, data: Prisma.TrackUpdateInput) {
    const track = await this.prisma.track.findFirst({
      where: { id, userId },
    });

    if (!track) {
      throw new NotFoundException("Track not found");
    }

    return this.prisma.track.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, userId: string) {
    const track = await this.prisma.track.findFirst({
      where: { id, userId },
    });

    if (!track) {
      throw new NotFoundException("Track not found");
    }

    return this.prisma.track.delete({ where: { id } });
  }

  async getArtists(userId: string) {
    // Pull artist + image and reduce to one entry per artist, keeping the
    // first non-null image. Returns `{ name, imageUrl }` so the UI can show a
    // real photo (falling back to a gradient when absent).
    const rows = await this.prisma.track.findMany({
      where: { OR: [{ userId }, { isCatalog: true }] },
      select: { artist: true, artistImage: true },
      orderBy: { artist: "asc" },
    });

    const byArtist = new Map<string, string | null>();
    for (const r of rows) {
      const existing = byArtist.get(r.artist);
      if (existing == null && r.artistImage)
        byArtist.set(r.artist, r.artistImage);
      else if (!byArtist.has(r.artist))
        byArtist.set(r.artist, r.artistImage ?? null);
    }

    return [...byArtist.entries()]
      .map(([name, imageUrl]) => ({ name, imageUrl }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async getAlbums(userId: string, artist?: string) {
    const where: Prisma.TrackWhereInput = {
      OR: [{ userId }, { isCatalog: true }],
    };
    if (artist) where.artist = artist;

    const tracks = await this.prisma.track.findMany({
      where,
      select: { album: true, albumArtist: true, coverArt: true },
      distinct: ["album"],
      orderBy: { album: "asc" },
    });

    return tracks;
  }

  async getGenres(userId: string) {
    const tracks = await this.prisma.track.findMany({
      where: {
        OR: [{ userId }, { isCatalog: true }],
        genre: { not: "" },
      },
      select: { genre: true },
      distinct: ["genre"],
      orderBy: { genre: "asc" },
    });

    return tracks.map((t) => t.genre);
  }
}
