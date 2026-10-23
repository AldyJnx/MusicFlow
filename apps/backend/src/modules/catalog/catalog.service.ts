import { createHash } from "crypto";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from "@nestjs/common";
import { TrackSource, SyncStatus, type Prisma } from "@prisma/client";

import { PrismaService } from "@/prisma/prisma.service";
import { StorageService } from "@/modules/storage/storage.service";
import {
  extractEmbeddedCover,
  extractEmbeddedLyrics,
} from "@/common/audio/track-metadata";
import type {
  AssignTrackDto,
  CreateAlbumDto,
  CreateArtistDto,
  FeaturedArtistCreditDto,
  ReorderAlbumDto,
  UpdateAlbumDto,
  UpdateArtistDto,
  UpdateCatalogTrackDto,
  UpdateLyricsDto,
} from "./catalog.dto";
import { RecommendationCacheService } from "@/modules/recommendations/recommendation-cache.service";

/** Trim, drop empties, de-dupe (case-insensitive), cap to 12 genre tags. */
function normalizeGenres(genres: string[] | undefined): string[] {
  if (!genres) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const g of genres) {
    const v = g.trim();
    const key = v.toLowerCase();
    if (v && !seen.has(key)) {
      seen.add(key);
      out.push(v);
    }
  }
  return out.slice(0, 12);
}

function normalizedArtistName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

/** A featuring credit belongs to a track, never to a primary artist profile. */
function isFeaturingCompositeArtistName(name: string): boolean {
  return /\s+(?:feat(?:uring)?|ft)\.?\s+/iu.test(name) || name.includes(",");
}

function assertStandaloneArtistName(name: string): void {
  if (isFeaturingCompositeArtistName(name)) {
    throw new BadRequestException(
      "Un featuring pertenece a una canción; crea o selecciona a cada artista por separado.",
    );
  }
}

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "artist"
  );
}

function normalizeFeaturingNames(value: string): string[] {
  return value
    .split(/\s*(?:,|&|\band\b|\by\b)\s*/iu)
    .map((name) => name.trim())
    .filter(Boolean);
}

export type CatalogUploadMetadata = {
  title: string;
  featuredArtistNames: string[];
};

/**
 * The artist selected in Admin is authoritative. For every filename shaped as
 * `Principal ft. Colaborador - Canción`, the last ` - ` part is the title and
 * every intermediate part is a collaboration credit. Artist identity is
 * normalized, so spacing, casing, accents and punctuation never make this
 * rule depend on a specific artist name.
 */
export function parseCatalogUploadMetadata(
  rawTitle: string,
  artistName: string,
): CatalogUploadMetadata {
  const value = rawTitle.replace(/\s+/g, " ").trim();
  if (!value) return { title: value, featuredArtistNames: [] };

  const parts = value.split(/\s+-\s+/u).map((part) => part.trim());
  const header = parts[0] ?? "";
  const featuringMatch = header.match(
    /^(.+?)\s+(?:ft\.?|feat\.?|featuring)\s+(.+)$/iu,
  );
  const selectedArtist = normalizedArtistName(artistName);
  const isSelectedPrimaryArtist = (name: string) =>
    normalizedArtistName(name) === selectedArtist;

  if (
    featuringMatch &&
    parts.length >= 2 &&
    isSelectedPrimaryArtist(featuringMatch[1])
  ) {
    const title = parts[parts.length - 1] ?? value;
    const featuredArtistNames = [
      ...normalizeFeaturingNames(featuringMatch[2]),
      ...parts.slice(1, -1).flatMap(normalizeFeaturingNames),
    ];
    return { title, featuredArtistNames };
  }

  if (parts.length >= 2 && isSelectedPrimaryArtist(header)) {
    return {
      title: parts.slice(1).join(" - ").trim(),
      featuredArtistNames: [],
    };
  }

  return {
    title: value,
    featuredArtistNames: [],
  };
}

// Lyrics columns are large; never select them in list/detail track reads.
const trackCard = {
  id: true,
  title: true,
  artist: true,
  album: true,
  durationMs: true,
  coverArt: true,
  artistImage: true,
  artistId: true,
  fileUrlRemote: true,
  trackNumber: true,
  albumId: true,
  albumOrder: true,
  featuredArtists: {
    orderBy: { position: "asc" },
    select: {
      id: true,
      artistName: true,
      artistId: true,
      position: true,
      artist: { select: { id: true, name: true, slug: true } },
    },
  },
} as const;

const CATALOG_ARTWORK_WIDTH = 640;
const CATALOG_ARTWORK_HEIGHT = 637;

async function assertCatalogArtwork(file: Express.Multer.File): Promise<void> {
  try {
    const metadata = readCatalogArtworkMetadata(file.buffer);
    const expectedFormat = file.mimetype === "image/avif" ? "avif" : "webp";
    if (
      metadata.format !== expectedFormat ||
      metadata.width !== CATALOG_ARTWORK_WIDTH ||
      metadata.height !== CATALOG_ARTWORK_HEIGHT
    ) {
      throw new BadRequestException(
        `La imagen debe ser ${CATALOG_ARTWORK_WIDTH}x${CATALOG_ARTWORK_HEIGHT} px y formato ${file.mimetype === "image/avif" ? "AVIF" : "WEBP"}.`,
      );
    }
  } catch (error) {
    if (error instanceof BadRequestException) throw error;
    throw new BadRequestException(
      "El archivo no contiene una imagen AVIF o WEBP válida.",
    );
  }
}

function readCatalogArtworkMetadata(buffer: Buffer): {
  format: "avif" | "webp";
  width: number;
  height: number;
} {
  if (
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    const chunk = buffer.subarray(12, 16).toString("ascii");
    if (chunk === "VP8X" && buffer.length >= 30) {
      return {
        format: "webp",
        width: buffer.readUIntLE(24, 3) + 1,
        height: buffer.readUIntLE(27, 3) + 1,
      };
    }
    if (chunk === "VP8 " && buffer.length >= 30) {
      return {
        format: "webp",
        width: buffer.readUInt16LE(26) & 0x3fff,
        height: buffer.readUInt16LE(28) & 0x3fff,
      };
    }
    if (chunk === "VP8L" && buffer.length >= 25 && buffer[20] === 0x2f) {
      return {
        format: "webp",
        width: 1 + buffer[21] + ((buffer[22] & 0x3f) << 8),
        height:
          1 +
          ((buffer[22] & 0xc0) >> 6) +
          (buffer[23] << 2) +
          ((buffer[24] & 0x0f) << 10),
      };
    }
  }

  const isAvif =
    buffer.subarray(4, 8).toString("ascii") === "ftyp" &&
    (buffer.subarray(8, 12).toString("ascii") === "avif" ||
      buffer.subarray(8, 12).toString("ascii") === "avis");
  if (isAvif) {
    for (let offset = 0; offset <= buffer.length - 20; offset += 1) {
      if (buffer.subarray(offset, offset + 4).toString("ascii") === "ispe") {
        return {
          format: "avif",
          width: buffer.readUInt32BE(offset + 8),
          height: buffer.readUInt32BE(offset + 12),
        };
      }
    }
  }
  throw new Error("unsupported artwork metadata");
}

function normalizeCloudflareLrcUrl(urlValue: string): string {
  let url: URL;
  try {
    url = new URL(urlValue);
  } catch {
    throw new BadRequestException("La URL del archivo LRC no es válida.");
  }
  const trustedHost =
    url.hostname.endsWith(".r2.dev") ||
    url.hostname.endsWith(".r2.cloudflarestorage.com") ||
    url.hostname === "r2.cloudflarestorage.com";
  if (
    url.protocol !== "https:" ||
    !trustedHost ||
    !url.pathname.toLowerCase().endsWith(".lrc")
  ) {
    throw new BadRequestException(
      "La URL debe ser HTTPS, apuntar a un archivo .lrc público de Cloudflare R2.",
    );
  }
  return url.toString();
}

type TrackCard = Prisma.TrackGetPayload<{ select: typeof trackCard }>;
export type FeaturedTrackMode = "popular" | "recent";

@Injectable()
export class CatalogService {
  private readonly logger = new Logger(CatalogService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    @Optional()
    private readonly recommendationCache?: RecommendationCacheService,
  ) {}

  /**
   * Mirror a track's lyrics into the lyrics bucket (best-effort). The DB stays
   * the read source, so a storage hiccup must never fail the write that
   * triggered this — we log and move on.
   */
  private async mirrorLyricsToBucket(
    artistName: string,
    trackTitle: string,
    lyricsLrc?: string,
    lyricsText?: string,
  ): Promise<void> {
    const lrc = lyricsLrc ?? lyricsText;
    if (!lrc) return;
    try {
      await this.storage.uploadLyrics(artistName, trackTitle, lrc);
    } catch (err) {
      this.logger.warn(
        `Lyrics bucket write-through failed for ${artistName} - ${trackTitle}: ${
          (err as Error).message
        }`,
      );
    }
  }

  /**
   * Admin upload of a brand-new catalog song: stores the audio in R2, extracts
   * tags, and creates an `isCatalog` Track owned by the admin. When an artist
   * and/or album id is given, the new track is linked and inherits the album's
   * cover and the artist's name/image so it shows up correctly in the catalog.
   */
  async uploadCatalogTrack(
    adminUserId: string,
    file: Express.Multer.File,
    opts: { artistId?: string; albumId?: string; title?: string },
  ) {
    const fileHash = createHash("sha256").update(file.buffer).digest("hex");
    const existing = await this.prisma.track.findUnique({
      where: { userId_fileHash: { userId: adminUserId, fileHash } },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException({
        message: "Esta canción ya está en el catálogo",
        trackId: existing.id,
      });
    }

    // Resolve artist/album context up front so the row is consistent.
    const artist = opts.artistId
      ? await this.prisma.artist.findUnique({
          where: { id: opts.artistId },
          select: { id: true, name: true, imageUrl: true },
        })
      : null;
    if (!opts.artistId || !artist) {
      throw new BadRequestException(
        "Selecciona el artista antes de subir una canción al catálogo.",
      );
    }
    const album = opts.albumId
      ? await this.prisma.album.findUnique({
          where: { id: opts.albumId },
          select: { id: true, title: true, coverArt: true, artistId: true },
        })
      : null;
    if (opts.albumId && !album) {
      throw new BadRequestException("albumId does not exist");
    }
    if (album && artist && album.artistId !== artist.id) {
      throw new BadRequestException("El álbum no pertenece a ese artista");
    }

    const mm = await import("music-metadata");
    const meta = await mm
      .parseBuffer(file.buffer, file.mimetype)
      .catch(() => null);

    const submittedTitle =
      opts.title?.trim() ||
      meta?.common.title?.trim() ||
      file.originalname.replace(/\.[^.]+$/, "").trim();
    const uploadMetadata = parseCatalogUploadMetadata(
      submittedTitle,
      artist.name,
    );
    if (!uploadMetadata.title) {
      throw new BadRequestException("La canción debe tener un nombre válido.");
    }
    const storageTitle = uploadMetadata.featuredArtistNames.length
      ? `${uploadMetadata.title} (feat. ${uploadMetadata.featuredArtistNames.join(" - ")})`
      : uploadMetadata.title;
    const upload = await this.storage.uploadCatalogAudio(
      file,
      artist.name,
      storageTitle,
    );

    // Embedded cover art (ID3 APIC etc.) — stored to R2 and used when there's
    // no album cover to inherit.
    const embeddedCover = album?.coverArt
      ? null
      : await extractEmbeddedCover(meta, this.storage, "covers");

    // Embedded lyrics (USLT/SYLT) — synced when they carry [mm:ss] marks.
    const lyrics = extractEmbeddedLyrics(meta);

    // Next track number within the album, so order is sensible by default.
    const albumOrder = album
      ? (await this.prisma.track.count({ where: { albumId: album.id } })) + 1
      : null;

    const created = await this.prisma.track.create({
      data: {
        userId: adminUserId,
        title: uploadMetadata.title,
        artist: artist.name,
        album: album?.title ?? meta?.common.album ?? "",
        genre: meta?.common.genre?.[0],
        year: meta?.common.year ?? undefined,
        durationMs: Math.round((meta?.format.duration ?? 0) * 1000),
        fileUrlRemote: upload.url,
        fileHash,
        fileSizeBytes: BigInt(file.size),
        codec: meta?.format.codec,
        bitrate: meta?.format.bitrate
          ? Math.round(meta.format.bitrate / 1000)
          : undefined,
        sampleRate: meta?.format.sampleRate,
        coverArt: album?.coverArt ?? embeddedCover ?? null,
        artistImage: artist?.imageUrl ?? null,
        ...lyrics,
        ...(artist ? { artistId: artist.id } : {}),
        ...(album ? { albumId: album.id, albumOrder } : {}),
        isCatalog: true,
        source: TrackSource.SYNCED,
        syncStatus: SyncStatus.SYNCED,
      },
      select: {
        id: true,
        title: true,
        artist: true,
        album: true,
        coverArt: true,
        durationMs: true,
        albumId: true,
        albumOrder: true,
      },
    });

    if (uploadMetadata.featuredArtistNames.length) {
      await this.replaceFeaturedArtists(
        created.id,
        uploadMetadata.featuredArtistNames.map((artistName) => ({
          artistName,
          artistId: null,
        })),
      );
    }

    // Mirror any embedded lyrics using the same human-readable R2 key.
    await this.mirrorLyricsToBucket(
      artist.name,
      created.title,
      lyrics.lyricsLrc,
      lyrics.lyricsText,
    );

    return created;
  }

  /** Upload an artist photo; also stamps it on the artist's catalog tracks. */
  async uploadArtistImage(artistId: string, file: Express.Multer.File) {
    const artist = await this.prisma.artist.findUnique({
      where: { id: artistId },
      select: { id: true, name: true },
    });
    if (!artist) throw new NotFoundException("Artist not found");
    await assertCatalogArtwork(file);
    const { url } = await this.storage.uploadArtistImage(file, artist.name);
    await this.prisma.$transaction([
      this.prisma.artist.update({
        where: { id: artistId },
        data: { imageUrl: url },
      }),
      this.prisma.track.updateMany({
        where: { artistId },
        data: { artistImage: url },
      }),
    ]);
    return { imageUrl: url };
  }

  async uploadArtistImageFromCloudflare(artistId: string, imageUrl: string) {
    let url: URL;
    try {
      url = new URL(imageUrl);
    } catch {
      throw new BadRequestException("La URL de imagen no es válida.");
    }
    const trusted =
      url.hostname.endsWith(".r2.dev") ||
      url.hostname.endsWith(".r2.cloudflarestorage.com");
    if (
      url.protocol !== "https:" ||
      !trusted ||
      !/\.(avif|webp)$/i.test(url.pathname)
    ) {
      throw new BadRequestException(
        "La URL debe ser un AVIF o WEBP HTTPS público de Cloudflare R2.",
      );
    }
    const artist = await this.prisma.artist.findUnique({
      where: { id: artistId },
      select: { id: true },
    });
    if (!artist) throw new NotFoundException("Artist not found");

    // The object already belongs to R2. Persisting its public address avoids
    // copying it into a second object solely because an admin pasted its URL.
    await this.prisma.$transaction([
      this.prisma.artist.update({
        where: { id: artistId },
        data: { imageUrl: url.toString() },
      }),
      this.prisma.track.updateMany({
        where: { artistId },
        data: { artistImage: url.toString() },
      }),
    ]);
    return { imageUrl: url.toString() };
  }

  /** Removes the DB association while preserving the manually managed R2 file. */
  async removeArtistImage(artistId: string) {
    const artist = await this.prisma.artist.findUnique({
      where: { id: artistId },
      select: { id: true },
    });
    if (!artist) throw new NotFoundException("Artist not found");

    await this.prisma.$transaction([
      this.prisma.artist.update({
        where: { id: artistId },
        data: { imageUrl: null },
      }),
      this.prisma.track.updateMany({
        where: { artistId },
        data: { artistImage: null },
      }),
    ]);
    return { imageUrl: null };
  }

  /** Upload an album cover and make it authoritative for every album track. */
  async uploadAlbumCover(albumId: string, file: Express.Multer.File) {
    const album = await this.prisma.album.findUnique({
      where: { id: albumId },
      select: {
        id: true,
        title: true,
        coverArt: true,
        artist: { select: { name: true } },
      },
    });
    if (!album) throw new NotFoundException("Album not found");
    await assertCatalogArtwork(file);
    const { url } = await this.storage.uploadAlbumCover(
      file,
      album.title,
      album.artist.name,
    );
    await this.prisma.$transaction([
      this.prisma.album.update({
        where: { id: albumId },
        data: { coverArt: url },
      }),
      this.prisma.track.updateMany({
        where: { albumId },
        data: { coverArt: url },
      }),
    ]);
    return { coverArt: url };
  }

  /** Upload a per-song cover (portada). Only touches that track. */
  async uploadTrackCover(trackId: string, file: Express.Multer.File) {
    const track = await this.prisma.track.findUnique({
      where: { id: trackId },
      select: { id: true, albumId: true },
    });
    if (!track) throw new NotFoundException("Track not found");
    if (track.albumId) {
      throw new BadRequestException(
        "Las canciones asociadas a un álbum heredan su portada; edita la portada del álbum.",
      );
    }
    await assertCatalogArtwork(file);
    const { url } = await this.storage.uploadImage(file, "covers");
    await this.prisma.track.update({
      where: { id: trackId },
      data: { coverArt: url },
    });
    return { coverArt: url };
  }

  // ── Public reads ──────────────────────────────────────────────────────────

  async listArtists(includeIncomplete = false) {
    const artists = await this.prisma.artist.findMany({
      // A featured credit is not a public artist profile. Only artists with
      // at least one directly-owned catalog track belong in the public list.
      where: includeIncomplete
        ? undefined
        : {
            imageUrl: { not: null },
            tracks: { some: { isCatalog: true } },
          },
      orderBy: { name: "asc" },
      include: {
        _count: { select: { albums: true, tracks: true } },
      },
    });
    // Legacy rows can predate normalized-name uniqueness. Keep one canonical
    // card per identity even before the data-repair migration is applied.
    if (includeIncomplete) {
      // Stale rows created by legacy filename parsing are retained in the DB
      // until the sync repair moves their relationships, but must not reappear
      // as duplicate cards in the admin catalog.
      return artists
        .filter((artist) => !isFeaturingCompositeArtistName(artist.name))
        .map((a) => ({
          id: a.id,
          name: a.name,
          slug: a.slug,
          imageUrl: a.imageUrl,
          genres: a.genres,
          albumCount: a._count.albums,
          trackCount: a._count.tracks,
        }));
    }
    const byIdentity = new Map<string, (typeof artists)[number]>();
    for (const artist of artists) {
      const key = normalizedArtistName(artist.name);
      const current = byIdentity.get(key);
      if (!current || artist._count.tracks > current._count.tracks) {
        byIdentity.set(key, artist);
      }
    }
    return [...byIdentity.values()].map((a) => ({
      id: a.id,
      name: a.name,
      slug: a.slug,
      imageUrl: a.imageUrl,
      genres: a.genres,
      albumCount: a._count.albums,
      trackCount: a._count.tracks,
    }));
  }

  /**
   * Albums stay "new" for fourteen weeks from their creation date. The
   * ordering deliberately uses createdAt rather than updatedAt so an artwork
   * correction cannot make an old album look newly released again.
   */
  async listRecentAlbums(requestedLimit = 10) {
    const limit = Math.min(
      Math.max(Number.isFinite(requestedLimit) ? requestedLimit : 10, 1),
      24,
    );
    const fourteenWeeksAgo = new Date(Date.now() - 14 * 7 * 86_400_000);
    const albums = await this.prisma.album.findMany({
      where: {
        createdAt: { gte: fourteenWeeksAgo },
        tracks: {
          some: { isCatalog: true, fileUrlRemote: { not: null } },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        artist: { select: { id: true, name: true, imageUrl: true } },
        tracks: {
          where: { isCatalog: true, fileUrlRemote: { not: null } },
          orderBy: [{ albumOrder: "asc" }, { title: "asc" }],
          select: trackCard,
        },
      },
    });

    return albums.map((album) => ({
      id: album.id,
      title: album.title,
      coverArt: album.coverArt,
      year: album.year,
      createdAt: album.createdAt,
      artist: album.artist,
      trackCount: album.tracks.length,
      tracks: album.tracks,
    }));
  }

  /**
   * Tracks that are accelerating now rather than merely having the most
   * lifetime plays. We compare the last 72 hours with the preceding week,
   * normalized by each window's duration. A small volume factor keeps a
   * single isolated play from outranking a genuine short-lived spike.
   */
  async listTrendingTracks(requestedLimit = 5) {
    const limit = Math.min(
      Math.max(Number.isFinite(requestedLimit) ? requestedLimit : 5, 1),
      12,
    );
    const now = new Date();
    const recentStart = new Date(now.getTime() - 3 * 86_400_000);
    const baselineStart = new Date(now.getTime() - 10 * 86_400_000);

    const [recentRows, baselineRows] = await Promise.all([
      this.prisma.playHistory.groupBy({
        by: ["trackId"],
        where: { playedAt: { gte: recentStart } },
        _count: { trackId: true },
        orderBy: { _count: { trackId: "desc" } },
        take: 250,
      }),
      this.prisma.playHistory.groupBy({
        by: ["trackId"],
        where: { playedAt: { gte: baselineStart, lt: recentStart } },
        _count: { trackId: true },
        orderBy: { _count: { trackId: "desc" } },
        take: 250,
      }),
    ]);

    const recentByTrack = new Map(
      recentRows.map((row) => [row.trackId, row._count.trackId]),
    );
    const baselineByTrack = new Map(
      baselineRows.map((row) => [row.trackId, row._count.trackId]),
    );
    const candidateIds = recentRows
      .filter((row) => row._count.trackId >= 2)
      .map((row) => row.trackId);
    if (candidateIds.length === 0) return [];

    const tracks = await this.prisma.track.findMany({
      where: {
        id: { in: candidateIds },
        isCatalog: true,
        fileUrlRemote: { not: null },
      },
      select: trackCard,
    });

    return tracks
      .map((track) => {
        const recent = recentByTrack.get(track.id) ?? 0;
        const baseline = baselineByTrack.get(track.id) ?? 0;
        const recentPerDay = recent / 3;
        const baselinePerDay = baseline / 7;
        const acceleration = recentPerDay / Math.max(0.15, baselinePerDay);
        const trendScore = acceleration * Math.log2(recent + 1);
        return { track, recentPlays: recent, trendScore };
      })
      .sort(
        (a, b) =>
          b.trendScore - a.trendScore ||
          b.recentPlays - a.recentPlays ||
          a.track.id.localeCompare(b.track.id),
      )
      .slice(0, limit)
      .map(({ track }) => track);
  }

  /**
   * The Home carousel has two honest modes: all-time most played and newest
   * catalog uploads. Both use one artist per pass, so a prolific artist does
   * not occupy the entire carousel. If there are no plays yet, popular falls
   * back to recent and reports that resolved mode to the client.
   */
  async listFeaturedTracks(
    mode: FeaturedTrackMode,
    requestedLimit = 8,
  ): Promise<{
    mode: FeaturedTrackMode;
    tracks: TrackCard[];
  }> {
    const limit = Math.min(
      Math.max(Number.isFinite(requestedLimit) ? requestedLimit : 8, 1),
      12,
    );
    const catalogWhere = {
      isCatalog: true,
      fileUrlRemote: { not: null },
    };

    if (mode === "recent") {
      const tracks = await this.prisma.track.findMany({
        where: catalogWhere,
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        take: Math.min(limit * 12, 240),
        select: trackCard,
      });
      return { mode, tracks: this.diversifyTracks(tracks, limit) };
    }

    const popularity = await this.prisma.playHistory.groupBy({
      by: ["trackId"],
      _count: { trackId: true },
      orderBy: { _count: { trackId: "desc" } },
      take: 250,
    });
    if (popularity.length === 0)
      return this.listFeaturedTracks("recent", limit);

    const tracks = await this.prisma.track.findMany({
      where: {
        ...catalogWhere,
        id: { in: popularity.map((row) => row.trackId) },
      },
      select: trackCard,
    });
    const trackById = new Map(tracks.map((track) => [track.id, track]));
    const ranked = popularity.flatMap((row) => {
      const track = trackById.get(row.trackId);
      return track ? [track] : [];
    });
    if (ranked.length === 0) return this.listFeaturedTracks("recent", limit);
    return { mode, tracks: this.diversifyTracks(ranked, limit) };
  }

  private diversifyTracks<
    T extends { id: string; artist: string; artistId?: string | null },
  >(tracks: T[], limit: number): T[] {
    const artistKeys = new Set<string>();
    const selected: T[] = [];
    for (const track of tracks) {
      const key = track.artistId ?? `name:${track.artist.trim().toLowerCase()}`;
      if (artistKeys.has(key)) continue;
      artistKeys.add(key);
      selected.push(track);
      if (selected.length === limit) return selected;
    }
    // A small catalog can legitimately contain several songs by one artist.
    // Fill the remaining places only after every distinct artist was offered.
    const selectedIds = new Set(selected.map((track) => track.id));
    for (const track of tracks) {
      if (selectedIds.has(track.id)) continue;
      selected.push(track);
      if (selected.length === limit) break;
    }
    return selected;
  }

  /** Distinct genres present on catalog tracks — used as picker suggestions. */
  async getGenres(): Promise<string[]> {
    const rows = await this.prisma.track.findMany({
      where: { isCatalog: true, genre: { not: "" } },
      select: { genre: true },
      distinct: ["genre"],
      orderBy: { genre: "asc" },
    });
    const fromArtists = await this.prisma.artist.findMany({
      select: { genres: true },
    });
    const set = new Set<string>();
    for (const r of rows) if (r.genre) set.add(r.genre);
    for (const a of fromArtists) for (const g of a.genres) set.add(g);
    return [...set].sort((x, y) => x.localeCompare(y));
  }

  async getArtist(id: string, userId: string) {
    const artist = await this.prisma.artist.findUnique({
      where: { id },
      include: {
        albums: {
          orderBy: [{ year: "desc" }, { title: "asc" }],
          include: {
            _count: { select: { tracks: true } },
            tracks: { select: trackCard },
          },
        },
        tracks: {
          orderBy: [{ album: "asc" }, { albumOrder: "asc" }, { title: "asc" }],
          select: trackCard,
        },
        followers: { where: { userId }, select: { userId: true } },
        _count: { select: { followers: true } },
      },
    });
    if (!artist || isFeaturingCompositeArtistName(artist.name)) {
      throw new NotFoundException("Artist not found");
    }
    return {
      id: artist.id,
      name: artist.name,
      slug: artist.slug,
      imageUrl: artist.imageUrl,
      bio: artist.bio,
      genres: artist.genres,
      followerCount: artist._count.followers,
      isFollowed: artist.followers.length > 0,
      albums: artist.albums.map((al) => ({
        id: al.id,
        title: al.title,
        coverArt: al.coverArt,
        year: al.year,
        trackCount: al._count.tracks,
      })),
      // Some legacy rows are linked to their album but missed artistId.  The
      // album editor needs those rows too; otherwise albums show a track count
      // but no songs available to inspect or assign.
      tracks: [
        ...artist.tracks,
        ...artist.albums.flatMap((album) => album.tracks ?? []),
      ]
        .filter(
          (track, index, all) =>
            all.findIndex((candidate) => candidate.id === track.id) === index,
        )
        .sort(
          (left, right) =>
            left.album.localeCompare(right.album) ||
            (left.albumOrder ?? Number.MAX_SAFE_INTEGER) -
              (right.albumOrder ?? Number.MAX_SAFE_INTEGER) ||
            left.title.localeCompare(right.title),
        ),
    };
  }

  async listArtistsPage({
    query,
    offset,
    limit,
  }: {
    query?: string;
    offset: number;
    limit: number;
  }) {
    const take = Math.min(Math.max(Number.isFinite(limit) ? limit : 6, 1), 24);
    const skip = Math.max(Number.isFinite(offset) ? offset : 0, 0);
    const search = query?.trim();
    const where = {
      imageUrl: { not: null },
      tracks: { some: { isCatalog: true } },
      NOT: [
        { name: { contains: " ft.", mode: "insensitive" as const } },
        { name: { contains: " feat.", mode: "insensitive" as const } },
        { name: { contains: " featuring ", mode: "insensitive" as const } },
        { name: { contains: "," } },
      ],
      ...(search
        ? { name: { contains: search, mode: "insensitive" as const } }
        : {}),
    };
    const [artists, total] = await this.prisma.$transaction([
      this.prisma.artist.findMany({
        where,
        orderBy: { name: "asc" },
        skip,
        take,
        include: { _count: { select: { albums: true, tracks: true } } },
      }),
      this.prisma.artist.count({ where }),
    ]);
    return {
      items: artists.map((artist) => ({
        id: artist.id,
        name: artist.name,
        slug: artist.slug,
        imageUrl: artist.imageUrl,
        genres: artist.genres,
        albumCount: artist._count.albums,
        trackCount: artist._count.tracks,
      })),
      total,
      nextOffset: skip + artists.length < total ? skip + artists.length : null,
    };
  }

  async followArtist(userId: string, artistId: string) {
    const artist = await this.prisma.artist.findUnique({
      where: { id: artistId },
      select: {
        id: true,
        name: true,
        slug: true,
        imageUrl: true,
        genres: true,
      },
    });
    if (!artist || isFeaturingCompositeArtistName(artist.name)) {
      throw new NotFoundException("Artist not found");
    }
    const follow = await this.prisma.artistFollow.upsert({
      where: { userId_artistId: { userId, artistId } },
      create: { userId, artistId, source: "MANUAL" },
      update: {},
    });
    await this.recommendationCache?.invalidate(userId);
    return { ...artist, followedAt: follow.createdAt };
  }

  async unfollowArtist(userId: string, artistId: string): Promise<void> {
    await this.prisma.artistFollow.deleteMany({ where: { userId, artistId } });
    await this.recommendationCache?.invalidate(userId);
  }

  async getAlbum(id: string) {
    const album = await this.prisma.album.findUnique({
      where: { id },
      include: {
        artist: { select: { id: true, name: true, imageUrl: true } },
        tracks: {
          orderBy: [{ albumOrder: "asc" }, { title: "asc" }],
          select: trackCard,
        },
      },
    });
    if (!album) throw new NotFoundException("Album not found");
    return album;
  }

  // ── Admin: artists ──────────────────────────────────────────────────────────

  private async uniqueSlug(name: string, excludeId?: string): Promise<string> {
    const base = slugify(name);
    let slug = base;
    for (let n = 1; ; n++) {
      const clash = await this.prisma.artist.findFirst({
        where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}) },
        select: { id: true },
      });
      if (!clash) return slug;
      slug = `${base}-${n + 1}`;
    }
  }

  async createArtist(dto: CreateArtistDto) {
    assertStandaloneArtistName(dto.name);
    const normalizedName = normalizedArtistName(dto.name);
    const duplicate = await this.prisma.artist.findUnique({
      where: { normalizedName },
      select: { id: true, name: true },
    });
    if (duplicate) {
      throw new ConflictException(
        `Ya existe el artista canónico "${duplicate.name}" para este nombre.`,
      );
    }
    const slug = await this.uniqueSlug(dto.name);
    const artist = await this.prisma.artist.create({
      data: {
        name: dto.name,
        normalizedName,
        slug,
        imageUrl: null,
        bio: dto.bio ?? null,
        genres: normalizeGenres(dto.genres),
      },
    });
    // Explicit recreation in Admin lifts a previous deletion tombstone.
    await this.prisma.deletedCatalogArtist.deleteMany({
      where: { normalizedName: normalizedArtistName(dto.name) },
    });
    return artist;
  }

  async updateArtist(id: string, dto: UpdateArtistDto) {
    const existing = await this.prisma.artist.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Artist not found");
    if (dto.name) assertStandaloneArtistName(dto.name);
    const slug =
      dto.name && dto.name !== existing.name
        ? await this.uniqueSlug(dto.name, id)
        : undefined;
    const normalizedName = dto.name
      ? normalizedArtistName(dto.name)
      : undefined;
    if (normalizedName) {
      const duplicate = await this.prisma.artist.findFirst({
        where: { normalizedName, id: { not: id } },
        select: { name: true },
      });
      if (duplicate) {
        throw new ConflictException(
          `El nombre coincide con el artista canónico "${duplicate.name}".`,
        );
      }
    }
    const nextName = dto.name?.trim();
    const renamed = Boolean(nextName && nextName !== existing.name);

    return this.prisma.$transaction(async (tx) => {
      const artist = await tx.artist.update({
        where: { id },
        data: {
          name: nextName,
          normalizedName,
          slug,
          bio: dto.bio,
          genres: dto.genres ? normalizeGenres(dto.genres) : undefined,
        },
      });

      // `artistId` is authoritative, but public search and older clients also
      // query the denormalized text column. Keep it synchronized so a rename
      // updates the existing public profile instead of making it appear empty.
      if (renamed) {
        await tx.track.updateMany({
          where: { artistId: id },
          data: { artist: artist.name },
        });
      }

      return artist;
    });
  }

  async deleteArtist(id: string) {
    await this.prisma.$transaction(async (tx) => {
      const artist = await tx.artist.findUnique({
        where: { id },
        select: { id: true, name: true },
      });
      if (!artist) throw new NotFoundException("Artist not found");
      await tx.deletedCatalogArtist.upsert({
        where: { normalizedName: normalizedArtistName(artist.name) },
        create: { normalizedName: normalizedArtistName(artist.name) },
        update: { deletedAt: new Date() },
      });
      // Imported catalogs can temporarily contain stale artistId references.
      // Match the displayed artist too, so deleting one profile cannot erase
      // songs that were incorrectly linked to it during a prior import.
      await tx.track.deleteMany({
        where: {
          isCatalog: true,
          OR: [
            { artistId: id },
            { artist: { equals: artist.name, mode: "insensitive" } },
          ],
        },
      });
      await tx.artist.delete({ where: { id } });
    });
    return { deleted: true };
  }

  // ── Admin: albums ───────────────────────────────────────────────────────────

  async createAlbum(dto: CreateAlbumDto) {
    const artist = await this.prisma.artist.findUnique({
      where: { id: dto.artistId },
      select: { id: true },
    });
    if (!artist) throw new BadRequestException("artistId does not exist");
    return this.prisma.album.create({
      data: {
        title: dto.title,
        artistId: dto.artistId,
        coverArt: null,
        year: dto.year ?? null,
      },
    });
  }

  async updateAlbum(id: string, dto: UpdateAlbumDto) {
    const existing = await this.prisma.album.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Album not found");
    return this.prisma.$transaction(async (tx) => {
      const album = await tx.album.update({
        where: { id },
        data: {
          title: dto.title,
          artistId: dto.artistId,
          year: dto.year,
        },
      });
      // Album cards and track cards must present the same artwork. Propagate
      // edits immediately instead of leaving each song with a stale cover.
      await tx.track.updateMany({
        where: { albumId: id },
        data: {
          album: album.title,
          artistId: dto.artistId ?? undefined,
          coverArt: album.coverArt,
        },
      });
      return album;
    });
  }

  async deleteAlbum(id: string) {
    // A detached song must never keep the deleted album's art or display name.
    await this.prisma.$transaction([
      this.prisma.track.updateMany({
        where: { albumId: id },
        data: { albumId: null, albumOrder: null, album: "", coverArt: null },
      }),
      this.prisma.album.delete({ where: { id } }),
    ]);
    return { deleted: true };
  }

  /** Replace an album's tracklist + order from an ordered id array. */
  async reorderAlbum(albumId: string, dto: ReorderAlbumDto) {
    const album = await this.prisma.album.findUnique({
      where: { id: albumId },
      select: { id: true, title: true, artistId: true, coverArt: true },
    });
    if (!album) throw new NotFoundException("Album not found");
    await this.prisma.$transaction([
      // Detach tracks no longer in the list.
      this.prisma.track.updateMany({
        where: { albumId, id: { notIn: dto.trackIds } },
        data: { albumId: null, albumOrder: null, album: "", coverArt: null },
      }),
      ...dto.trackIds.map((trackId, i) =>
        this.prisma.track.update({
          where: { id: trackId },
          data: {
            albumId,
            albumOrder: i + 1,
            artistId: album.artistId,
            album: album.title,
            coverArt: album.coverArt,
          },
        }),
      ),
    ]);
    return this.getAlbum(albumId);
  }

  // ── Admin: tracks ───────────────────────────────────────────────────────────

  async assignTrack(trackId: string, dto: AssignTrackDto) {
    const track = await this.prisma.track.findUnique({
      where: { id: trackId },
      select: { id: true },
    });
    if (!track) throw new NotFoundException("Track not found");
    const album = dto.albumId
      ? await this.prisma.album.findUnique({
          where: { id: dto.albumId },
          select: { id: true, title: true, artistId: true, coverArt: true },
        })
      : null;
    if (dto.albumId && !album) throw new NotFoundException("Album not found");

    await this.prisma.track.update({
      where: { id: trackId },
      data: {
        // An album belongs to exactly one artist, so its relation and cover
        // are authoritative.  This prevents cards from retaining the image
        // of a previous 50 Cent album after reassignment.
        artistId: album?.artistId ?? dto.artistId ?? undefined,
        albumId: dto.albumId === undefined ? undefined : dto.albumId,
        albumOrder: dto.albumOrder ?? undefined,
        // An assigned album owns the artwork. A custom track cover is allowed
        // only while the track is intentionally unassigned.
        album: dto.albumId === undefined ? undefined : (album?.title ?? ""),
        coverArt:
          dto.albumId === undefined ? undefined : (album?.coverArt ?? null),
      },
    });
    if (dto.featuredArtists !== undefined) {
      await this.replaceFeaturedArtists(trackId, dto.featuredArtists);
    }
    return this.prisma.track.findUniqueOrThrow({
      where: { id: trackId },
      select: trackCard,
    });
  }

  async updateCatalogTrack(trackId: string, dto: UpdateCatalogTrackDto) {
    const track = await this.prisma.track.findFirst({
      where: { id: trackId, isCatalog: true },
      select: { id: true },
    });
    if (!track) throw new NotFoundException("Catalog track not found");
    let audioUrl: string | undefined;
    if (dto.fileUrlRemote !== undefined) {
      let parsed: URL;
      try {
        parsed = new URL(dto.fileUrlRemote);
      } catch {
        throw new BadRequestException("La URL de audio no es válida.");
      }
      const trusted =
        parsed.hostname.endsWith(".r2.dev") ||
        parsed.hostname.endsWith(".r2.cloudflarestorage.com");
      if (
        parsed.protocol !== "https:" ||
        !trusted ||
        !/\.(wav|flac)$/i.test(parsed.pathname)
      ) {
        throw new BadRequestException(
          "La URL debe ser un WAV o FLAC HTTPS público de Cloudflare R2.",
        );
      }
      audioUrl = parsed.toString();
    }
    return this.prisma.track.update({
      where: { id: trackId },
      data: {
        title: dto.title?.trim() || undefined,
        fileUrlRemote: audioUrl,
      },
      select: trackCard,
    });
  }

  async replaceCatalogTrackAudio(trackId: string, file: Express.Multer.File) {
    const track = await this.prisma.track.findFirst({
      where: { id: trackId, isCatalog: true },
      select: {
        id: true,
        title: true,
        artist: true,
        featuredArtists: {
          orderBy: { position: "asc" },
          select: { artistName: true },
        },
      },
    });
    if (!track) throw new NotFoundException("Catalog track not found");
    const storageTitle = track.featuredArtists.length
      ? `${track.title} (feat. ${track.featuredArtists.map((credit) => credit.artistName).join(" - ")})`
      : track.title;
    const upload = await this.storage.replaceCatalogAudio(
      file,
      track.artist,
      storageTitle,
    );
    const mm = await import("music-metadata");
    const meta = await mm
      .parseBuffer(file.buffer, file.mimetype)
      .catch(() => null);
    return this.prisma.track.update({
      where: { id: trackId },
      data: {
        fileUrlRemote: upload.url,
        fileHash: createHash("sha256").update(file.buffer).digest("hex"),
        fileSizeBytes: BigInt(file.size),
        durationMs: Math.round((meta?.format.duration ?? 0) * 1000),
        codec: meta?.format.codec ?? "",
        bitrate: meta?.format.bitrate
          ? Math.round(meta.format.bitrate / 1000)
          : null,
        sampleRate: meta?.format.sampleRate ?? null,
        source: TrackSource.SYNCED,
        syncStatus: SyncStatus.SYNCED,
      },
      select: trackCard,
    });
  }

  /** Replace per-track featuring credits while preserving unknown names. */
  private async replaceFeaturedArtists(
    trackId: string,
    credits: FeaturedArtistCreditDto[],
  ): Promise<void> {
    const uniqueCredits = new Map<string, FeaturedArtistCreditDto>();
    for (const credit of credits) {
      const artistName = credit.artistName.trim();
      const key = normalizedArtistName(artistName);
      if (artistName && key && !uniqueCredits.has(key)) {
        uniqueCredits.set(key, { ...credit, artistName });
      }
    }
    const normalizedNames = [...uniqueCredits.keys()];
    const knownArtists = normalizedNames.length
      ? await this.prisma.artist.findMany({
          where: { normalizedName: { in: normalizedNames } },
          select: { id: true, normalizedName: true },
        })
      : [];
    const artistIdByNormalizedName = new Map(
      knownArtists.map((artist) => [artist.normalizedName, artist.id]),
    );
    const requestedIds = [...uniqueCredits.values()]
      .map((credit) => credit.artistId)
      .filter((id): id is string => Boolean(id));
    const requestedArtists = requestedIds.length
      ? await this.prisma.artist.findMany({
          where: { id: { in: requestedIds } },
          select: { id: true },
        })
      : [];
    const validRequestedIds = new Set(
      requestedArtists.map((artist) => artist.id),
    );

    await this.prisma.$transaction([
      this.prisma.trackFeaturedArtist.deleteMany({ where: { trackId } }),
      this.prisma.trackFeaturedArtist.createMany({
        data: [...uniqueCredits.entries()].map(
          ([normalizedName, credit], position) => ({
            trackId,
            artistName: credit.artistName,
            artistId:
              credit.artistId && validRequestedIds.has(credit.artistId)
                ? credit.artistId
                : (artistIdByNormalizedName.get(normalizedName) ?? null),
            position,
          }),
        ),
      }),
    ]);
  }

  /** Removes the catalog row only. The original R2 audio remains intact. */
  async deleteCatalogTrack(trackId: string) {
    const track = await this.prisma.track.findFirst({
      where: { id: trackId, isCatalog: true },
      select: { id: true },
    });
    if (!track) throw new NotFoundException("Catalog track not found");
    await this.prisma.track.delete({ where: { id: trackId } });
  }

  async updateLyrics(trackId: string, dto: UpdateLyricsDto) {
    const track = await this.prisma.track.findUnique({
      where: { id: trackId },
      select: {
        id: true,
        title: true,
        artist: true,
        artistRef: { select: { name: true } },
      },
    });
    if (!track) throw new NotFoundException("Track not found");
    if (dto.lyricsUrl) {
      const lyricsUrl = normalizeCloudflareLrcUrl(dto.lyricsUrl);
      // The URL already identifies an R2 object. Persisting this reference is
      // intentionally the entire write: do not download or mirror it into a
      // second R2 object.
      await this.prisma.track.update({
        where: { id: trackId },
        data: { lyricsUrl, lyricsLrc: null, lyricsText: null },
      });
      return { updated: true, hasLrc: true, hasText: false, lyricsUrl };
    }

    const lyricsLrc = dto.lyricsLrc;
    await this.prisma.track.update({
      where: { id: trackId },
      data: {
        lyricsLrc,
        lyricsText: dto.lyricsText,
        lyricsUrl: null,
      },
    });
    // Keep a durable .lrc copy in the lyrics bucket, in sync with the DB.
    await this.mirrorLyricsToBucket(
      track.artistRef?.name ?? track.artist,
      track.title,
      lyricsLrc,
      dto.lyricsText,
    );
    // Return only a flag — lyrics content is never echoed back in admin writes.
    return {
      updated: true,
      hasLrc: !!lyricsLrc,
      hasText: !!dto.lyricsText,
    };
  }

  async deleteLyrics(trackId: string) {
    const track = await this.prisma.track.findUnique({
      where: { id: trackId },
      select: {
        id: true,
        title: true,
        artist: true,
        lyricsUrl: true,
        artistRef: { select: { name: true } },
      },
    });
    if (!track) throw new NotFoundException("Track not found");

    await this.storage.deleteLyrics(
      track.artistRef?.name ?? track.artist,
      track.title,
      track.lyricsUrl,
    );
    await this.prisma.track.update({
      where: { id: trackId },
      data: { lyricsLrc: null, lyricsText: null, lyricsUrl: null },
    });
    return { deleted: true };
  }

  /** Catalog tracks with no album yet — the admin's "unassigned" pool. */
  async unassignedTracks(artistId?: string) {
    return this.prisma.track.findMany({
      where: {
        isCatalog: true,
        albumId: null,
        ...(artistId ? { artistId } : {}),
      },
      orderBy: [{ artist: "asc" }, { title: "asc" }],
      select: trackCard,
    });
  }
}
