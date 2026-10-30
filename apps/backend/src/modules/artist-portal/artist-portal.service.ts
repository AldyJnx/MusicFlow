import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ArtistMemberRole } from "@prisma/client";
import { Cron, CronExpression } from "@nestjs/schedule";

import { PrismaService } from "@/prisma/prisma.service";
import { StorageService } from "@/modules/storage/storage.service";
import { CatalogService } from "@/modules/catalog/catalog.service";
import { TracksService } from "@/modules/library/tracks.service";
import {
  CreateArtistAccessRequestDto,
  CreateArtistPortalAlbumDto,
  ReviewArtistAccessRequestDto,
  ReviewArtistVerificationRequestDto,
  LinkArtistMembershipDto,
  UpdateArtistPortalProfileDto,
  UpdateArtistPortalAlbumDto,
  UpdateArtistPortalTrackDto,
} from "./artist-portal.dto";

function normalizeArtistName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function artistSlug(name: string): string {
  return (
    name
      .toLocaleLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "artist"
  );
}

@Injectable()
export class ArtistPortalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly catalog: CatalogService,
    private readonly tracks: TracksService,
  ) {}

  async getContext(userId: string) {
    await this.expireVerificationRequests({ requesterUserId: userId });
    const [memberships, requests] = await Promise.all([
      this.prisma.artistMembership.findMany({
        where: { userId, status: "ACTIVE" },
        include: {
          artist: {
            include: { _count: { select: { albums: true, tracks: true } } },
          },
        },
        orderBy: { createdAt: "asc" },
      }),
      this.prisma.artistAccessRequest.findMany({
        where: { userId },
        include: { artist: true },
        orderBy: { updatedAt: "desc" },
      }),
    ]);
    return { memberships, requests };
  }

  /** Enforces the ten-day review window even while no artist is browsing. */
  @Cron(CronExpression.EVERY_HOUR)
  async expirePendingVerificationRequests() {
    await this.expireVerificationRequests();
  }

  listAvailableArtists(userId: string, search = "") {
    const query = search.trim().slice(0, 100);
    return this.prisma.artist.findMany({
      where: {
        ...(query
          ? { name: { contains: query, mode: "insensitive" as const } }
          : {}),
        memberships: { none: { userId, status: "ACTIVE" } },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        imageUrl: true,
        genres: true,
      },
      orderBy: { name: "asc" },
      take: 30,
    });
  }

  async requestAccess(
    userId: string,
    dto: CreateArtistAccessRequestDto,
    document?: Express.Multer.File,
  ) {
    const evidenceLinks = this.parseEvidenceLinks(dto.evidenceLinks);
    if (!evidenceLinks.length && !document) {
      throw new BadRequestException(
        "Adjunta al menos un enlace verificable o un documento PDF.",
      );
    }
    const [artist, membership, existing, user] = await Promise.all([
      this.prisma.artist.findUnique({ where: { id: dto.artistId } }),
      this.prisma.artistMembership.findUnique({
        where: { userId_artistId: { userId, artistId: dto.artistId } },
      }),
      this.prisma.artistAccessRequest.findUnique({
        where: { userId_artistId: { userId, artistId: dto.artistId } },
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { username: true },
      }),
    ]);
    if (!artist) throw new NotFoundException("Artist not found");
    if (!user) throw new NotFoundException("User not found");
    if (membership?.status === "ACTIVE") {
      throw new ConflictException("You already have access to this artist");
    }
    if (existing?.status === "PENDING" || existing?.status === "APPROVED") {
      throw new ConflictException("An access request already exists");
    }
    const upload = document
      ? await this.storage.uploadArtistVerificationDocument(
          document,
          user.username,
        )
      : null;
    try {
      const request = await this.prisma.artistAccessRequest.upsert({
        where: { userId_artistId: { userId, artistId: dto.artistId } },
        create: {
          userId,
          artistId: dto.artistId,
          evidence: dto.evidence?.trim() || null,
          evidenceLinks,
          documentKey: upload?.key ?? existing?.documentKey,
          documentName: document?.originalname ?? existing?.documentName,
          documentMimeType: document?.mimetype ?? existing?.documentMimeType,
          documentSizeBytes: document?.size ?? existing?.documentSizeBytes,
        },
        update: {
          evidence: dto.evidence?.trim() || null,
          evidenceLinks,
          documentKey: upload?.key ?? existing?.documentKey,
          documentName: document?.originalname ?? existing?.documentName,
          documentMimeType: document?.mimetype ?? existing?.documentMimeType,
          documentSizeBytes: document?.size ?? existing?.documentSizeBytes,
          status: "PENDING",
          reviewedAt: null,
          reviewedById: null,
          reviewNote: null,
        },
        include: { artist: true },
      });
      if (
        existing?.documentKey &&
        upload?.key &&
        existing.documentKey !== upload.key
      ) {
        await this.storage.delete(
          this.documentBucket(existing.documentKey),
          existing.documentKey,
        );
      }
      return request;
    } catch (error) {
      if (upload?.key) await this.storage.delete("artistEvidence", upload.key);
      throw error;
    }
  }

  async dashboard(userId: string, artistId: string) {
    await this.requireMembership(userId, artistId);
    const now = new Date();
    const currentStart = new Date(now);
    currentStart.setUTCDate(currentStart.getUTCDate() - 29);
    currentStart.setUTCHours(0, 0, 0, 0);
    const previousStart = new Date(currentStart);
    previousStart.setUTCDate(previousStart.getUTCDate() - 30);
    const [artist, history, profileViews, follows, tracks] = await Promise.all([
      this.prisma.artist.findUnique({
        where: { id: artistId },
        include: {
          _count: { select: { albums: true, tracks: true, followers: true } },
        },
      }),
      this.prisma.playHistory.findMany({
        where: { track: { artistId }, playedAt: { gte: previousStart } },
        select: { userId: true, playedAt: true, trackId: true },
        orderBy: { playedAt: "asc" },
      }),
      this.prisma.artistProfileView.findMany({
        where: { artistId, viewedOn: { gte: previousStart } },
        select: { userId: true, viewedOn: true },
        orderBy: { viewedOn: "asc" },
      }),
      this.prisma.artistFollow.findMany({
        where: { artistId, createdAt: { gte: previousStart } },
        select: { createdAt: true },
      }),
      this.prisma.track.findMany({
        where: { artistId, isCatalog: true },
        select: { id: true, title: true, coverArt: true },
      }),
    ]);
    if (!artist) throw new NotFoundException("Artist not found");
    const currentRows = history.filter((row) => row.playedAt >= currentStart);
    const previousRows = history.filter((row) => row.playedAt < currentStart);
    const listeners = new Set(currentRows.map((row) => row.userId));
    const frequentListeners = [...listeners].filter(
      (userId) =>
        currentRows.filter((row) => row.userId === userId).length >= 3,
    ).length;
    const loyalListeners = [...listeners].filter((userId) => {
      const days = new Set(
        currentRows
          .filter((row) => row.userId === userId)
          .map((row) => row.playedAt.toISOString().slice(0, 10)),
      );
      return days.size >= 3;
    }).length;
    const series = Array.from({ length: 30 }, (_, index) => {
      const day = new Date(currentStart);
      day.setUTCDate(day.getUTCDate() + index);
      const key = day.toISOString().slice(0, 10);
      return {
        date: key,
        plays: currentRows.filter(
          (row) => row.playedAt.toISOString().slice(0, 10) === key,
        ).length,
        listeners: new Set(
          currentRows
            .filter((row) => row.playedAt.toISOString().slice(0, 10) === key)
            .map((row) => row.userId),
        ).size,
        profileViews: new Set(
          profileViews
            .filter((row) => row.viewedOn.toISOString().slice(0, 10) === key)
            .map((row) => row.userId),
        ).size,
      };
    });
    const playCounts = new Map<string, number>();
    const previousPlayCounts = new Map<string, number>();
    for (const row of currentRows)
      playCounts.set(row.trackId, (playCounts.get(row.trackId) ?? 0) + 1);
    for (const row of previousRows) {
      previousPlayCounts.set(
        row.trackId,
        (previousPlayCounts.get(row.trackId) ?? 0) + 1,
      );
    }
    const topTracks = tracks
      .map((track) => {
        const plays = playCounts.get(track.id) ?? 0;
        const previousPlays = previousPlayCounts.get(track.id) ?? 0;
        const delta = plays - previousPlays;
        return {
          ...track,
          plays,
          previousPlays,
          delta,
          trend: delta > 0 ? "UP" : delta < 0 ? "DOWN" : "STABLE",
        };
      })
      .sort((a, b) => b.plays - a.plays)
      .slice(0, 5);
    const currentFollowers = artist._count.followers;
    const newFollowers = follows.filter(
      (follow) => follow.createdAt >= currentStart,
    ).length;
    return {
      artist,
      period: { from: currentStart, to: now },
      totals: {
        plays: currentRows.length,
        listeners: listeners.size,
        frequentListeners,
        loyalListeners,
        newListeners:
          listeners.size - new Set(previousRows.map((row) => row.userId)).size >
          0
            ? [...listeners].filter(
                (id) => !new Set(previousRows.map((row) => row.userId)).has(id),
              ).length
            : 0,
        profileViews: new Set(
          profileViews
            .filter((row) => row.viewedOn >= currentStart)
            .map((row) => row.userId),
        ).size,
        newFollowers,
        followers: currentFollowers,
      },
      comparison: {
        plays: currentRows.length - previousRows.length,
        listeners:
          listeners.size - new Set(previousRows.map((row) => row.userId)).size,
        profileViews:
          new Set(
            profileViews
              .filter((row) => row.viewedOn >= currentStart)
              .map((row) => row.userId),
          ).size -
          new Set(
            profileViews
              .filter((row) => row.viewedOn < currentStart)
              .map((row) => row.userId),
          ).size,
        followers: newFollowers,
      },
      series,
      topTracks,
    };
  }

  async music(
    userId: string,
    artistId: string,
    params?: {
      page?: string | number;
      pageSize?: string | number;
      sort?: string;
      q?: string;
    },
  ) {
    await this.requireMembership(userId, artistId);
    const page = Math.max(1, Number(params?.page) || 1);
    const pageSize = Math.min(
      10_000,
      Math.max(1, Number(params?.pageSize) || 8),
    );
    const query = params?.q?.trim().slice(0, 120) ?? "";
    const sort = params?.sort ?? "TRENDING_DESC";
    const tracks = await this.prisma.track.findMany({
      where: {
        artistId,
        isCatalog: true,
        ...(query
          ? { title: { contains: query, mode: "insensitive" as const } }
          : {}),
      },
      select: {
        id: true,
        title: true,
        fileUrlRemote: true,
        coverArt: true,
        durationMs: true,
        albumId: true,
        album: true,
        lyricsUrl: true,
        lyricsLrc: true,
      },
    });
    const trackIds = tracks.map((track) => track.id);
    const since = new Date();
    since.setUTCDate(since.getUTCDate() - 29);
    since.setUTCHours(0, 0, 0, 0);
    const playCounts = trackIds.length
      ? await this.prisma.playHistory.groupBy({
          by: ["trackId"],
          where: { trackId: { in: trackIds }, playedAt: { gte: since } },
          _count: { _all: true },
        })
      : [];
    const playsByTrackId = new Map(
      playCounts.map((row) => [row.trackId, row._count._all]),
    );
    const withTrend = <T extends { id: string; title: string }>(track: T) => ({
      ...track,
      playsLast30Days: playsByTrackId.get(track.id) ?? 0,
    });
    const ordered = tracks.map(withTrend).sort((a, b) => {
      if (sort === "TITLE_ASC") return a.title.localeCompare(b.title);
      if (sort === "TITLE_DESC") return b.title.localeCompare(a.title);
      if (sort === "TRENDING_ASC") {
        return (
          a.playsLast30Days - b.playsLast30Days ||
          a.title.localeCompare(b.title)
        );
      }
      return (
        b.playsLast30Days - a.playsLast30Days || a.title.localeCompare(b.title)
      );
    });
    const total = ordered.length;
    const albums = await this.prisma.album.findMany({
      where: { artistId },
      select: { id: true, title: true, year: true, coverArt: true },
      orderBy: [{ year: "desc" }, { title: "asc" }],
    });
    return {
      items: ordered.slice((page - 1) * pageSize, page * pageSize),
      albums,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async albums(
    userId: string,
    artistId: string,
    params?: {
      page?: string | number;
      pageSize?: string | number;
      sort?: string;
      q?: string;
    },
  ) {
    await this.requireMembership(userId, artistId);
    const page = Math.max(1, Number(params?.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(params?.pageSize) || 8));
    const query = params?.q?.trim().slice(0, 120) ?? "";
    const sort = params?.sort ?? "RECENT_DESC";
    const where = {
      artistId,
      ...(query
        ? { title: { contains: query, mode: "insensitive" as const } }
        : {}),
    };
    const orderBy =
      sort === "TITLE_ASC"
        ? [{ title: "asc" as const }]
        : sort === "TITLE_DESC"
          ? [{ title: "desc" as const }]
          : sort === "RECENT_ASC"
            ? [{ createdAt: "asc" as const }, { title: "asc" as const }]
            : [{ createdAt: "desc" as const }, { title: "asc" as const }];
    const [items, total] = await Promise.all([
      this.prisma.album.findMany({
        where,
        select: {
          id: true,
          title: true,
          year: true,
          coverArt: true,
          createdAt: true,
          _count: { select: { tracks: true } },
        },
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.album.count({ where }),
    ]);
    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async lyrics(userId: string, artistId: string, trackId: string) {
    await this.requireMembership(userId, artistId);
    await this.requireArtistTrack(artistId, trackId);
    return this.tracks.getLyrics(trackId, userId);
  }

  private async requireArtistAlbum(artistId: string, albumId: string) {
    const album = await this.prisma.album.findFirst({
      where: { id: albumId, artistId },
      select: {
        id: true,
      },
    });
    if (!album) throw new NotFoundException("Artist album not found");
    return album;
  }

  async uploadMusic(
    userId: string,
    artistId: string,
    file: Express.Multer.File,
    details: {
      title?: string;
      albumId?: string;
      lyricsUrl?: string;
      lyricsLrc?: string;
    },
  ) {
    await this.requireMusicManager(userId, artistId);
    const created = await this.catalog.uploadCatalogTrack(userId, file, {
      artistId,
      albumId: details.albumId,
      title: details.title,
    });
    if (details.lyricsUrl || details.lyricsLrc) {
      await this.catalog.updateLyrics(created.id, {
        lyricsUrl: details.lyricsUrl,
        lyricsLrc: details.lyricsLrc,
      });
    }
    return created;
  }

  async createAlbum(
    userId: string,
    artistId: string,
    dto: CreateArtistPortalAlbumDto,
    cover: Express.Multer.File,
  ) {
    await this.requireMusicManager(userId, artistId);
    const album = await this.catalog.createAlbum({
      title: dto.title.trim(),
      artistId,
      year: dto.year,
    });
    try {
      await this.catalog.uploadAlbumCover(album.id, cover);
      return this.prisma.album.findUniqueOrThrow({ where: { id: album.id } });
    } catch (error) {
      await this.prisma.album.delete({ where: { id: album.id } });
      throw error;
    }
  }

  async updateAlbum(
    userId: string,
    artistId: string,
    albumId: string,
    dto: UpdateArtistPortalAlbumDto,
  ) {
    await this.requireMusicManager(userId, artistId);
    await this.requireArtistAlbum(artistId, albumId);
    return this.catalog.updateAlbum(albumId, {
      title: dto.title?.trim(),
      year: dto.year,
    });
  }

  async updateAlbumCover(
    userId: string,
    artistId: string,
    albumId: string,
    cover: Express.Multer.File,
  ) {
    await this.requireMusicManager(userId, artistId);
    await this.requireArtistAlbum(artistId, albumId);
    return this.catalog.uploadAlbumCover(albumId, cover);
  }

  async deleteAlbum(userId: string, artistId: string, albumId: string) {
    await this.requireMusicManager(userId, artistId);
    await this.requireArtistAlbum(artistId, albumId);
    return this.catalog.deleteAlbum(albumId);
  }

  async updateMusic(
    userId: string,
    artistId: string,
    trackId: string,
    dto: UpdateArtistPortalTrackDto,
  ) {
    await this.requireMusicManager(userId, artistId);
    await this.requireArtistTrack(artistId, trackId);
    if (dto.albumId !== undefined) {
      await this.catalog.assignTrack(trackId, {
        artistId,
        albumId: dto.albumId,
      });
    }
    const updated = await this.catalog.updateCatalogTrack(trackId, dto);
    if (dto.clearLyrics) {
      await this.catalog.deleteLyrics(trackId);
    } else if (dto.lyricsUrl || dto.lyricsLrc) {
      await this.catalog.updateLyrics(trackId, {
        lyricsUrl: dto.lyricsUrl,
        lyricsLrc: dto.lyricsLrc,
      });
    }
    return updated;
  }

  async deactivateMusic(userId: string, artistId: string, trackId: string) {
    await this.requireMusicManager(userId, artistId);
    const updated = await this.prisma.track.updateMany({
      where: { id: trackId, artistId, isCatalog: true },
      data: { isCatalog: false },
    });
    if (!updated.count) throw new NotFoundException("Catalog track not found");
    return { deactivated: true };
  }

  async deleteMusic(userId: string, artistId: string, trackId: string) {
    await this.requireMusicManager(userId, artistId);
    await this.requireArtistTrack(artistId, trackId);
    await this.catalog.deleteCatalogTrack(trackId);
    return { deleted: true };
  }

  async exportMusic(
    userId: string,
    artistId: string,
    params?: { sort?: string; q?: string },
  ) {
    const result = await this.music(userId, artistId, {
      ...params,
      page: 1,
      pageSize: 10_000,
    });
    return result.items;
  }

  async analytics(userId: string, artistId: string, days = 30) {
    await this.requireMembership(userId, artistId);
    const safeDays = Math.max(7, Math.min(365, days));
    const since = new Date();
    since.setUTCDate(since.getUTCDate() - safeDays + 1);
    since.setUTCHours(0, 0, 0, 0);
    const [rows, profileViews] = await Promise.all([
      this.prisma.playHistory.findMany({
        where: { playedAt: { gte: since }, track: { artistId } },
        select: { playedAt: true, userId: true, durationListenedMs: true },
        orderBy: { playedAt: "asc" },
      }),
      this.prisma.artistProfileView.findMany({
        where: { artistId, viewedOn: { gte: since } },
        select: { viewedOn: true, userId: true },
        orderBy: { viewedOn: "asc" },
      }),
    ]);
    const byDay = new Map<
      string,
      {
        plays: number;
        listeningMs: number;
        listeners: Set<string>;
        profileViews: Set<string>;
      }
    >();
    for (const row of rows) {
      const day = row.playedAt.toISOString().slice(0, 10);
      const current = byDay.get(day) ?? {
        plays: 0,
        listeningMs: 0,
        listeners: new Set<string>(),
        profileViews: new Set<string>(),
      };
      current.plays += 1;
      current.listeningMs += row.durationListenedMs;
      current.listeners.add(row.userId);
      byDay.set(day, current);
    }
    for (const view of profileViews) {
      const day = view.viewedOn.toISOString().slice(0, 10);
      const current = byDay.get(day) ?? {
        plays: 0,
        listeningMs: 0,
        listeners: new Set<string>(),
        profileViews: new Set<string>(),
      };
      current.profileViews.add(view.userId);
      byDay.set(day, current);
    }
    return {
      days: safeDays,
      totalPlays: rows.length,
      uniqueListeners: new Set(rows.map((row) => row.userId)).size,
      totalListeningMs: rows.reduce(
        (total, row) => total + row.durationListenedMs,
        0,
      ),
      totalProfileViews: new Set(profileViews.map((row) => row.userId)).size,
      series: Array.from({ length: safeDays }, (_, index) => {
        const date = new Date(since);
        date.setUTCDate(date.getUTCDate() + index);
        const key = date.toISOString().slice(0, 10);
        const values = byDay.get(key);
        return {
          date: key,
          plays: values?.plays ?? 0,
          listeningMs: values?.listeningMs ?? 0,
          listeners: values?.listeners.size ?? 0,
          profileViews: values?.profileViews.size ?? 0,
        };
      }),
    };
  }

  private async buildNotifications(userId: string, artistId: string) {
    const now = new Date();
    await this.expireVerificationRequests({
      artistId,
      requesterUserId: userId,
    });
    const currentStart = new Date(now);
    currentStart.setUTCDate(currentStart.getUTCDate() - 6);
    currentStart.setUTCHours(0, 0, 0, 0);
    const previousStart = new Date(currentStart);
    previousStart.setUTCDate(previousStart.getUTCDate() - 7);
    const tracks = await this.prisma.track.findMany({
      where: { artistId, isCatalog: true },
      select: {
        id: true,
        title: true,
        albumId: true,
        albumRef: { select: { title: true } },
      },
    });
    const history = tracks.length
      ? await this.prisma.playHistory.findMany({
          where: {
            trackId: { in: tracks.map((track) => track.id) },
            playedAt: { gte: previousStart },
          },
          select: { trackId: true, userId: true, playedAt: true },
        })
      : [];
    const notices: Array<{
      id: string;
      kind: "NEW_LISTENERS" | "ALBUM_GROWTH" | "VERIFICATION_RESULT";
      title: string;
      message: string;
      createdAt: Date;
    }> = [];
    for (const track of tracks) {
      const currentListeners = new Set(
        history
          .filter(
            (row) => row.trackId === track.id && row.playedAt >= currentStart,
          )
          .map((row) => row.userId),
      );
      const priorListeners = new Set(
        history
          .filter(
            (row) => row.trackId === track.id && row.playedAt < currentStart,
          )
          .map((row) => row.userId),
      );
      const newListeners = [...currentListeners].filter(
        (listener) => !priorListeners.has(listener),
      ).length;
      if (newListeners) {
        notices.push({
          id: `new-listeners-${track.id}`,
          kind: "NEW_LISTENERS",
          title: "Nuevos oyentes",
          message: `Tu canción “${track.title}” obtuvo ${newListeners} oyente${newListeners === 1 ? "" : "s"} nuevo${newListeners === 1 ? "" : "s"} esta semana.`,
          createdAt: now,
        });
      }
    }
    const albums = new Map<
      string,
      { title: string; current: number; previous: number }
    >();
    const trackById = new Map(tracks.map((track) => [track.id, track]));
    for (const row of history) {
      const track = trackById.get(row.trackId);
      if (!track?.albumId || !track.albumRef) continue;
      const stats = albums.get(track.albumId) ?? {
        title: track.albumRef.title,
        current: 0,
        previous: 0,
      };
      if (row.playedAt >= currentStart) stats.current += 1;
      else stats.previous += 1;
      albums.set(track.albumId, stats);
    }
    for (const [albumId, stats] of albums) {
      if (!stats.previous || stats.current <= stats.previous) continue;
      const increase = Math.round(
        ((stats.current - stats.previous) / stats.previous) * 100,
      );
      notices.push({
        id: `album-growth-${albumId}`,
        kind: "ALBUM_GROWTH",
        title: "Crecimiento de álbum",
        message: `El álbum “${stats.title}” aumentó ${increase}% sus reproducciones esta semana.`,
        createdAt: now,
      });
    }
    const verification = await this.prisma.artistVerificationRequest.findFirst({
      where: { artistId, requesterUserId: userId, status: { not: "PENDING" } },
      select: { id: true, status: true, reviewedAt: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    });
    if (verification) {
      const approved = verification.status === "APPROVED";
      notices.push({
        id: `verification-${verification.id}-${verification.updatedAt.getTime()}`,
        kind: "VERIFICATION_RESULT",
        title: approved
          ? "Sello verificado aprobado"
          : "Sello verificado rechazado",
        message: approved
          ? "Tu solicitud de sello de artista verificado fue aprobada."
          : "Tu solicitud de sello de artista verificado fue rechazada.",
        createdAt: verification.reviewedAt ?? verification.updatedAt,
      });
    }
    return notices.slice(0, 20);
  }

  async notifications(userId: string, artistId: string) {
    await this.requireMembership(userId, artistId);
    const notices = await this.buildNotifications(userId, artistId);
    const reads = notices.length
      ? await this.prisma.artistNotificationRead.findMany({
          where: {
            userId,
            artistId,
            notificationId: { in: notices.map((notice) => notice.id) },
          },
          select: { notificationId: true },
        })
      : [];
    const readIds = new Set(reads.map((read) => read.notificationId));
    const items = notices.map((notice) => ({
      ...notice,
      read: readIds.has(notice.id),
    }));
    return {
      items,
      unreadCount: items.filter((notice) => !notice.read).length,
    };
  }

  async markNotificationsRead(
    userId: string,
    artistId: string,
    notificationIds?: string[],
  ) {
    await this.requireMembership(userId, artistId);
    const notices = await this.buildNotifications(userId, artistId);
    const availableIds = new Set(notices.map((notice) => notice.id));
    const ids = Array.from(
      new Set(
        notificationIds?.filter((id) => availableIds.has(id)) ?? [
          ...availableIds,
        ],
      ),
    );
    if (ids.length) {
      await this.prisma.artistNotificationRead.createMany({
        data: ids.map((notificationId) => ({
          userId,
          artistId,
          notificationId,
        })),
        skipDuplicates: true,
      });
    }
    return { readCount: ids.length };
  }

  async team(userId: string, artistId: string) {
    await this.requireMembership(userId, artistId);
    return this.prisma.artistMembership.findMany({
      where: { artistId, status: "ACTIVE" },
      select: {
        id: true,
        role: true,
        createdAt: true,
        user: {
          select: { id: true, username: true, email: true, avatar: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  async updateProfile(
    userId: string,
    artistId: string,
    dto: UpdateArtistPortalProfileDto,
  ) {
    const membership = await this.requireMembership(userId, artistId);
    if (
      membership.role !== ArtistMemberRole.OWNER &&
      membership.role !== ArtistMemberRole.MANAGER
    ) {
      throw new ForbiddenException(
        "Only owners and managers can edit the profile",
      );
    }
    const name = dto.name?.trim();
    if (!name || name === undefined) {
      return this.prisma.artist.update({ where: { id: artistId }, data: dto });
    }
    const normalizedName = normalizeArtistName(name);
    if (!normalizedName) {
      throw new BadRequestException("El nombre del artista no es válido.");
    }
    const duplicate = await this.prisma.artist.findFirst({
      where: { normalizedName, id: { not: artistId } },
      select: { id: true },
    });
    if (duplicate) {
      throw new ConflictException("Ya existe un artista con ese nombre.");
    }
    const slugBase = artistSlug(name);
    const slugOwner = await this.prisma.artist.findFirst({
      where: { slug: slugBase, id: { not: artistId } },
      select: { id: true },
    });
    const slug = slugOwner ? `${slugBase}-${artistId.slice(0, 8)}` : slugBase;
    return this.prisma.$transaction(async (tx) => {
      const artist = await tx.artist.update({
        where: { id: artistId },
        data: {
          name,
          normalizedName,
          slug,
          bio: dto.bio,
          imageUrl: dto.imageUrl,
        },
      });
      await tx.track.updateMany({
        where: { artistId },
        data: { artist: name },
      });
      await tx.trackFeaturedArtist.updateMany({
        where: { artistId },
        data: { artistName: name },
      });
      return artist;
    });
  }

  async updateProfileImage(
    userId: string,
    artistId: string,
    image?: Express.Multer.File,
  ) {
    const membership = await this.requireMembership(userId, artistId);
    if (
      membership.role !== ArtistMemberRole.OWNER &&
      membership.role !== ArtistMemberRole.MANAGER
    ) {
      throw new ForbiddenException(
        "Only owners and managers can update the profile image",
      );
    }
    if (!image || !["image/webp", "image/avif"].includes(image.mimetype)) {
      throw new BadRequestException("La foto de perfil debe ser WEBP o AVIF.");
    }
    const artist = await this.prisma.artist.findUnique({
      where: { id: artistId },
      select: { name: true },
    });
    if (!artist) throw new NotFoundException("Artist not found");
    const upload = await this.storage.uploadArtistImage(image, artist.name);
    await this.prisma.$transaction([
      this.prisma.artist.update({
        where: { id: artistId },
        data: { imageUrl: upload.url },
      }),
      this.prisma.track.updateMany({
        where: { artistId },
        data: { artistImage: upload.url },
      }),
    ]);
    return { imageUrl: upload.url };
  }

  async requestVerification(userId: string, artistId: string) {
    const membership = await this.requireMembership(userId, artistId);
    if (
      membership.role !== ArtistMemberRole.OWNER &&
      membership.role !== ArtistMemberRole.MANAGER
    ) {
      throw new ForbiddenException(
        "Only owners and managers can request verification",
      );
    }
    const artist = await this.prisma.artist.findUnique({
      where: { id: artistId },
    });
    if (!artist) throw new NotFoundException("Artist not found");
    if (artist.isVerified) {
      throw new ConflictException("This artist is already verified");
    }
    const existing = await this.prisma.artistVerificationRequest.findUnique({
      where: { artistId },
    });
    if (existing?.status === "PENDING") {
      throw new ConflictException("A verification request is already pending");
    }
    return this.prisma.artistVerificationRequest.upsert({
      where: { artistId },
      create: { artistId, requesterUserId: userId },
      update: {
        requesterUserId: userId,
        status: "PENDING",
        reviewedById: null,
        reviewedAt: null,
        reviewNote: null,
      },
      include: { artist: true },
    });
  }

  async listVerificationRequests(params?: {
    page?: string | number;
    pageSize?: string | number;
    sort?: string;
    q?: string;
  }) {
    await this.expireVerificationRequests();
    const page = Math.max(1, Number(params?.page) || 1);
    const pageSize = Math.min(30, Math.max(1, Number(params?.pageSize) || 6));
    const q = params?.q?.trim().slice(0, 100) ?? "";
    const sort = params?.sort ?? "RECENT";
    const where = q
      ? {
          requester: {
            username: { contains: q, mode: "insensitive" as const },
          },
        }
      : {};
    const orderBy =
      sort === "USERNAME_ASC"
        ? [{ requester: { username: "asc" as const } }, { id: "asc" as const }]
        : sort === "USERNAME_DESC"
          ? [
              { requester: { username: "desc" as const } },
              { id: "asc" as const },
            ]
          : sort === "OLDEST"
            ? [{ createdAt: "asc" as const }, { id: "asc" as const }]
            : [{ createdAt: "desc" as const }, { id: "desc" as const }];
    const [total, items] = await this.prisma.$transaction([
      this.prisma.artistVerificationRequest.count({ where }),
      this.prisma.artistVerificationRequest.findMany({
        where,
        include: {
          artist: {
            select: { id: true, name: true, imageUrl: true, isVerified: true },
          },
          requester: { select: { id: true, username: true, email: true } },
          reviewedBy: { select: { id: true, username: true } },
        },
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async reviewVerificationRequest(
    adminId: string,
    requestId: string,
    dto: ReviewArtistVerificationRequestDto,
  ) {
    const request = await this.prisma.artistVerificationRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) throw new NotFoundException("Verification request not found");
    if (request.status !== "PENDING") {
      throw new ConflictException(
        "This verification request has already been reviewed",
      );
    }
    return this.prisma.$transaction(async (tx) => {
      await tx.artist.update({
        where: { id: request.artistId },
        data: { isVerified: dto.status === "APPROVED" },
      });
      return tx.artistVerificationRequest.update({
        where: { id: requestId },
        data: {
          status: dto.status,
          reviewedById: adminId,
          reviewedAt: new Date(),
          reviewNote: dto.note,
        },
        include: {
          artist: true,
          requester: { select: { id: true, username: true, email: true } },
        },
      });
    });
  }

  async listRequests(params?: {
    page?: string | number;
    pageSize?: string | number;
    sort?: string;
    q?: string;
  }) {
    const page = Math.max(1, Number(params?.page) || 1);
    const pageSize = Math.min(30, Math.max(1, Number(params?.pageSize) || 6));
    const q = params?.q?.trim().slice(0, 100) ?? "";
    const sort = params?.sort ?? "RECENT";
    const where = q
      ? { user: { username: { contains: q, mode: "insensitive" as const } } }
      : {};
    const orderBy =
      sort === "USERNAME_ASC"
        ? [{ user: { username: "asc" as const } }, { id: "asc" as const }]
        : sort === "USERNAME_DESC"
          ? [{ user: { username: "desc" as const } }, { id: "asc" as const }]
          : sort === "OLDEST"
            ? [{ createdAt: "asc" as const }, { id: "asc" as const }]
            : [{ createdAt: "desc" as const }, { id: "desc" as const }];
    const [total, requests] = await this.prisma.$transaction([
      this.prisma.artistAccessRequest.count({ where }),
      this.prisma.artistAccessRequest.findMany({
        where,
        include: {
          artist: { select: { id: true, name: true, imageUrl: true } },
          user: { select: { id: true, username: true, email: true } },
          reviewedBy: { select: { id: true, username: true } },
        },
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    const items = await Promise.all(
      requests.map(async (request) => ({
        ...request,
        documentUrl: request.documentKey
          ? await this.storage.getSignedDownloadUrl(
              this.documentBucket(request.documentKey),
              request.documentKey,
            )
          : null,
      })),
    );
    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async linkMembership(dto: LinkArtistMembershipDto) {
    const [user, artist] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: dto.userId },
        select: { id: true },
      }),
      this.prisma.artist.findUnique({
        where: { id: dto.artistId },
        select: { id: true },
      }),
    ]);
    if (!user || !artist)
      throw new NotFoundException("User or artist not found");
    return this.prisma.artistMembership.upsert({
      where: {
        userId_artistId: { userId: dto.userId, artistId: dto.artistId },
      },
      create: {
        userId: dto.userId,
        artistId: dto.artistId,
        role: dto.role,
        status: "ACTIVE",
      },
      update: { role: dto.role, status: "ACTIVE" },
      include: {
        user: { select: { id: true, username: true, email: true } },
        artist: true,
      },
    });
  }

  async reviewRequest(
    adminId: string,
    requestId: string,
    dto: ReviewArtistAccessRequestDto,
  ) {
    const request = await this.prisma.artistAccessRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) throw new NotFoundException("Access request not found");
    if (request.status !== "PENDING")
      throw new ConflictException("This request has already been reviewed");
    return this.prisma.$transaction(async (tx) => {
      if (dto.status === "APPROVED") {
        const activeMemberCount = await tx.artistMembership.count({
          where: { artistId: request.artistId, status: "ACTIVE" },
        });
        await tx.artistMembership.upsert({
          where: {
            userId_artistId: {
              userId: request.userId,
              artistId: request.artistId,
            },
          },
          create: {
            userId: request.userId,
            artistId: request.artistId,
            role: activeMemberCount === 0 ? "OWNER" : "EDITOR",
          },
          update: { status: "ACTIVE" },
        });
      }
      return tx.artistAccessRequest.update({
        where: { id: requestId },
        data: {
          status: dto.status,
          reviewedById: adminId,
          reviewedAt: new Date(),
          reviewNote: dto.note,
        },
        include: {
          artist: true,
          user: { select: { id: true, username: true, email: true } },
        },
      });
    });
  }

  private async expireVerificationRequests(where?: {
    artistId?: string;
    requesterUserId?: string;
  }) {
    const deadline = new Date();
    deadline.setUTCDate(deadline.getUTCDate() - 10);
    await this.prisma.artistVerificationRequest.updateMany({
      where: {
        ...where,
        status: "PENDING",
        createdAt: { lte: deadline },
      },
      data: {
        status: "REJECTED",
        reviewedAt: new Date(),
        reviewNote:
          "La solicitud venció sin una decisión administrativa en 10 días.",
      },
    });
  }

  private async requireMembership(userId: string, artistId: string) {
    const membership = await this.prisma.artistMembership.findUnique({
      where: { userId_artistId: { userId, artistId } },
    });
    if (!membership || membership.status !== "ACTIVE") {
      throw new ForbiddenException("Artist membership required");
    }
    return membership;
  }

  private async requireMusicManager(userId: string, artistId: string) {
    const membership = await this.requireMembership(userId, artistId);
    if (membership.role === ArtistMemberRole.ANALYST) {
      throw new ForbiddenException(
        "Analyst members cannot manage the music catalog",
      );
    }
    return membership;
  }

  private async requireArtistTrack(artistId: string, trackId: string) {
    const track = await this.prisma.track.findFirst({
      where: { id: trackId, artistId, isCatalog: true },
      select: { id: true },
    });
    if (!track) throw new NotFoundException("Catalog track not found");
    return track;
  }

  /** Evidence uploaded before the dedicated bucket used the images bucket. */
  private documentBucket(key: string): "images" | "artistEvidence" {
    return key.startsWith("artist-verification/") ? "images" : "artistEvidence";
  }

  private parseEvidenceLinks(raw?: string): string[] {
    if (!raw) return [];
    let values: unknown;
    try {
      values = JSON.parse(raw);
    } catch {
      throw new BadRequestException("Los enlaces de evidencia no son válidos.");
    }
    if (!Array.isArray(values) || values.length > 8) {
      throw new BadRequestException("Puedes adjuntar entre 1 y 8 enlaces.");
    }
    const links = values.map((value) => String(value).trim()).filter(Boolean);
    for (const link of links) {
      let parsed: URL;
      try {
        parsed = new URL(link);
      } catch {
        throw new BadRequestException(
          "Cada enlace de evidencia debe ser una URL válida.",
        );
      }
      if (!["http:", "https:"].includes(parsed.protocol)) {
        throw new BadRequestException("Los enlaces deben usar HTTP o HTTPS.");
      }
    }
    return [...new Set(links)];
  }
}
