import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { execFile } from "child_process";
import { promisify } from "util";
import { Prisma, ReverbPreset, UserRole } from "@prisma/client";
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

/** Consumer selected on the "Peticiones IA" analytics: end users, admins or both. */
export const AI_USAGE_SCOPES = ["all", "user", "admin"] as const;
export type AiUsageScope = (typeof AI_USAGE_SCOPES)[number];

/** Origin of an AI request inside the report, used to split both consumptions. */
export type AiUsageOrigin = "USERS" | "ADMINS";

type AiUsage = {
  requests: number;
  costUsd: number;
  tokensInput: number;
  tokensOutput: number;
  latencyMs: number;
};

type AiActivityRow = {
  bucket: Date;
  requests: bigint;
  tokensInput: bigint;
  tokensOutput: bigint;
  fulfilled: bigint;
  unfulfilled: bigint;
};

type AiActivityPoint = {
  date: string;
  requests: number;
  tokensInput: number;
  tokensOutput: number;
  fulfilled: number;
  unfulfilled: number;
};

type AiModelAggregate = {
  modelUsed: string;
  _count: { _all: number };
  _sum: {
    tokensInput: number | null;
    tokensOutput: number | null;
    costUsd?: unknown;
  };
};

type AiModelRow = {
  model: string;
  origin: AiUsageOrigin;
  requests: number;
  costUsd: number;
  tokensInput: number;
  tokensOutput: number;
};

type AiUsageRaw = {
  requests: bigint;
  costUsd: number;
  tokensInput: bigint;
  tokensOutput: bigint;
  latencyMs: bigint;
};

export function parseAiUsageScope(value: unknown): AiUsageScope {
  const raw = Array.isArray(value) ? value[0] : value;
  const normalized = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  return (AI_USAGE_SCOPES as readonly string[]).includes(normalized)
    ? (normalized as AiUsageScope)
    : "all";
}

function mergeAiUsage(parts: AiUsage[]): AiUsage {
  return parts.reduce<AiUsage>(
    (acc, part) => ({
      requests: acc.requests + part.requests,
      costUsd: acc.costUsd + part.costUsd,
      tokensInput: acc.tokensInput + part.tokensInput,
      tokensOutput: acc.tokensOutput + part.tokensOutput,
      latencyMs: acc.latencyMs + part.latencyMs,
    }),
    { requests: 0, costUsd: 0, tokensInput: 0, tokensOutput: 0, latencyMs: 0 },
  );
}

function averageLatency(usage: AiUsage): number {
  return usage.requests > 0 ? Math.round(usage.latencyMs / usage.requests) : 0;
}

function toAiUsageSummary(usage: AiUsage) {
  return {
    requests: usage.requests,
    costUsd: usage.costUsd,
    tokensInput: usage.tokensInput,
    tokensOutput: usage.tokensOutput,
    avgLatencyMs: averageLatency(usage),
  };
}

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Admin-only, idempotent R2 ingestion. In production this command is a
   * natural BullMQ worker job; keeping the orchestration here lets the local
   * Admin button use the exact audited scripts without exposing a shell input.
   */
  async syncCatalogFromR2() {
    const run = promisify(execFile);
    // execFile cannot execute a .cmd shim directly on Windows (it fails with
    // EINVAL). Run the fixed command through cmd.exe there; command names are
    // internal constants, never request input.
    const executable = process.platform === "win32" ? "cmd.exe" : "pnpm";
    // `seed:r2` is incremental: it uses the stable R2 object hash and only
    // creates or refreshes rows whose storage metadata changed. The old flow
    // ran four full catalog rebuilds on every button click, monopolizing the
    // request until the browser timed out.
    // The admin control is intentionally an incremental audio import only.
    // Full integrity repair is an offline maintenance task; running it here
    // made the HTTP request appear stuck after the useful work had finished.
    const commands = ["seed:r2"];
    const output: string[] = [];
    for (const command of commands) {
      const args =
        process.platform === "win32"
          ? ["/d", "/s", "/c", `pnpm run ${command}`]
          : ["run", command];
      const result = await run(executable, args, {
        cwd: process.cwd(),
        timeout: 10 * 60_000,
        maxBuffer: 2 * 1024 * 1024,
      });
      output.push(result.stdout);
    }
    const fullOutput = output.join("\n");
    const tracks = fullOutput.match(
      /Done\. created=(\d+) skipped=(\d+) refreshed=(\d+) removedFromCatalog=(\d+)/,
    );
    const albums = fullOutput.match(/Albums: (\d+) created, (\d+) updated/);
    const lyrics = fullOutput.match(
      /Lyrics: (\d+) synchronized, (\d+) unchanged, (\d+) without a match/,
    );
    const integrity = fullOutput.match(
      /Integrity: valid=(true|false) (\{.+\})/,
    );
    const integritySummary = integrity
      ? (JSON.parse(integrity[2]) as {
          artistImagesMissing: number;
          albumsIncomplete: number;
          trackCoverMismatches: number;
          trackCoversRepaired: number;
          duplicateArtists: number;
          featuredCreditsLinked: number;
        })
      : null;

    return {
      completed: true,
      summary: {
        tracks: tracks
          ? {
              created: Number(tracks[1]),
              skipped: Number(tracks[2]),
              refreshed: Number(tracks[3]),
              removedFromCatalog: Number(tracks[4]),
            }
          : null,
        albums: albums
          ? { created: Number(albums[1]), updated: Number(albums[2]) }
          : null,
        lyrics: lyrics
          ? {
              synchronized: Number(lyrics[1]),
              unchanged: Number(lyrics[2]),
              unmatched: Number(lyrics[3]),
            }
          : null,
        integrity: integritySummary,
      },
      output: fullOutput.slice(-12_000),
    };
  }

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

  async updateUserRole(userId: string, role: UserRole) {
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

  async deleteUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (!user) throw new NotFoundException("User not found");
    if (user.role === UserRole.ADMIN) {
      throw new BadRequestException(
        "Admin users cannot be deleted from this panel",
      );
    }
    await this.prisma.user.delete({ where: { id: userId } });
    return { deleted: true };
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

  /**
   * Daily Active Users series over the last N days. Each point is the
   * count of users whose `lastLogin` falls inside that 24h UTC bucket.
   * Used as a sparkline in the admin dashboard DAU card.
   *
   * Caveat: a user shows up in the bucket of their MOST RECENT login,
   * not in every day they were active — Prisma doesn't store login
   * history. Adequate for a rough trend line; replace with a sessions
   * table if you need true daily uniques.
   */
  async getActiveUsersTrend(days = 30) {
    const clamped = Math.min(Math.max(Math.floor(days), 1), 90);

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setUTCDate(start.getUTCDate() - (clamped - 1));

    const rows = await this.prisma.$queryRaw<{ day: Date; count: bigint }[]>`
      SELECT date_trunc('day', "last_login") AS day, COUNT(*)::bigint AS count
      FROM "users"
      WHERE "last_login" >= ${start}
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

    return { days: clamped, series };
  }

  /**
   * Top N most-recently-active users — used by the admin dashboard "power
   * users" widget. Excludes users who never logged in (lastLogin null) and
   * inactive accounts since they don't help the admin understand who's
   * actually pushing the platform forward.
   */
  async getTopActiveUsers(limit = 5) {
    const clamped = Math.min(Math.max(Math.floor(limit), 1), 20);

    const users = await this.prisma.user.findMany({
      where: {
        isActive: true,
        lastLogin: { not: null },
      },
      orderBy: { lastLogin: "desc" },
      take: clamped,
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        isPremium: true,
        role: true,
        lastLogin: true,
        createdAt: true,
        _count: { select: { tracks: true, playlists: true } },
      },
    });

    return users;
  }

  async getMusicInsights() {
    const limit = 5;
    type TrackRankingRow = {
      id: string;
      title: string;
      artist: string;
      coverArt: string | null;
      plays: bigint;
    };
    type ArtistListeningRow = {
      name: string;
      imageUrl: string | null;
      plays: bigint;
    };
    type GenreListeningRow = { name: string; plays: bigint };

    const [
      mostPlayed,
      leastPlayed,
      mostListenedArtists,
      mostFollowedArtists,
      mostListenedGenres,
    ] = await Promise.all([
      this.prisma.$queryRaw<TrackRankingRow[]>`
          SELECT t.id, t.title, t.artist, t.cover_art AS "coverArt", COUNT(ph.id)::bigint AS plays
          FROM tracks t
          INNER JOIN artists a ON a.id = t.artist_id
          LEFT JOIN play_history ph ON ph.track_id = t.id
          WHERE t.is_catalog = true
          GROUP BY t.id, t.title, t.artist, t.cover_art
          ORDER BY plays DESC, t.title ASC
          LIMIT ${limit}
        `,
      this.prisma.$queryRaw<TrackRankingRow[]>`
          SELECT t.id, t.title, t.artist, t.cover_art AS "coverArt", COUNT(ph.id)::bigint AS plays
          FROM tracks t
          INNER JOIN artists a ON a.id = t.artist_id
          LEFT JOIN play_history ph ON ph.track_id = t.id
          WHERE t.is_catalog = true
          GROUP BY t.id, t.title, t.artist, t.cover_art
          ORDER BY plays ASC, t.title ASC
          LIMIT ${limit}
        `,
      this.prisma.$queryRaw<ArtistListeningRow[]>`
          SELECT a.name, MAX(a.image_url) AS "imageUrl", COUNT(ph.id)::bigint AS plays
          FROM play_history ph
          INNER JOIN tracks t ON t.id = ph.track_id
          INNER JOIN artists a ON a.id = t.artist_id
          WHERE t.is_catalog = true
          GROUP BY a.id, a.name
          ORDER BY plays DESC, name ASC
          LIMIT ${limit}
        `,
      this.prisma.artist.findMany({
        where: { tracks: { some: { isCatalog: true } } },
        orderBy: { followers: { _count: "desc" } },
        take: limit,
        select: {
          id: true,
          name: true,
          imageUrl: true,
          _count: { select: { followers: true } },
        },
      }),
      this.prisma.$queryRaw<GenreListeningRow[]>`
          SELECT t.genre AS name, COUNT(ph.id)::bigint AS plays
          FROM play_history ph
          INNER JOIN tracks t ON t.id = ph.track_id
          WHERE t.is_catalog = true
            AND t.genre IS NOT NULL
            AND btrim(t.genre) <> ''
          GROUP BY t.genre
          ORDER BY plays DESC, name ASC
          LIMIT ${limit}
        `,
    ]);

    return {
      mostPlayed: mostPlayed.map((track) => ({
        ...track,
        plays: Number(track.plays),
      })),
      leastPlayed: leastPlayed.map((track) => ({
        ...track,
        plays: Number(track.plays),
      })),
      mostListenedArtists: mostListenedArtists.map((artist) => ({
        ...artist,
        plays: Number(artist.plays),
      })),
      mostFollowedArtists: mostFollowedArtists.map((artist) => ({
        id: artist.id,
        name: artist.name,
        imageUrl: artist.imageUrl,
        followers: artist._count.followers,
      })),
      mostListenedGenres: mostListenedGenres.map((genre) => ({
        name: genre.name,
        plays: Number(genre.plays),
      })),
    };
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

  private normalizeCatalogGenre(name: string): string {
    return name
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLocaleLowerCase()
      .replace(/[^a-z0-9]+/g, "")
      .trim();
  }

  private sanitizeCatalogGenre(name: string): string {
    const value = name.trim().replace(/\s+/g, " ");
    if (value.length < 2 || value.length > 60) {
      throw new BadRequestException(
        "El género debe tener entre 2 y 60 caracteres.",
      );
    }
    return `${value[0].toLocaleUpperCase("es-PE")}${value.slice(1)}`;
  }

  async listCatalogGenres() {
    const artistGenres = await this.prisma.artist.findMany({
      select: { genres: true },
    });
    const legacy = new Map<string, string>();
    for (const artist of artistGenres) {
      for (const raw of artist.genres) {
        const name = raw.trim();
        const normalizedName = this.normalizeCatalogGenre(name);
        if (name && normalizedName) legacy.set(normalizedName, name);
      }
    }
    if (legacy.size > 0) {
      await this.prisma.catalogGenre.createMany({
        data: [...legacy.entries()].map(([normalizedName, name]) => ({
          name,
          normalizedName,
        })),
        skipDuplicates: true,
      });
    }

    const genres = await this.prisma.catalogGenre.findMany({
      orderBy: { name: "asc" },
    });
    const counts = await Promise.all(
      genres.map((genre) =>
        this.prisma.artist.count({ where: { genres: { has: genre.name } } }),
      ),
    );
    return genres.map((genre, index) => ({
      ...genre,
      artistCount: counts[index] ?? 0,
    }));
  }

  async createCatalogGenre(rawName: string) {
    const name = this.sanitizeCatalogGenre(rawName);
    return this.prisma.catalogGenre.create({
      data: { name, normalizedName: this.normalizeCatalogGenre(name) },
    });
  }

  async updateCatalogGenre(id: string, rawName?: string) {
    if (rawName === undefined) {
      throw new BadRequestException("El nombre del género es obligatorio.");
    }
    const current = await this.prisma.catalogGenre.findUnique({
      where: { id },
    });
    if (!current) throw new NotFoundException("Género no encontrado.");
    const name = this.sanitizeCatalogGenre(rawName);
    const normalizedName = this.normalizeCatalogGenre(name);
    if (normalizedName === current.normalizedName) return current;

    const impactedArtists = await this.prisma.artist.findMany({
      where: { genres: { has: current.name } },
      select: { id: true, genres: true },
    });
    await this.prisma.$transaction([
      this.prisma.catalogGenre.update({
        where: { id },
        data: { name, normalizedName },
      }),
      this.prisma.track.updateMany({
        where: { genre: current.name },
        data: { genre: name },
      }),
      ...impactedArtists.map((artist) =>
        this.prisma.artist.update({
          where: { id: artist.id },
          data: {
            genres: artist.genres.map((genre) =>
              genre === current.name ? name : genre,
            ),
          },
        }),
      ),
    ]);
    return this.prisma.catalogGenre.findUniqueOrThrow({ where: { id } });
  }

  async deleteCatalogGenre(id: string) {
    const current = await this.prisma.catalogGenre.findUnique({
      where: { id },
    });
    if (!current) throw new NotFoundException("Género no encontrado.");
    const impactedArtists = await this.prisma.artist.findMany({
      where: { genres: { has: current.name } },
      select: { id: true, genres: true },
    });
    await this.prisma.$transaction([
      this.prisma.catalogGenre.delete({ where: { id } }),
      this.prisma.track.updateMany({
        where: { genre: current.name },
        // Track.genre is a required legacy display column. An empty string is
        // the canonical "unclassified" value and is ignored by genre queries.
        data: { genre: "" },
      }),
      ...impactedArtists.map((artist) =>
        this.prisma.artist.update({
          where: { id: artist.id },
          data: {
            genres: artist.genres.filter((genre) => genre !== current.name),
          },
        }),
      ),
    ]);
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

  /**
   * The split shown in the report is based on the AI product that consumed
   * the tokens, not on the account role. An administrator can still use the
   * end-user Haiku assistant, while NVIDIA is exclusively the catalog admin
   * assistant. This keeps the two analytics genuinely independent.
   */
  private playerAiWhere(
    scope: AiUsageScope,
    start?: Date,
  ): Prisma.AIRequestWhereInput {
    const dateFilter = start ? { createdAt: { gte: start } } : {};
    const nvidiaAdminRequest: Prisma.AIRequestWhereInput = {
      context: { path: ["source"], equals: "NVIDIA_ADMIN" },
    };

    if (scope === "admin") {
      return { AND: [dateFilter, nvidiaAdminRequest] };
    }
    if (scope === "user") {
      return { AND: [dateFilter, { NOT: nvidiaAdminRequest }] };
    }
    return dateFilter;
  }

  private aiRequestSourceCondition(scope: AiUsageScope): Prisma.Sql {
    if (scope === "admin") {
      return Prisma.sql`(r."context" ->> 'source') = 'NVIDIA_ADMIN'`;
    }
    if (scope === "user") {
      // PostgreSQL's IS DISTINCT FROM also includes requests whose JSON context
      // has no `source` key, which is how the existing Haiku audit rows are
      // stored. Prisma's JSON `NOT equals` excluded those rows as NULL.
      return Prisma.sql`(r."context" ->> 'source') IS DISTINCT FROM 'NVIDIA_ADMIN'`;
    }
    return Prisma.sql`TRUE`;
  }

  private async getAiRequestUsage(
    scope: AiUsageScope,
    start: Date,
  ): Promise<AiUsage> {
    const condition = this.aiRequestSourceCondition(scope);
    const [row] = await this.prisma.$queryRaw<AiUsageRaw[]>`
      SELECT COUNT(*)::bigint AS requests,
             COALESCE(SUM(r."cost_usd"), 0)::float8 AS "costUsd",
             COALESCE(SUM(r."tokens_input"), 0)::bigint AS "tokensInput",
             COALESCE(SUM(r."tokens_output"), 0)::bigint AS "tokensOutput",
             COALESCE(SUM(r."response_time_ms"), 0)::bigint AS "latencyMs"
      FROM "ai_requests" r
      WHERE r."created_at" >= ${start} AND ${condition}
    `;
    return {
      requests: Number(row?.requests ?? 0),
      costUsd: Number(row?.costUsd ?? 0),
      tokensInput: Number(row?.tokensInput ?? 0),
      tokensOutput: Number(row?.tokensOutput ?? 0),
      latencyMs: Number(row?.latencyMs ?? 0),
    };
  }

  private async getAiRequestModels(
    scope: AiUsageScope,
    start: Date,
  ): Promise<AiModelAggregate[]> {
    const condition = this.aiRequestSourceCondition(scope);
    const rows = await this.prisma.$queryRaw<
      Array<{
        modelUsed: string;
        requests: bigint;
        costUsd: number;
        tokensInput: bigint;
        tokensOutput: bigint;
      }>
    >`
      SELECT r."model_used" AS "modelUsed",
             COUNT(*)::bigint AS requests,
             COALESCE(SUM(r."cost_usd"), 0)::float8 AS "costUsd",
             COALESCE(SUM(r."tokens_input"), 0)::bigint AS "tokensInput",
             COALESCE(SUM(r."tokens_output"), 0)::bigint AS "tokensOutput"
      FROM "ai_requests" r
      WHERE r."created_at" >= ${start} AND ${condition}
      GROUP BY r."model_used"
    `;
    return rows.map((row) => ({
      modelUsed: row.modelUsed,
      _count: { _all: Number(row.requests) },
      _sum: {
        costUsd: row.costUsd,
        tokensInput: Number(row.tokensInput),
        tokensOutput: Number(row.tokensOutput),
      },
    }));
  }

  private toAiUsage(aggregate: {
    _count: { _all: number };
    _sum: {
      tokensInput: number | null;
      tokensOutput: number | null;
      costUsd?: unknown;
      responseTimeMs: number | null;
    };
  }): AiUsage {
    return {
      requests: aggregate._count._all,
      costUsd: Number(aggregate._sum.costUsd ?? 0),
      tokensInput: aggregate._sum.tokensInput ?? 0,
      tokensOutput: aggregate._sum.tokensOutput ?? 0,
      latencyMs: aggregate._sum.responseTimeMs ?? 0,
    };
  }

  /**
   * Time-bucketed usage per period.
   */
  private async getAiActivity(
    period: "day" | "month" | "year",
    scope: AiUsageScope,
    start: Date,
  ): Promise<AiActivityPoint[]> {
    const sourceFilter =
      scope === "admin"
        ? Prisma.sql`WHERE (r."context" ->> 'source') = 'NVIDIA_ADMIN' AND r."created_at" >= ${start}`
        : scope === "user"
          ? Prisma.sql`WHERE (r."context" ->> 'source') IS DISTINCT FROM 'NVIDIA_ADMIN' AND r."created_at" >= ${start}`
          : Prisma.sql`WHERE r."created_at" >= ${start}`;
    const adminQuestion = Prisma.sql`(r."context" ->> 'source') = 'NVIDIA_ADMIN'`;

    const playerRows = await this.prisma.$queryRaw<AiActivityRow[]>`
      SELECT date_trunc(${period}, r."created_at") AS bucket,
             COUNT(*)::bigint AS requests,
             COALESCE(SUM(r."tokens_input"), 0)::bigint AS "tokensInput",
             COALESCE(SUM(r."tokens_output"), 0)::bigint AS "tokensOutput",
             COALESCE(SUM(CASE WHEN ${adminQuestion} THEN 1 WHEN r."was_accepted" THEN 1 ELSE 0 END), 0)::bigint AS fulfilled,
             COALESCE(SUM(CASE WHEN ${adminQuestion} THEN 0 WHEN r."was_accepted" THEN 0 ELSE 1 END), 0)::bigint AS unfulfilled
      FROM "ai_requests" r
      ${sourceFilter}
      GROUP BY bucket
      ORDER BY bucket ASC
    `;

    const catalogRows: AiActivityRow[] =
      scope === "user"
        ? []
        : await this.prisma.$queryRaw<AiActivityRow[]>`
            SELECT date_trunc(${period}, "created_at") AS bucket,
                   COUNT(*)::bigint AS requests,
                   COALESCE(SUM("tokens_input"), 0)::bigint AS "tokensInput",
                   COALESCE(SUM("tokens_output"), 0)::bigint AS "tokensOutput",
                   COALESCE(SUM("applied"), 0)::bigint AS fulfilled,
                   COALESCE(SUM(GREATEST("proposed" - "applied", 0)), 0)::bigint AS unfulfilled
            FROM "catalog_ai_runs"
            WHERE "created_at" >= ${start}
            GROUP BY bucket
            ORDER BY bucket ASC
          `;

    const buckets = new Map<string, AiActivityPoint>();
    for (const row of [...playerRows, ...catalogRows]) {
      const date = row.bucket.toISOString();
      const point = buckets.get(date) ?? {
        date,
        requests: 0,
        tokensInput: 0,
        tokensOutput: 0,
        fulfilled: 0,
        unfulfilled: 0,
      };
      point.requests += Number(row.requests);
      point.tokensInput += Number(row.tokensInput);
      point.tokensOutput += Number(row.tokensOutput);
      point.fulfilled += Number(row.fulfilled);
      point.unfulfilled += Number(row.unfulfilled);
      buckets.set(date, point);
    }
    return [...buckets.values()].sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Consolidate AI models per scope without duplicate bars.
   */
  private mergeAiModels(input: {
    userModels: AiModelAggregate[];
    adminModels: AiModelAggregate[];
    catalogModels: AiModelAggregate[];
    scope: AiUsageScope;
  }): AiModelRow[] {
    const rows = new Map<string, AiModelRow>();
    const add = (
      model: string,
      origin: AiUsageOrigin,
      usage: Omit<AiModelRow, "model" | "origin">,
    ) => {
      const key = model;
      const current = rows.get(key);
      if (current) {
        current.requests += usage.requests;
        current.costUsd += usage.costUsd;
        current.tokensInput += usage.tokensInput;
        current.tokensOutput += usage.tokensOutput;
        return;
      }
      rows.set(key, {
        model,
        origin,
        ...usage,
      });
    };

    if (input.scope !== "admin") {
      for (const model of input.userModels) {
        add(model.modelUsed, "USERS", {
          requests: model._count._all,
          costUsd: Number(model._sum.costUsd ?? 0),
          tokensInput: model._sum.tokensInput ?? 0,
          tokensOutput: model._sum.tokensOutput ?? 0,
        });
      }
    }
    if (input.scope !== "user") {
      for (const model of input.adminModels) {
        add(model.modelUsed, "ADMINS", {
          requests: model._count._all,
          costUsd: Number(model._sum.costUsd ?? 0),
          tokensInput: model._sum.tokensInput ?? 0,
          tokensOutput: model._sum.tokensOutput ?? 0,
        });
      }
      for (const model of input.catalogModels) {
        add(model.modelUsed, "ADMINS", {
          requests: model._count._all,
          costUsd: 0,
          tokensInput: model._sum.tokensInput ?? 0,
          tokensOutput: model._sum.tokensOutput ?? 0,
        });
      }
    }

    return [...rows.values()]
      .sort(
        (a, b) =>
          b.tokensInput + b.tokensOutput - (a.tokensInput + a.tokensOutput) ||
          b.requests - a.requests,
      )
      .slice(0, 12);
  }

  /**
   * AI usage report for the admin "Peticiones IA" screen.
   */
  async getAiCosts(days = 30, scope: AiUsageScope = "all") {
    const selected: AiUsageScope = AI_USAGE_SCOPES.includes(scope)
      ? scope
      : "all";
    const clamped = Math.min(Math.max(Math.floor(days), 1), 365);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setUTCDate(start.getUTCDate() - (clamped - 1));

    const playerDailyFilter =
      selected === "admin"
        ? Prisma.sql`WHERE (r."context" ->> 'source') = 'NVIDIA_ADMIN' AND r."created_at" >= ${start}`
        : selected === "user"
          ? Prisma.sql`WHERE (r."context" ->> 'source') IS DISTINCT FROM 'NVIDIA_ADMIN' AND r."created_at" >= ${start}`
          : Prisma.sql`WHERE r."created_at" >= ${start}`;

    const catalogDailyUnion =
      selected === "user"
        ? Prisma.sql``
        : Prisma.sql`
          UNION ALL
          SELECT date_trunc('day', "created_at") AS day,
                 0::numeric AS cost,
                 1 AS requests
          FROM "catalog_ai_runs"
          WHERE "created_at" >= ${start}
        `;

    // Run aggregate, daily breakdown, top models, top users in parallel.
    const [
      userTotals,
      adminTotals,
      catalogTotals,
      dailyRaw,
      userModels,
      adminModels,
      catalogModels,
      byUserRaw,
      purposeUsersRaw,
    ] = await Promise.all([
      this.getAiRequestUsage("user", start),
      this.getAiRequestUsage("admin", start),
      this.prisma.catalogAiRun.aggregate({
        where: { createdAt: { gte: start } },
        _count: { _all: true },
        _sum: { tokensInput: true, tokensOutput: true, responseTimeMs: true },
      }),
      this.prisma.$queryRaw<
        { day: Date; cost: number | null; requests: bigint }[]
      >`
        SELECT day, SUM(cost)::float8 AS cost, SUM(requests)::bigint AS requests
        FROM (
          SELECT date_trunc('day', r."created_at") AS day,
                 r."cost_usd" AS cost,
                 1 AS requests
          FROM "ai_requests" r
          ${playerDailyFilter}
          ${catalogDailyUnion}
        ) AS usage
        GROUP BY day
        ORDER BY day ASC
      `,
      this.getAiRequestModels("user", start),
      this.getAiRequestModels("admin", start),
      selected === "user"
        ? Promise.resolve([])
        : this.prisma.catalogAiRun.groupBy({
            by: ["modelUsed"],
            where: { createdAt: { gte: start } },
            _sum: { tokensInput: true, tokensOutput: true },
            _count: { _all: true },
          }),
      this.prisma.aIRequest.groupBy({
        by: ["userId"],
        _sum: { costUsd: true },
        _count: { _all: true },
        where: this.playerAiWhere(selected, start),
        orderBy: { _sum: { costUsd: "desc" } },
        take: 10,
      }),
      this.prisma.aIRequest.groupBy({
        by: ["appliedTo", "userId"],
        _count: { _all: true },
        where: this.playerAiWhere(selected, start),
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

    const sources = {
      user: userTotals,
      admin: mergeAiUsage([adminTotals, this.toAiUsage(catalogTotals)]),
    };
    const allSources = mergeAiUsage([sources.user, sources.admin]);
    const selectedUsage =
      selected === "user"
        ? sources.user
        : selected === "admin"
          ? sources.admin
          : allSources;

    const activity = Object.fromEntries(
      await Promise.all(
        (["day", "month", "year"] as const).map(
          async (period) =>
            [
              period,
              await this.getAiActivity(period, selected, start),
            ] as const,
        ),
      ),
    );

    const byModel = this.mergeAiModels({
      userModels,
      adminModels,
      catalogModels,
      scope: selected,
    });

    return {
      days: clamped,
      scope: selected,
      totals: {
        requests: selectedUsage.requests,
        costUsd: selectedUsage.costUsd,
        tokensInput: selectedUsage.tokensInput,
        tokensOutput: selectedUsage.tokensOutput,
        avgCostUsd:
          selectedUsage.requests > 0
            ? selectedUsage.costUsd / selectedUsage.requests
            : 0,
        avgLatencyMs: averageLatency(selectedUsage),
      },
      sources: {
        user: toAiUsageSummary(sources.user),
        admin: toAiUsageSummary(sources.admin),
        all: toAiUsageSummary(allSources),
      },
      daily,
      activity,
      byModel,
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
      byPurpose: Array.from(
        purposeUsersRaw.reduce((summary, row) => {
          const purpose = row.appliedTo ?? "GLOBAL";
          const current = summary.get(purpose) ?? { users: 0, requests: 0 };
          current.users += 1;
          current.requests += row._count._all;
          summary.set(purpose, current);
          return summary;
        }, new Map<string, { users: number; requests: number }>()),
        ([purpose, data]) => ({ purpose, ...data }),
      ).sort((a, b) => b.users - a.users || b.requests - a.requests),
    };
  }

  async listAiRequests({
    skip = 0,
    take = 10,
    search,
  }: {
    skip?: number;
    take?: number;
    search?: string;
  }) {
    const safeSkip = Math.max(0, Number.isFinite(skip) ? Math.floor(skip) : 0);
    const safeTake = Math.min(
      50,
      Math.max(1, Number.isFinite(take) ? Math.floor(take) : 10),
    );
    const normalizedSearch = search?.trim();
    const where = normalizedSearch
      ? {
          OR: [
            {
              prompt: {
                contains: normalizedSearch,
                mode: "insensitive" as const,
              },
            },
            {
              user: {
                is: {
                  OR: [
                    {
                      username: {
                        contains: normalizedSearch,
                        mode: "insensitive" as const,
                      },
                    },
                    {
                      email: {
                        contains: normalizedSearch,
                        mode: "insensitive" as const,
                      },
                    },
                  ],
                },
              },
            },
          ],
        }
      : undefined;
    const [total, requests] = await Promise.all([
      this.prisma.aIRequest.count({ where }),
      this.prisma.aIRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: safeSkip,
        take: safeTake,
        select: {
          id: true,
          userId: true,
          trackId: true,
          prompt: true,
          context: true,
          response: true,
          explanation: true,
          appliedTo: true,
          appliedId: true,
          wasAccepted: true,
          tokensInput: true,
          tokensOutput: true,
          costUsd: true,
          responseTimeMs: true,
          modelUsed: true,
          createdAt: true,
          user: { select: { email: true, username: true } },
          track: { select: { title: true, artist: true } },
        },
      }),
    ]);

    return { requests, total, skip: safeSkip, take: safeTake };
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
}
