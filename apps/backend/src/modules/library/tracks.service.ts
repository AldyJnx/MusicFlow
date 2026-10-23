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

const trackListInclude = {
  featuredArtists: {
    orderBy: { position: "asc" },
    select: {
      artistName: true,
      artistId: true,
      position: true,
    },
  },
} satisfies Prisma.TrackInclude;

type PageParams = {
  query?: string;
  offset?: number | string;
  limit?: number | string;
};

function normalizePage(params: PageParams) {
  const parsedOffset = Number(params.offset ?? 0);
  const parsedLimit = Number(params.limit ?? 6);
  const offset = Number.isFinite(parsedOffset)
    ? Math.max(0, Math.trunc(parsedOffset))
    : 0;
  const limit = Number.isFinite(parsedLimit)
    ? Math.min(24, Math.max(1, Math.trunc(parsedLimit)))
    : 6;
  return { offset, limit, query: params.query?.trim() ?? "" };
}

/**
 * Legacy imports occasionally stored `Main Artist ft. Guest` in Track.artist.
 * Read it as the same per-song relationship used by new catalog uploads so a
 * historic row cannot become a synthetic public artist profile while the
 * maintenance repair is pending.
 */
function splitLegacyFeaturingArtist(value: string): {
  artist: string;
  featuredArtistNames: string[];
} | null {
  const match = value.match(/^(.+?)\s+(?:feat(?:uring)?|ft)\.?\s+(.+)$/iu);
  if (!match) return null;
  const artist = match[1]?.trim();
  const featuredArtistNames = (match[2] ?? "")
    .split(/\s*(?:,|&|\band\b|\by\b)\s*/iu)
    .map((name) => name.trim())
    .filter(Boolean);
  return artist && featuredArtistNames.length > 0
    ? { artist, featuredArtistNames }
    : null;
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
        await this.storage.uploadLyrics(created.artist, created.title, lrc);
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
    // A published catalog row is only public while it still belongs to an
    // admin-managed artist.  Artist deletion uses SetNull for the relation;
    // without this guard those orphaned rows would remain visible to users.
    const visibility: Prisma.TrackWhereInput = {
      OR: [
        { userId, isCatalog: false },
        { isCatalog: true, artistId: { not: null } },
      ],
    };

    const filters: Prisma.TrackWhereInput[] = [];
    if (search) {
      filters.push({
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { artist: { contains: search, mode: "insensitive" } },
          { album: { contains: search, mode: "insensitive" } },
          {
            featuredArtists: {
              some: {
                artistName: { contains: search, mode: "insensitive" },
              },
            },
          },
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
        distinct: ["artist", "title"],
        // `id` is the final tiebreaker so pagination is deterministic even when
        // many rows share artist/album/trackNumber (e.g. empty album, null track
        // number) — otherwise page boundaries shift and rows can duplicate or
        // vanish across pages.
        orderBy: [
          { artist: "asc" },
          { title: "asc" },
          { album: "asc" },
          { trackNumber: "asc" },
          { id: "asc" },
        ],
        include: trackListInclude,
      }),
      this.prisma.track.count({ where }),
    ]);

    // Strip the potentially-large lyrics from list payloads — they're fetched
    // on demand via GET /tracks/:id/lyrics. Keeps the catalog/library fast.
    const stripped = rows.map(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ({ lyricsLrc, lyricsText, ...rest }) => {
        const legacyFeaturing = rest.isCatalog
          ? splitLegacyFeaturingArtist(rest.artist)
          : null;
        if (!legacyFeaturing) return rest;
        return {
          ...rest,
          artist: legacyFeaturing.artist,
          featuredArtists:
            rest.featuredArtists.length > 0
              ? rest.featuredArtists
              : legacyFeaturing.featuredArtistNames.map(
                  (artistName, position) => ({
                    artistName,
                    artistId: null,
                    position,
                  }),
                ),
        };
      },
    );
    const tracks = await attachEqStatus(this.prisma, userId, stripped);

    return { tracks, total, skip, take };
  }

  async findById(id: string, userId: string) {
    const track = await this.prisma.track.findFirst({
      where: {
        id,
        OR: [
          { userId, isCatalog: false },
          { isCatalog: true, artistId: { not: null } },
        ],
      },
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
      where: {
        id,
        OR: [
          { userId, isCatalog: false },
          { isCatalog: true, artistId: { not: null } },
        ],
      },
      select: {
        id: true,
        artist: true,
        title: true,
        lyricsLrc: true,
        lyricsText: true,
        lyricsUrl: true,
      },
    });

    if (!track) {
      throw new NotFoundException("Track not found");
    }

    if (track.lyricsUrl) {
      const linkedLyrics = await this.readLinkedLyrics(
        track.lyricsUrl,
        track.id,
      );
      if (linkedLyrics.missing) {
        // A Cloudflare URL is a reference, not a copy. If an administrator
        // removed that object directly from R2, clear the stale reference so
        // the catalog and lyrics editor no longer report a lyric that is gone.
        await this.prisma.track.update({
          where: { id: track.id },
          data: { lyricsUrl: null },
        });
      }
      const lrc = linkedLyrics.content;
      return {
        trackId: track.id,
        lrc,
        text: lrc && !hasLrcTimestamps(lrc) ? lrc : null,
        lyricsUrl: linkedLyrics.missing ? null : track.lyricsUrl,
        hasLyrics: Boolean(lrc),
      };
    }

    const bucketLrc = await this.findLyricsInBucket(track);
    const lrc = bucketLrc?.content ?? track.lyricsLrc ?? null;
    const text =
      track.lyricsText ?? (lrc && !hasLrcTimestamps(lrc) ? lrc : null);

    const lyricsUrl = bucketLrc
      ? (this.storage.getPublicObjectUrl("lyrics", bucketLrc.key) ??
        (await this.storage.getSignedDownloadUrl(
          "lyrics",
          bucketLrc.key,
          24 * 60 * 60,
        )))
      : null;

    return {
      trackId: track.id,
      lrc,
      text,
      lyricsUrl,
      hasLyrics: Boolean(lrc || text),
    };
  }

  /** Reads a linked public R2 file on demand without copying it into storage. */
  private async readLinkedLyrics(
    lyricsUrl: string,
    trackId: string,
  ): Promise<{ content: string | null; missing: boolean }> {
    try {
      const response = await fetch(lyricsUrl, {
        signal: AbortSignal.timeout(10_000),
      });
      if (response.status === 404 || response.status === 410) {
        return { content: null, missing: true };
      }
      if (!response.ok) return { content: null, missing: false };
      const length = Number(response.headers.get("content-length") ?? 0);
      if (length > 50_000) return { content: null, missing: false };
      const content = await response.text();
      return {
        content: content.trim() && content.length <= 50_000 ? content : null,
        missing: false,
      };
    } catch (error) {
      this.logger.warn(
        `Linked lyrics read failed for ${trackId}: ${(error as Error).message}`,
      );
      return { content: null, missing: false };
    }
  }

  private async findLyricsInBucket(track: {
    id: string;
    artist: string;
    title: string;
  }): Promise<{ key: string; content: string } | null> {
    const keys = [
      `${track.id}.lrc`,
      `${track.artist} - ${track.title}.lrc`,
      `${track.artist}-${track.title}.lrc`,
    ];

    for (const key of uniqueKeys(keys)) {
      try {
        const lrc = await this.storage.getTextObject("lyrics", key);
        if (lrc?.trim()) return { key, content: lrc };
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
      where: {
        OR: [
          { userId, isCatalog: false },
          { isCatalog: true, artistId: { not: null } },
        ],
      },
      select: { artist: true, artistImage: true },
      orderBy: { artist: "asc" },
    });

    const byArtist = new Map<
      string,
      { name: string; imageUrl: string | null }
    >();
    for (const r of rows) {
      const key = r.artist.trim().toLocaleLowerCase();
      const existing = byArtist.get(key);
      if (!existing || (!existing.imageUrl && r.artistImage)) {
        byArtist.set(key, {
          name: existing?.name ?? r.artist.trim(),
          imageUrl: r.artistImage ?? null,
        });
      }
    }

    return [...byArtist.values()].sort((a, b) => a.name.localeCompare(b.name));
  }

  async getArtistsPage(userId: string, params: PageParams) {
    const { offset, limit, query } = normalizePage(params);
    const searchFilter = query
      ? Prisma.sql`AND "artist" ILIKE ${`%${query}%`}`
      : Prisma.empty;

    const rows = await this.prisma.$queryRaw<
      Array<{
        name: string;
        imageUrl: string | null;
        total: number;
      }>
    >(Prisma.sql`
      WITH visible_artists AS (
        SELECT
          (ARRAY_AGG(BTRIM("artist") ORDER BY "updated_at" DESC))[1] AS "name",
          MAX("artist_image") FILTER (WHERE "artist_image" IS NOT NULL) AS "imageUrl"
        FROM "tracks"
        WHERE (("user_id" = ${userId} AND "is_catalog" = FALSE)
          OR ("is_catalog" = TRUE AND "artist_id" IS NOT NULL))
          AND BTRIM("artist") <> ''
          ${searchFilter}
        GROUP BY LOWER(BTRIM("artist"))
      )
      SELECT
        "name",
        "imageUrl",
        COUNT(*) OVER()::int AS "total"
      FROM visible_artists
      ORDER BY LOWER("name") ASC, "name" ASC
      OFFSET ${offset}
      LIMIT ${limit}
    `);

    const total = rows[0]?.total ?? 0;
    const items = rows.map((row) => ({
      name: row.name,
      imageUrl: row.imageUrl,
    }));
    return {
      items,
      total,
      nextOffset: offset + items.length < total ? offset + items.length : null,
    };
  }

  async getAlbums(userId: string, artist?: string) {
    const where: Prisma.TrackWhereInput = {
      OR: [
        { userId, isCatalog: false },
        { isCatalog: true, artistId: { not: null } },
      ],
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

  async getAlbumsPage(userId: string, params: PageParams) {
    const { offset, limit, query } = normalizePage(params);
    const searchFilter = query
      ? Prisma.sql`AND (
          "album" ILIKE ${`%${query}%`}
          OR "album_artist" ILIKE ${`%${query}%`}
        )`
      : Prisma.empty;

    const rows = await this.prisma.$queryRaw<
      Array<{
        albumId: string | null;
        album: string;
        albumArtist: string | null;
        coverArt: string | null;
        total: number;
      }>
    >(Prisma.sql`
      WITH visible_albums AS (
        SELECT
          (ARRAY_AGG("album_id" ORDER BY ("album_id" IS NULL), "updated_at" DESC))[1] AS "albumId",
          "album",
          NULLIF("album_artist", '') AS "albumArtist",
          (ARRAY_AGG(
            "cover_art"
            ORDER BY ("cover_art" IS NULL) ASC, "updated_at" DESC
          ))[1] AS "coverArt"
        FROM "tracks"
        WHERE (("user_id" = ${userId} AND "is_catalog" = FALSE)
          OR ("is_catalog" = TRUE AND "artist_id" IS NOT NULL))
          AND BTRIM("album") <> ''
          ${searchFilter}
        GROUP BY "album", "album_artist"
      )
      SELECT
        "album",
        "albumId",
        "albumArtist",
        "coverArt",
        COUNT(*) OVER()::int AS "total"
      FROM visible_albums
      ORDER BY LOWER("album") ASC, LOWER(COALESCE("albumArtist", '')) ASC
      OFFSET ${offset}
      LIMIT ${limit}
    `);

    const total = rows[0]?.total ?? 0;
    const items = rows.map((row) => ({
      album: row.album,
      albumId: row.albumId,
      albumArtist: row.albumArtist,
      coverArt: row.coverArt,
    }));
    return {
      items,
      total,
      nextOffset: offset + items.length < total ? offset + items.length : null,
    };
  }

  async getGenres(userId: string) {
    const tracks = await this.prisma.track.findMany({
      where: {
        OR: [
          { userId, isCatalog: false },
          { isCatalog: true, artistId: { not: null } },
        ],
        genre: { not: "" },
      },
      select: { genre: true },
      distinct: ["genre"],
      orderBy: { genre: "asc" },
    });

    return tracks.map((t) => t.genre);
  }
}
