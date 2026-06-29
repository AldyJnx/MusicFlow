import { createHash } from "crypto";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { TrackSource, SyncStatus } from "@prisma/client";

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
  ReorderAlbumDto,
  UpdateAlbumDto,
  UpdateArtistDto,
  UpdateLyricsDto,
} from "./catalog.dto";

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

// Lyrics columns are large; never select them in list/detail track reads.
const trackCard = {
  id: true,
  title: true,
  artist: true,
  album: true,
  durationMs: true,
  coverArt: true,
  artistImage: true,
  fileUrlRemote: true,
  trackNumber: true,
  albumId: true,
  albumOrder: true,
} as const;

@Injectable()
export class CatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

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
    if (opts.artistId && !artist) {
      throw new BadRequestException("artistId does not exist");
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

    const upload = await this.storage.uploadAudio(file, "catalog");

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

    return this.prisma.track.create({
      data: {
        userId: adminUserId,
        title:
          opts.title?.trim() ||
          meta?.common.title ||
          file.originalname.replace(/\.[^.]+$/, ""),
        artist: artist?.name ?? meta?.common.artist ?? "Unknown Artist",
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
  }

  /** Upload an artist photo; also stamps it on the artist's catalog tracks. */
  async uploadArtistImage(artistId: string, file: Express.Multer.File) {
    const artist = await this.prisma.artist.findUnique({
      where: { id: artistId },
      select: { id: true },
    });
    if (!artist) throw new NotFoundException("Artist not found");
    const { url } = await this.storage.uploadImage(file, "artists");
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

  /**
   * Upload an album cover; propagates it to the album's tracks that don't have
   * their own custom cover (null, or still showing the previous album cover).
   */
  async uploadAlbumCover(albumId: string, file: Express.Multer.File) {
    const album = await this.prisma.album.findUnique({
      where: { id: albumId },
      select: { id: true, coverArt: true },
    });
    if (!album) throw new NotFoundException("Album not found");
    const { url } = await this.storage.uploadImage(file, "albums");
    await this.prisma.$transaction([
      this.prisma.album.update({
        where: { id: albumId },
        data: { coverArt: url },
      }),
      this.prisma.track.updateMany({
        where: {
          albumId,
          OR: [
            { coverArt: null },
            ...(album.coverArt ? [{ coverArt: album.coverArt }] : []),
          ],
        },
        data: { coverArt: url },
      }),
    ]);
    return { coverArt: url };
  }

  /** Upload a per-song cover (portada). Only touches that track. */
  async uploadTrackCover(trackId: string, file: Express.Multer.File) {
    const track = await this.prisma.track.findUnique({
      where: { id: trackId },
      select: { id: true },
    });
    if (!track) throw new NotFoundException("Track not found");
    const { url } = await this.storage.uploadImage(file, "covers");
    await this.prisma.track.update({
      where: { id: trackId },
      data: { coverArt: url },
    });
    return { coverArt: url };
  }

  // ── Public reads ──────────────────────────────────────────────────────────

  async listArtists() {
    const artists = await this.prisma.artist.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { albums: true, tracks: true } },
      },
    });
    return artists.map((a) => ({
      id: a.id,
      name: a.name,
      slug: a.slug,
      imageUrl: a.imageUrl,
      genres: a.genres,
      albumCount: a._count.albums,
      trackCount: a._count.tracks,
    }));
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

  async getArtist(id: string) {
    const artist = await this.prisma.artist.findUnique({
      where: { id },
      include: {
        albums: {
          orderBy: [{ year: "desc" }, { title: "asc" }],
          include: { _count: { select: { tracks: true } } },
        },
        tracks: {
          orderBy: [{ album: "asc" }, { albumOrder: "asc" }, { title: "asc" }],
          select: trackCard,
        },
      },
    });
    if (!artist) throw new NotFoundException("Artist not found");
    return {
      id: artist.id,
      name: artist.name,
      slug: artist.slug,
      imageUrl: artist.imageUrl,
      bio: artist.bio,
      genres: artist.genres,
      albums: artist.albums.map((al) => ({
        id: al.id,
        title: al.title,
        coverArt: al.coverArt,
        year: al.year,
        trackCount: al._count.tracks,
      })),
      tracks: artist.tracks,
    };
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
    const slug = await this.uniqueSlug(dto.name);
    return this.prisma.artist.create({
      data: {
        name: dto.name,
        slug,
        imageUrl: dto.imageUrl ?? null,
        bio: dto.bio ?? null,
        genres: normalizeGenres(dto.genres),
      },
    });
  }

  async updateArtist(id: string, dto: UpdateArtistDto) {
    const existing = await this.prisma.artist.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Artist not found");
    const slug =
      dto.name && dto.name !== existing.name
        ? await this.uniqueSlug(dto.name, id)
        : undefined;
    return this.prisma.artist.update({
      where: { id },
      data: {
        name: dto.name,
        slug,
        imageUrl: dto.imageUrl,
        bio: dto.bio,
        genres: dto.genres ? normalizeGenres(dto.genres) : undefined,
      },
    });
  }

  async deleteArtist(id: string) {
    await this.prisma.artist.delete({ where: { id } });
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
        coverArt: dto.coverArt ?? null,
        year: dto.year ?? null,
      },
    });
  }

  async updateAlbum(id: string, dto: UpdateAlbumDto) {
    const existing = await this.prisma.album.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Album not found");
    return this.prisma.album.update({
      where: { id },
      data: {
        title: dto.title,
        artistId: dto.artistId,
        coverArt: dto.coverArt,
        year: dto.year,
      },
    });
  }

  async deleteAlbum(id: string) {
    // Tracks keep their artist; only the album link is cleared (SetNull).
    await this.prisma.album.delete({ where: { id } });
    return { deleted: true };
  }

  /** Replace an album's tracklist + order from an ordered id array. */
  async reorderAlbum(albumId: string, dto: ReorderAlbumDto) {
    const album = await this.prisma.album.findUnique({
      where: { id: albumId },
      select: { id: true, artistId: true },
    });
    if (!album) throw new NotFoundException("Album not found");
    await this.prisma.$transaction([
      // Detach tracks no longer in the list.
      this.prisma.track.updateMany({
        where: { albumId, id: { notIn: dto.trackIds } },
        data: { albumId: null, albumOrder: null },
      }),
      ...dto.trackIds.map((trackId, i) =>
        this.prisma.track.update({
          where: { id: trackId },
          data: { albumId, albumOrder: i + 1, artistId: album.artistId },
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
    return this.prisma.track.update({
      where: { id: trackId },
      data: {
        artistId: dto.artistId ?? undefined,
        albumId: dto.albumId === undefined ? undefined : dto.albumId,
        albumOrder: dto.albumOrder ?? undefined,
        coverArt: dto.coverArt,
      },
      select: trackCard,
    });
  }

  async updateLyrics(trackId: string, dto: UpdateLyricsDto) {
    const track = await this.prisma.track.findUnique({
      where: { id: trackId },
      select: { id: true },
    });
    if (!track) throw new NotFoundException("Track not found");
    await this.prisma.track.update({
      where: { id: trackId },
      data: {
        lyricsLrc: dto.lyricsLrc,
        lyricsText: dto.lyricsText,
      },
    });
    // Return only a flag — lyrics content is never echoed back in admin writes.
    return {
      updated: true,
      hasLrc: !!dto.lyricsLrc,
      hasText: !!dto.lyricsText,
    };
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
