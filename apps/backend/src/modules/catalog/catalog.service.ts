import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { PrismaService } from "@/prisma/prisma.service";
import type {
  AssignTrackDto,
  CreateAlbumDto,
  CreateArtistDto,
  ReorderAlbumDto,
  UpdateAlbumDto,
  UpdateArtistDto,
  UpdateLyricsDto,
} from "./catalog.dto";

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
  constructor(private readonly prisma: PrismaService) {}

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
      albumCount: a._count.albums,
      trackCount: a._count.tracks,
    }));
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
    let n = 1;
    while (true) {
      const clash = await this.prisma.artist.findFirst({
        where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}) },
        select: { id: true },
      });
      if (!clash) return slug;
      slug = `${base}-${++n}`;
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
