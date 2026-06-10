import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, ReverbPreset } from "@prisma/client";
import { PrismaService } from "@/prisma/prisma.service";

// Whitelist of fields returned by admin mutation endpoints. Excludes
// `password`, `passwordResetToken`, and `passwordResetExpires` so credentials
// never leak through the API — even to ADMIN callers.
const USER_ADMIN_SELECT = {
  id: true,
  email: true,
  username: true,
  role: true,
  avatar: true,
  isPremium: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats() {
    const [
      totalUsers,
      premiumUsers,
      totalTracks,
      totalPlaylists,
      totalAiRequests,
      recentUsers,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isPremium: true } }),
      this.prisma.track.count(),
      this.prisma.playlist.count(),
      this.prisma.aIRequest.count(),
      this.prisma.user.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    return {
      users: {
        total: totalUsers,
        premium: premiumUsers,
        recentWeek: recentUsers,
      },
      content: { tracks: totalTracks, playlists: totalPlaylists },
      ai: { totalRequests: totalAiRequests },
    };
  }

  async getUsers(params?: { skip?: number; take?: number; search?: string }) {
    const { skip = 0, take = 50, search } = params || {};

    const where: Prisma.UserWhereInput = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { username: { contains: search, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          isPremium: true,
          isActive: true,
          createdAt: true,
          _count: { select: { tracks: true, playlists: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { users, total, skip, take };
  }

  async getUserDetail(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        ...USER_ADMIN_SELECT,
        devices: {
          select: {
            id: true,
            deviceType: true,
            deviceName: true,
            lastSyncAt: true,
            isActive: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
        preferences: {
          select: {
            theme: true,
            playerLayout: true,
            libraryLayout: true,
            crossfadeEnabled: true,
            crossfadeDurationMs: true,
            gaplessEnabled: true,
            scrobbleEnabled: true,
            scrobbleThreshold: true,
            updatedAt: true,
          },
        },
        _count: {
          select: {
            tracks: true,
            playlists: true,
            eqPresets: true,
            eqConfigs: true,
            eqSegments: true,
            aiRequests: true,
            playHistory: true,
            devices: true,
          },
        },
      },
    });

    if (!user) throw new NotFoundException("User not found");

    const [recentPlays, recentAiRequests, aiSpend] = await Promise.all([
      this.prisma.playHistory.findMany({
        where: { userId },
        orderBy: { playedAt: "desc" },
        take: 10,
        select: {
          id: true,
          playedAt: true,
          durationListenedMs: true,
          completed: true,
          skipped: true,
          device: true,
          track: { select: { id: true, title: true, artist: true } },
        },
      }),
      this.prisma.aIRequest.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          prompt: true,
          modelUsed: true,
          tokensInput: true,
          tokensOutput: true,
          costUsd: true,
          feedback: true,
          wasAccepted: true,
          responseTimeMs: true,
          createdAt: true,
        },
      }),
      this.prisma.aIRequest.aggregate({
        where: { userId },
        _sum: {
          tokensInput: true,
          tokensOutput: true,
          costUsd: true,
        },
      }),
    ]);

    return {
      user,
      recentPlays,
      recentAiRequests,
      aiSpend: {
        tokensInput: aiSpend._sum.tokensInput ?? 0,
        tokensOutput: aiSpend._sum.tokensOutput ?? 0,
        costUsd: aiSpend._sum.costUsd?.toString() ?? "0",
      },
    };
  }

  async updateUserRole(userId: string, role: "ADMIN" | "CLIENT") {
    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
      select: USER_ADMIN_SELECT,
    });
  }

  async updateUserPremium(userId: string, isPremium: boolean) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { isPremium },
      select: USER_ADMIN_SELECT,
    });
  }

  async deactivateUser(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
      select: USER_ADMIN_SELECT,
    });
  }

  async getUserGrowth(days = 30) {
    const clamped = Math.min(Math.max(Math.floor(days), 1), 365);

    // Day buckets [today-N+1 .. today], inclusive. Dates are computed in UTC to
    // match how Postgres stores `created_at` (DateTime without timezone).
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setUTCDate(start.getUTCDate() - (clamped - 1));

    const rows = await this.prisma.$queryRaw<{ day: Date; count: bigint }[]>`
      SELECT date_trunc('day', "created_at") AS day, COUNT(*)::bigint AS count
      FROM "users"
      WHERE "created_at" >= ${start}
      GROUP BY day
      ORDER BY day ASC
    `;

    const counts = new Map<string, number>();
    for (const r of rows) {
      const key = r.day.toISOString().slice(0, 10);
      counts.set(key, Number(r.count));
    }

    const series: { date: string; count: number }[] = [];
    for (let i = 0; i < clamped; i++) {
      const d = new Date(start);
      d.setUTCDate(start.getUTCDate() + i);
      const key = d.toISOString().slice(0, 10);
      series.push({ date: key, count: counts.get(key) ?? 0 });
    }

    const total = series.reduce((sum, p) => sum + p.count, 0);
    return { days: clamped, total, series };
  }

  /**
   * DAU / WAU / MAU. A user is "active" in a window if their `lastLogin`
   * falls inside that window. Users who have never logged in (`lastLogin`
   * is null) are excluded — they count as registered, not active.
   *
   * Total is provided so the UI can show "X of Y" ratios without an
   * extra round-trip.
   */
  async getActiveUsers() {
    const now = Date.now();
    const day = new Date(now - 24 * 60 * 60 * 1000);
    const week = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const month = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const [dau, wau, mau, total] = await Promise.all([
      this.prisma.user.count({ where: { lastLogin: { gte: day } } }),
      this.prisma.user.count({ where: { lastLogin: { gte: week } } }),
      this.prisma.user.count({ where: { lastLogin: { gte: month } } }),
      this.prisma.user.count(),
    ]);

    return { dau, wau, mau, total };
  }

  async getCatalogDistribution() {
    const [byGenreRaw, byCodecRaw, totals] = await Promise.all([
      this.prisma.track.groupBy({
        by: ["genre"],
        _count: { _all: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
      }),
      this.prisma.track.groupBy({
        by: ["codec"],
        _count: { _all: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
      }),
      this.prisma.track.aggregate({
        _count: { _all: true },
        _sum: { fileSizeBytes: true, durationMs: true },
      }),
    ]);

    const normalize = (label: string) =>
      label && label.trim().length > 0 ? label : "Sin especificar";

    return {
      totalTracks: totals._count._all,
      totalBytes: Number(totals._sum.fileSizeBytes ?? 0),
      totalDurationMs: totals._sum.durationMs ?? 0,
      byGenre: byGenreRaw.map((r) => ({
        label: normalize(r.genre),
        count: r._count._all,
      })),
      byCodec: byCodecRaw.map((r) => ({
        label: normalize(r.codec),
        count: r._count._all,
      })),
    };
  }

  async listGlobalPresets() {
    return this.prisma.eQPreset.findMany({
      where: { isGlobal: true },
      orderBy: { name: "asc" },
    });
  }

  async createGlobalPreset(data: {
    name: string;
    bands: number[];
    bassBoost?: number;
    virtualizer?: number;
    loudness?: number;
    reverbPreset?: ReverbPreset;
    reverbAmount?: number;
  }) {
    this.validatePresetPayload(data);
    return this.prisma.eQPreset.create({
      data: {
        name: data.name.trim(),
        bands: data.bands,
        bassBoost: data.bassBoost ?? 0,
        virtualizer: data.virtualizer ?? 0,
        loudness: data.loudness ?? 0,
        reverbPreset: data.reverbPreset ?? "NONE",
        reverbAmount: data.reverbAmount ?? 0,
        isGlobal: true,
      },
    });
  }

  async updateGlobalPreset(
    id: string,
    data: {
      name?: string;
      bands?: number[];
      bassBoost?: number;
      virtualizer?: number;
      loudness?: number;
      reverbPreset?: ReverbPreset;
      reverbAmount?: number;
    },
  ) {
    const existing = await this.prisma.eQPreset.findFirst({
      where: { id, isGlobal: true },
    });
    if (!existing) throw new NotFoundException("Global preset not found");

    this.validatePresetPayload(data, { partial: true });

    return this.prisma.eQPreset.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.bands !== undefined && { bands: data.bands }),
        ...(data.bassBoost !== undefined && { bassBoost: data.bassBoost }),
        ...(data.virtualizer !== undefined && {
          virtualizer: data.virtualizer,
        }),
        ...(data.loudness !== undefined && { loudness: data.loudness }),
        ...(data.reverbPreset !== undefined && {
          reverbPreset: data.reverbPreset,
        }),
        ...(data.reverbAmount !== undefined && {
          reverbAmount: data.reverbAmount,
        }),
      },
    });
  }

  async deleteGlobalPreset(id: string) {
    const existing = await this.prisma.eQPreset.findFirst({
      where: { id, isGlobal: true },
    });
    if (!existing) throw new NotFoundException("Global preset not found");
    return this.prisma.eQPreset.delete({ where: { id } });
  }

  private validatePresetPayload(
    data: {
      name?: string;
      bands?: number[];
      bassBoost?: number;
      virtualizer?: number;
      loudness?: number;
      reverbAmount?: number;
    },
    opts: { partial?: boolean } = {},
  ) {
    const requireName = !opts.partial;
    const requireBands = !opts.partial;

    if (requireName && (!data.name || !data.name.trim())) {
      throw new BadRequestException("name is required");
    }
    if (data.name !== undefined && data.name.trim().length > 60) {
      throw new BadRequestException("name must be <= 60 characters");
    }
    if (requireBands && !Array.isArray(data.bands)) {
      throw new BadRequestException("bands must be an array");
    }
    if (data.bands !== undefined) {
      if (data.bands.length !== 10) {
        throw new BadRequestException("bands must have exactly 10 values");
      }
      for (const v of data.bands) {
        if (typeof v !== "number" || v < -15 || v > 15) {
          throw new BadRequestException(
            "each band must be a number between -15 and 15 dB",
          );
        }
      }
    }
    const knobs: [string, number | undefined][] = [
      ["bassBoost", data.bassBoost],
      ["virtualizer", data.virtualizer],
      ["loudness", data.loudness],
      ["reverbAmount", data.reverbAmount],
    ];
    for (const [key, v] of knobs) {
      if (v !== undefined && (typeof v !== "number" || v < 0 || v > 100)) {
        throw new BadRequestException(`${key} must be between 0 and 100`);
      }
    }
  }

  async getAiCosts(days = 30) {
    const clamped = Math.min(Math.max(Math.floor(days), 1), 365);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setUTCDate(start.getUTCDate() - (clamped - 1));

    // Run aggregate, daily breakdown, top models, top users in parallel.
    const [totals, dailyRaw, byModelRaw, byUserRaw] = await Promise.all([
      this.prisma.aIRequest.aggregate({
        _count: { _all: true },
        _sum: {
          tokensInput: true,
          tokensOutput: true,
          costUsd: true,
          responseTimeMs: true,
        },
      }),
      this.prisma.$queryRaw<
        { day: Date; cost: number | null; requests: bigint }[]
      >`
        SELECT date_trunc('day', "created_at") AS day,
               SUM("cost_usd")::float8 AS cost,
               COUNT(*)::bigint AS requests
        FROM "ai_requests"
        WHERE "created_at" >= ${start}
        GROUP BY day
        ORDER BY day ASC
      `,
      this.prisma.aIRequest.groupBy({
        by: ["modelUsed"],
        _sum: { costUsd: true, tokensInput: true, tokensOutput: true },
        _count: { _all: true },
        orderBy: { _sum: { costUsd: "desc" } },
        take: 10,
      }),
      // Group by userId and join usernames in a second roundtrip — Prisma
      // groupBy doesn't include relations directly.
      this.prisma.aIRequest.groupBy({
        by: ["userId"],
        _sum: { costUsd: true },
        _count: { _all: true },
        orderBy: { _sum: { costUsd: "desc" } },
        take: 10,
      }),
    ]);

    const userIds = byUserRaw.map((u) => u.userId);
    const users = userIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, username: true, email: true },
        })
      : [];
    const userMap = new Map(users.map((u) => [u.id, u]));

    const dailyMap = new Map<string, { cost: number; requests: number }>();
    for (const r of dailyRaw) {
      const key = r.day.toISOString().slice(0, 10);
      dailyMap.set(key, {
        cost: r.cost ?? 0,
        requests: Number(r.requests),
      });
    }

    const daily: { date: string; cost: number; requests: number }[] = [];
    for (let i = 0; i < clamped; i++) {
      const d = new Date(start);
      d.setUTCDate(start.getUTCDate() + i);
      const key = d.toISOString().slice(0, 10);
      const point = dailyMap.get(key) ?? { cost: 0, requests: 0 };
      daily.push({ date: key, ...point });
    }

    const totalRequests = totals._count._all;
    const totalCost = Number(totals._sum.costUsd ?? 0);
    const totalLatencyMs = totals._sum.responseTimeMs ?? 0;

    return {
      days: clamped,
      totals: {
        requests: totalRequests,
        costUsd: totalCost,
        tokensInput: totals._sum.tokensInput ?? 0,
        tokensOutput: totals._sum.tokensOutput ?? 0,
        avgCostUsd: totalRequests > 0 ? totalCost / totalRequests : 0,
        avgLatencyMs:
          totalRequests > 0 ? Math.round(totalLatencyMs / totalRequests) : 0,
      },
      daily,
      byModel: byModelRaw.map((m) => ({
        model: m.modelUsed,
        requests: m._count._all,
        costUsd: Number(m._sum.costUsd ?? 0),
        tokensInput: m._sum.tokensInput ?? 0,
        tokensOutput: m._sum.tokensOutput ?? 0,
      })),
      byUser: byUserRaw.map((u) => {
        const meta = userMap.get(u.userId);
        return {
          userId: u.userId,
          username: meta?.username ?? "?",
          email: meta?.email ?? "",
          requests: u._count._all,
          costUsd: Number(u._sum.costUsd ?? 0),
        };
      }),
    };
  }

  async getAiFeedbackStats() {
    const [goodCount, badCount, neutralCount] = await Promise.all([
      this.prisma.aIRequest.count({ where: { feedback: "GOOD" } }),
      this.prisma.aIRequest.count({ where: { feedback: "BAD" } }),
      this.prisma.aIRequest.count({ where: { feedback: "NEUTRAL" } }),
    ]);

    const total = goodCount + badCount + neutralCount;

    return {
      total,
      good: goodCount,
      bad: badCount,
      neutral: neutralCount,
      satisfactionRate: total > 0 ? (goodCount / total) * 100 : 0,
    };
  }

  async getRecentAiRequests(limit = 20) {
    return this.prisma.aIRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        user: { select: { email: true, username: true } },
        track: { select: { title: true, artist: true } },
      },
    });
  }
}
