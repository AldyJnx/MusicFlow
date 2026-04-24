import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { PlayDevice, StatsPeriod } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async recordPlay(userId: string, data: {
    trackId: string;
    durationListenedMs: number;
    completed: boolean;
    skipped: boolean;
    device: PlayDevice;
    eqConfigUsedId?: string;
  }) {
    return this.prisma.playHistory.create({
      data: {
        userId,
        trackId: data.trackId,
        playedAt: new Date(),
        durationListenedMs: data.durationListenedMs,
        completed: data.completed,
        skipped: data.skipped,
        device: data.device,
        eqConfigUsedId: data.eqConfigUsedId,
      },
    });
  }

  async getPlayHistory(userId: string, params?: {
    skip?: number;
    take?: number;
    trackId?: string;
    from?: Date;
    to?: Date;
  }) {
    const { skip = 0, take = 50, trackId, from, to } = params || {};

    const where: any = { userId };

    if (trackId) where.trackId = trackId;
    if (from || to) {
      where.playedAt = {};
      if (from) where.playedAt.gte = from;
      if (to) where.playedAt.lte = to;
    }

    const [history, total] = await Promise.all([
      this.prisma.playHistory.findMany({
        where,
        skip,
        take,
        orderBy: { playedAt: 'desc' },
        include: { track: { select: { title: true, artist: true, album: true, coverArt: true } } },
      }),
      this.prisma.playHistory.count({ where }),
    ]);

    return { history, total, skip, take };
  }

  async getStats(userId: string, period: StatsPeriod) {
    const now = new Date();
    let periodStart: Date;

    switch (period) {
      case 'DAY':
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'WEEK':
        const dayOfWeek = now.getDay();
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
        break;
      case 'MONTH':
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'ALL_TIME':
        periodStart = new Date(0);
        break;
    }

    // Try to find pre-computed stats
    const cachedStats = await this.prisma.listeningStats.findFirst({
      where: { userId, period, periodStart },
    });

    if (cachedStats) {
      return cachedStats;
    }

    // Compute stats on the fly
    return this.computeStats(userId, period, periodStart);
  }

  async computeStats(userId: string, period: StatsPeriod, periodStart: Date) {
    const plays = await this.prisma.playHistory.findMany({
      where: {
        userId,
        playedAt: { gte: periodStart },
      },
      include: { track: true },
    });

    const trackCounts = new Map<string, { count: number; track: any }>();
    const artistCounts = new Map<string, number>();
    const albumCounts = new Map<string, number>();
    let totalTimeMs = 0;

    for (const play of plays) {
      totalTimeMs += play.durationListenedMs;

      const trackKey = play.trackId;
      const existing = trackCounts.get(trackKey);
      trackCounts.set(trackKey, {
        count: (existing?.count || 0) + 1,
        track: play.track,
      });

      artistCounts.set(play.track.artist, (artistCounts.get(play.track.artist) || 0) + 1);
      if (play.track.album) {
        albumCounts.set(play.track.album, (albumCounts.get(play.track.album) || 0) + 1);
      }
    }

    const topTracks = Array.from(trackCounts.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([id, data]) => ({ id, count: data.count, title: data.track.title, artist: data.track.artist }));

    const topArtists = Array.from(artistCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    const topAlbums = Array.from(albumCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    return {
      userId,
      period,
      periodStart,
      totalPlays: plays.length,
      totalTimeMs,
      uniqueTracks: trackCounts.size,
      uniqueArtists: artistCounts.size,
      topTracks,
      topArtists,
      topAlbums,
      topEqPresets: [],
    };
  }

  async getRecentlyPlayed(userId: string, limit = 20) {
    const plays = await this.prisma.playHistory.findMany({
      where: { userId },
      orderBy: { playedAt: 'desc' },
      take: limit,
      distinct: ['trackId'],
      include: { track: true },
    });

    return plays.map(p => p.track);
  }

  async getMostPlayed(userId: string, limit = 20) {
    const plays = await this.prisma.playHistory.groupBy({
      by: ['trackId'],
      where: { userId },
      _count: { trackId: true },
      orderBy: { _count: { trackId: 'desc' } },
      take: limit,
    });

    const trackIds = plays.map(p => p.trackId);
    const tracks = await this.prisma.track.findMany({
      where: { id: { in: trackIds } },
    });

    return plays.map(p => ({
      ...tracks.find(t => t.id === p.trackId),
      playCount: p._count.trackId,
    }));
  }
}
