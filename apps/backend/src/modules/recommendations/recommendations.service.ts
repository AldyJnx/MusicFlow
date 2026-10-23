import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { RecommendationCacheService } from "./recommendation-cache.service";

const trackCardSelect = {
  id: true,
  userId: true,
  title: true,
  artist: true,
  album: true,
  genre: true,
  durationMs: true,
  coverArt: true,
  artistImage: true,
  fileUrlRemote: true,
  artistId: true,
  source: true,
  syncStatus: true,
  createdAt: true,
  updatedAt: true,
} as const;

type RecommendationResult = {
  tracks: Array<Record<string, unknown>>;
  generatedAt: string;
};

@Injectable()
export class RecommendationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: RecommendationCacheService,
  ) {}

  async home(
    userId: string,
    requestedLimit = 6,
  ): Promise<RecommendationResult> {
    const limit = Math.min(20, Math.max(1, Number(requestedLimit) || 6));
    const cached = await this.cache.get<RecommendationResult>(userId, limit);
    if (cached) return cached;

    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 86_400_000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 86_400_000);

    const [candidates, follows, history, saves, impressions, popularity] =
      await Promise.all([
        this.prisma.track.findMany({
          where: { isCatalog: true, fileUrlRemote: { not: null } },
          orderBy: { updatedAt: "desc" },
          take: 500,
          select: trackCardSelect,
        }),
        this.prisma.artistFollow.findMany({
          where: { userId },
          select: { artistId: true },
        }),
        this.prisma.playHistory.findMany({
          where: { userId, playedAt: { gte: ninetyDaysAgo } },
          orderBy: { playedAt: "desc" },
          take: 300,
          select: {
            trackId: true,
            playedAt: true,
            durationListenedMs: true,
            completed: true,
            skipped: true,
            track: { select: { artistId: true, artist: true, genre: true } },
          },
        }),
        this.prisma.userLibrarySave.findMany({
          where: { userId },
          orderBy: { savedAt: "desc" },
          take: 200,
          select: {
            trackId: true,
            track: { select: { artistId: true, artist: true, genre: true } },
          },
        }),
        this.prisma.recommendationImpression.findMany({
          where: { userId, shownAt: { gte: fourteenDaysAgo } },
          select: { trackId: true, shownAt: true },
        }),
        this.prisma.playHistory.groupBy({
          by: ["trackId"],
          where: { playedAt: { gte: ninetyDaysAgo } },
          _count: { trackId: true },
          orderBy: { _count: { trackId: "desc" } },
          take: 250,
        }),
      ]);

    const followedArtistIds = new Set(follows.map((follow) => follow.artistId));
    const artistAffinity = new Map<string, number>();
    const genreAffinity = new Map<string, number>();
    const skippedTrackIds = new Set<string>();
    const recentlyPlayed = new Map<string, Date>();

    for (const play of history) {
      const artistKey = play.track.artistId ?? play.track.artist.toLowerCase();
      const contribution = play.skipped ? -2 : play.completed ? 3 : 1;
      artistAffinity.set(
        artistKey,
        (artistAffinity.get(artistKey) ?? 0) + contribution,
      );
      if (play.track.genre) {
        genreAffinity.set(
          play.track.genre.toLowerCase(),
          (genreAffinity.get(play.track.genre.toLowerCase()) ?? 0) +
            contribution,
        );
      }
      if (play.skipped) skippedTrackIds.add(play.trackId);
      if (!recentlyPlayed.has(play.trackId))
        recentlyPlayed.set(play.trackId, play.playedAt);
    }

    for (const save of saves) {
      const artistKey = save.track.artistId ?? save.track.artist.toLowerCase();
      artistAffinity.set(artistKey, (artistAffinity.get(artistKey) ?? 0) + 4);
      if (save.track.genre) {
        const genre = save.track.genre.toLowerCase();
        genreAffinity.set(genre, (genreAffinity.get(genre) ?? 0) + 3);
      }
    }

    const popularityByTrack = new Map(
      popularity.map((row) => [row.trackId, row._count.trackId]),
    );
    const maxPopularity = Math.max(1, ...popularityByTrack.values());
    const latestImpression = new Map<string, Date>();
    for (const impression of impressions) {
      const current = latestImpression.get(impression.trackId);
      if (!current || current < impression.shownAt) {
        latestImpression.set(impression.trackId, impression.shownAt);
      }
    }

    const scored = candidates
      .map((track) => {
        const artistKey = track.artistId ?? track.artist.toLowerCase();
        const followed =
          !!track.artistId && followedArtistIds.has(track.artistId);
        let score = followed ? 12 : 0;
        score +=
          Math.min(12, Math.max(-8, artistAffinity.get(artistKey) ?? 0)) * 0.8;
        score +=
          Math.min(
            10,
            Math.max(-6, genreAffinity.get(track.genre.toLowerCase()) ?? 0),
          ) * 0.55;
        score += ((popularityByTrack.get(track.id) ?? 0) / maxPopularity) * 4;
        score += this.stableJitter(`${userId}:${track.id}`);

        const playedAt = recentlyPlayed.get(track.id);
        if (playedAt) {
          const ageHours = (now.getTime() - playedAt.getTime()) / 3_600_000;
          score -= ageHours < 24 ? 7 : ageHours < 168 ? 3 : 0.5;
        }
        const shownAt = latestImpression.get(track.id);
        if (shownAt) {
          const ageHours = (now.getTime() - shownAt.getTime()) / 3_600_000;
          score -= ageHours < 24 ? 9 : ageHours < 168 ? 4 : 1;
        }
        if (skippedTrackIds.has(track.id)) score -= 5;

        const reason = followed
          ? "Artista que sigues"
          : (artistAffinity.get(artistKey) ?? 0) > 0
            ? "Segun tu historial"
            : (genreAffinity.get(track.genre.toLowerCase()) ?? 0) > 0
              ? "Genero que escuchas"
              : "Popular en MusicFlow";
        return { track, score, reason };
      })
      .sort((a, b) => b.score - a.score);

    const artistCounts = new Map<string, number>();
    const selected: typeof scored = [];
    const deferred: typeof scored = [];
    for (const candidate of scored) {
      const artistKey =
        candidate.track.artistId ?? candidate.track.artist.toLowerCase();
      if ((artistCounts.get(artistKey) ?? 0) >= 2) {
        deferred.push(candidate);
        continue;
      }
      artistCounts.set(artistKey, (artistCounts.get(artistKey) ?? 0) + 1);
      selected.push(candidate);
      if (selected.length === limit) break;
    }
    // Keep the artist cap whenever possible, but do not return an unexpectedly
    // short recommendation rail when the catalogue has few artists.
    if (selected.length < limit) {
      for (const candidate of deferred) {
        selected.push(candidate);
        if (selected.length === limit) break;
      }
    }

    const generatedAt = now.toISOString();
    const result: RecommendationResult = {
      tracks: selected.map(({ track, reason }) => ({
        ...track,
        recommendationReason: reason,
      })),
      generatedAt,
    };

    if (selected.length > 0) {
      await this.prisma.recommendationImpression.createMany({
        data: selected.map(({ track, score, reason }) => ({
          userId,
          trackId: track.id,
          score,
          reason,
        })),
      });
    }
    await this.cache.set(userId, limit, result);
    return result;
  }

  private stableJitter(value: string): number {
    let hash = 0;
    for (let i = 0; i < value.length; i += 1) {
      hash = (hash * 31 + value.charCodeAt(i)) | 0;
    }
    return (Math.abs(hash) % 1000) / 1000;
  }
}
