import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  Crown,
  ListMusic,
  Music,
  Sparkles,
  ThumbsUp,
  Users,
} from "lucide-react";
import {
  getDashboardStats,
  getAiFeedbackStats,
  getUserGrowth,
  getCatalogDistribution,
} from "../../shared/api/admin";
import type {
  AIFeedbackStats,
  CatalogDistribution,
  DashboardStats,
  UserGrowth,
} from "../../shared/api/admin";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pct(part: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((part / total) * 1000) / 10; // 1 decimal
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-5">
      <div className="mb-3 h-4 w-1/3 rounded bg-[var(--color-border)]" />
      <div className="mb-2 h-8 w-1/2 rounded bg-[var(--color-border)]" />
      <div className="h-3 w-2/3 rounded bg-[var(--color-border)]" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtitle?: string;
}

function StatCard({ icon, label, value, subtitle }: StatCardProps) {
  return (
    <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-[var(--color-primary)]">{icon}</span>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-muted)]">
          {label}
        </span>
      </div>
      <p className="text-3xl font-bold tracking-tight text-[var(--color-text)]">
        {value}
      </p>
      {subtitle && (
        <p className="mt-1 text-xs text-[var(--color-muted)]">{subtitle}</p>
      )}
    </article>
  );
}

// ---------------------------------------------------------------------------
// Stacked bar (feedback)
// ---------------------------------------------------------------------------

interface FeedbackBarProps {
  feedbackStats: AIFeedbackStats;
}

function FeedbackBar({ feedbackStats }: FeedbackBarProps) {
  const { t } = useTranslation();
  const { good, neutral, bad, total } = feedbackStats;

  const goodPct = pct(good, total);
  const neutralPct = pct(neutral, total);
  const badPct = pct(bad, total);

  const segments: {
    color: string;
    label: string;
    count: number;
    pct: number;
  }[] = [
    {
      color: "#10b981",
      label: t("admin.dashboard.feedbackPositive"),
      count: good,
      pct: goodPct,
    },
    {
      color: "#94a3b8",
      label: t("admin.dashboard.feedbackNeutral"),
      count: neutral,
      pct: neutralPct,
    },
    {
      color: "#f43f5e",
      label: t("admin.dashboard.feedbackNegative"),
      count: bad,
      pct: badPct,
    },
  ];

  if (total === 0) {
    return (
      <p className="py-8 text-center text-sm text-[var(--color-muted)]">
        {t("admin.dashboard.feedbackEmpty")}
      </p>
    );
  }

  // Build SVG rects — each rect starts at the end of the previous
  const barWidth = 700;
  const barHeight = 36;
  let cursor = 0;
  const rects = segments.map((seg) => {
    const w = (seg.pct / 100) * barWidth;
    const rect = (
      <rect
        key={seg.label}
        x={cursor}
        y={0}
        width={w}
        height={barHeight}
        fill={seg.color}
        rx={0}
      />
    );
    cursor += w;
    return rect;
  });

  return (
    <div>
      {/* Bar */}
      <svg
        viewBox={`0 0 ${barWidth} ${barHeight}`}
        aria-label="Distribución de feedback de IA"
        role="img"
        className="w-full overflow-hidden rounded-xl"
        style={{ height: 36 }}
      >
        {/* rounded caps on first and last segment */}
        <defs>
          <clipPath id="bar-clip">
            <rect x={0} y={0} width={barWidth} height={barHeight} rx={10} />
          </clipPath>
        </defs>
        <g clipPath="url(#bar-clip)">{rects}</g>
      </svg>

      {/* Legend */}
      <ul
        className="mt-4 flex flex-wrap gap-4"
        role="list"
        aria-label="Leyenda de feedback"
      >
        {segments.map((seg) => (
          <li
            key={seg.label}
            className="flex items-center gap-2 text-sm text-[var(--color-text)]"
          >
            <span
              aria-hidden="true"
              className="inline-block h-3 w-3 rounded-sm"
              style={{ backgroundColor: seg.color }}
            />
            <span className="font-medium">{seg.label}</span>
            <span className="text-[var(--color-muted)]">
              {seg.count} ({seg.pct}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Donut chart (catalog distribution)
// ---------------------------------------------------------------------------

interface DonutChartProps {
  tracks: number;
  playlists: number;
}

function DonutChart({ tracks, playlists }: DonutChartProps) {
  const { t } = useTranslation();
  const total = tracks + playlists;

  if (total === 0) {
    return (
      <p className="py-8 text-center text-sm text-[var(--color-muted)]">
        {t("admin.dashboard.catalogEmpty")}
      </p>
    );
  }

  // SVG donut math
  // cx, cy = center; R = outer radius; r = inner radius (hole)
  const cx = 80;
  const cy = 80;
  const R = 68;
  const r = 44;
  const avgR = (R + r) / 2;
  const strokeW = R - r;

  const tracksPct = tracks / total;
  const playlistsPct = playlists / total;

  // Stroke-dasharray segments starting from -90deg (top)
  const segments: {
    color: string;
    label: string;
    count: number;
    ratio: number;
  }[] = [
    {
      color: "#3b82f6",
      label: t("admin.dashboard.tracks"),
      count: tracks,
      ratio: tracksPct,
    },
    {
      color: "#a78bfa",
      label: t("admin.dashboard.playlists"),
      count: playlists,
      ratio: playlistsPct,
    },
  ];

  let offsetAngle = -Math.PI / 2; // start at top
  const paths = segments.map((seg) => {
    const startAngle = offsetAngle;
    const sweep = seg.ratio * 2 * Math.PI;
    const endAngle = startAngle + sweep;

    // Arc path on the avg circle
    const x1 = cx + avgR * Math.cos(startAngle);
    const y1 = cy + avgR * Math.sin(startAngle);
    const x2 = cx + avgR * Math.cos(endAngle);
    const y2 = cy + avgR * Math.sin(endAngle);
    const largeArc = sweep > Math.PI ? 1 : 0;

    const d = `M ${x1} ${y1} A ${avgR} ${avgR} 0 ${largeArc} 1 ${x2} ${y2}`;

    offsetAngle = endAngle;

    return (
      <path
        key={seg.label}
        d={d}
        fill="none"
        stroke={seg.color}
        strokeWidth={strokeW}
        aria-label={`${seg.label}: ${seg.count}`}
      />
    );
  });

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-8">
      <svg
        viewBox={`0 0 ${cx * 2} ${cy * 2}`}
        aria-label="Distribución del catálogo"
        role="img"
        className="w-44 shrink-0"
      >
        {paths}
        {/* Center label */}
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-[var(--color-text)]"
          style={{ fontSize: 20, fontWeight: 700, fill: "var(--color-text)" }}
        >
          {total}
        </text>
        <text
          x={cx}
          y={cy + 16}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ fontSize: 10, fill: "var(--color-muted)" }}
        >
          {t("admin.dashboard.catalogTotal")}
        </text>
      </svg>

      <ul
        className="flex flex-col gap-2"
        role="list"
        aria-label="Leyenda del catálogo"
      >
        {segments.map((seg) => (
          <li
            key={seg.label}
            className="flex items-center gap-2 text-sm text-[var(--color-text)]"
          >
            <span
              aria-hidden="true"
              className="inline-block h-3 w-3 rounded-sm"
              style={{ backgroundColor: seg.color }}
            />
            <span className="font-medium">{seg.label}</span>
            <span className="text-[var(--color-muted)]">
              {seg.count} ({pct(seg.count, total)}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Growth sparkline (real data)
// ---------------------------------------------------------------------------

function GrowthSparkline({ growth }: { growth: UserGrowth }) {
  const { t } = useTranslation();
  const { series, total, days } = growth;

  if (series.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-[var(--color-muted)]">
        {t("admin.dashboard.growthEmpty")}
      </p>
    );
  }

  const max = Math.max(1, ...series.map((p) => p.count));
  const W = 700;
  const H = 120;
  const padX = 4;
  const colW = (W - padX * 2) / series.length;
  const barW = Math.max(2, colW * 0.7);

  return (
    <div>
      <div className="mb-3 flex items-baseline gap-3">
        <span className="text-3xl font-bold tracking-tight text-[var(--color-text)]">
          {total}
        </span>
        <span className="text-xs text-[var(--color-muted)]">
          {t("admin.dashboard.growthNewLast", { days })}
        </span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Altas diarias de usuarios, ${days} días`}
        className="w-full"
        preserveAspectRatio="none"
      >
        {series.map((p, i) => {
          const h = (p.count / max) * (H - 8);
          const x = padX + i * colW + (colW - barW) / 2;
          const y = H - h;
          return (
            <rect
              key={p.date}
              x={x}
              y={y}
              width={barW}
              height={h}
              rx={2}
              className="fill-[var(--color-primary)]"
              opacity={p.count === 0 ? 0.18 : 0.85}
            >
              <title>{`${p.date}: ${p.count}`}</title>
            </rect>
          );
        })}
      </svg>

      <div className="mt-2 flex justify-between text-[10px] text-[var(--color-muted)]">
        <span>{series[0].date}</span>
        <span>{series[series.length - 1].date}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bucket bars (catalog distribution)
// ---------------------------------------------------------------------------

function BucketBars({
  buckets,
  emptyMessage,
}: {
  buckets: { label: string; count: number }[];
  emptyMessage: string;
}) {
  if (buckets.length === 0) {
    return (
      <p className="py-3 text-xs text-[var(--color-muted)]">{emptyMessage}</p>
    );
  }
  const max = Math.max(1, ...buckets.map((b) => b.count));
  return (
    <ul className="flex flex-col gap-2">
      {buckets.map((b) => {
        const pctW = (b.count / max) * 100;
        return (
          <li
            key={b.label}
            className="flex items-center gap-3 text-xs text-[var(--color-text)]"
          >
            <span className="w-28 shrink-0 truncate" title={b.label}>
              {b.label}
            </span>
            <span className="relative h-2 flex-1 rounded-full bg-[var(--color-border)]">
              <span
                className="absolute inset-y-0 left-0 rounded-full bg-[var(--color-primary)]"
                style={{ width: `${pctW}%` }}
              />
            </span>
            <span className="w-10 shrink-0 text-right tabular-nums text-[var(--color-muted)]">
              {b.count}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log10(bytes) / 3));
  const v = bytes / Math.pow(1000, i);
  return `${v.toFixed(v >= 100 || i === 0 ? 0 : 1)} ${units[i]}`;
}

function formatDuration(ms: number): string {
  const totalMin = Math.floor(ms / 60000);
  if (totalMin < 60) return `${totalMin} min`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h < 24) return `${h}h ${m}min`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h`;
}

// ---------------------------------------------------------------------------
// Error banner
// ---------------------------------------------------------------------------

interface ErrorBannerProps {
  message: string;
  onRetry: () => void;
}

function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  const { t } = useTranslation();
  return (
    <div
      role="alert"
      className="flex items-center justify-between gap-4 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-5 py-4"
    >
      <p className="text-sm font-medium text-rose-300">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="shrink-0 rounded-xl border border-rose-400/40 px-4 py-2 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20"
      >
        {t("admin.dashboard.retry")}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const { t } = useTranslation();
  const dashboardQ = useQuery<DashboardStats>({
    queryKey: ["admin", "dashboard"],
    queryFn: getDashboardStats,
    staleTime: 60_000,
  });

  const feedbackQ = useQuery<AIFeedbackStats>({
    queryKey: ["admin", "ai-feedback"],
    queryFn: getAiFeedbackStats,
    staleTime: 60_000,
  });

  const growthQ = useQuery<UserGrowth>({
    queryKey: ["admin", "dashboard", "growth", 30],
    queryFn: () => getUserGrowth(30),
    staleTime: 60_000,
  });

  const catalogQ = useQuery<CatalogDistribution>({
    queryKey: ["admin", "dashboard", "catalog"],
    queryFn: getCatalogDistribution,
    staleTime: 60_000,
  });

  const isLoading = dashboardQ.isPending || feedbackQ.isPending;
  const hasError = dashboardQ.isError || feedbackQ.isError;

  function handleRetry() {
    if (dashboardQ.isError) void dashboardQ.refetch();
    if (feedbackQ.isError) void feedbackQ.refetch();
    if (growthQ.isError) void growthQ.refetch();
    if (catalogQ.isError) void catalogQ.refetch();
  }

  // Derived values (safe-guards against undefined while loading)
  const stats = dashboardQ.data;
  const feedbackStats = feedbackQ.data;
  const growth = growthQ.data;
  const catalog = catalogQ.data;

  const premiumRate =
    stats && stats.users.total > 0
      ? ((stats.users.premium / stats.users.total) * 100).toFixed(1)
      : "0.0";

  return (
    <section className="min-h-screen w-full bg-[var(--color-page)] px-4 py-6 text-[var(--color-text)] sm:px-6 xl:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        {/* ── Header ── */}
        <header>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)] sm:text-3xl">
            {t("admin.dashboard.title")}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {t("admin.dashboard.subtitle")}
          </p>
        </header>

        {/* ── Error banner ── */}
        {hasError && !isLoading && (
          <ErrorBanner
            message={t("admin.dashboard.error")}
            onRetry={handleRetry}
          />
        )}

        {/* ── Stat cards grid ── */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : stats && feedbackStats ? (
          <div
            className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
            aria-label="Estadísticas generales"
          >
            <StatCard
              icon={<Users className="h-4 w-4" />}
              label={t("admin.dashboard.totalUsers")}
              value={stats.users.total}
              subtitle={t("admin.dashboard.premiumSubtitle", {
                premium: stats.users.premium,
                recent: stats.users.recentWeek,
              })}
            />
            <StatCard
              icon={<Music className="h-4 w-4" />}
              label={t("admin.dashboard.tracks")}
              value={stats.content.tracks}
            />
            <StatCard
              icon={<ListMusic className="h-4 w-4" />}
              label={t("admin.dashboard.playlists")}
              value={stats.content.playlists}
            />
            <StatCard
              icon={<Sparkles className="h-4 w-4" />}
              label={t("admin.dashboard.aiRequests")}
              value={stats.ai.totalRequests}
            />
            <StatCard
              icon={<ThumbsUp className="h-4 w-4" />}
              label={t("admin.dashboard.aiSatisfaction")}
              value={`${feedbackStats.satisfactionRate.toFixed(1)}%`}
              subtitle={t("admin.dashboard.aiSatisfactionSubtitle", {
                good: feedbackStats.good,
                bad: feedbackStats.bad,
                neutral: feedbackStats.neutral,
                total: feedbackStats.total,
              })}
            />
            <StatCard
              icon={<Crown className="h-4 w-4" />}
              label={t("admin.dashboard.premiumConversions")}
              value={`${premiumRate}%`}
              subtitle={t("admin.dashboard.premiumConversionsSubtitle", {
                premium: stats.users.premium,
                total: stats.users.total,
              })}
            />
          </div>
        ) : null}

        {/* ── Feedback stacked bar (full-width) ── */}
        {!isLoading && feedbackStats && (
          <article
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-5"
            aria-labelledby="feedback-chart-title"
          >
            <h2
              id="feedback-chart-title"
              className="mb-4 text-sm font-semibold uppercase tracking-widest text-[var(--color-muted)]"
            >
              {t("admin.dashboard.feedbackTitle")}
            </h2>
            <FeedbackBar feedbackStats={feedbackStats} />
          </article>
        )}

        {/* ── Two-card row ── */}
        {!isLoading && stats && feedbackStats && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Growth (real series) */}
            <article
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-5"
              aria-labelledby="growth-card-title"
            >
              <h2
                id="growth-card-title"
                className="mb-3 text-sm font-semibold uppercase tracking-widest text-[var(--color-muted)]"
              >
                {t("admin.dashboard.growthTitle")}
              </h2>
              {growthQ.isPending ? (
                <SkeletonCard />
              ) : growth ? (
                <GrowthSparkline growth={growth} />
              ) : (
                <p className="text-xs text-rose-300">
                  {t("admin.dashboard.growthError")}
                </p>
              )}
            </article>

            {/* Catalog distribution (real groupBy) */}
            <article
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-5"
              aria-labelledby="catalog-chart-title"
            >
              <h2
                id="catalog-chart-title"
                className="mb-4 text-sm font-semibold uppercase tracking-widest text-[var(--color-muted)]"
              >
                {t("admin.dashboard.catalogTitle")}
              </h2>
              {catalogQ.isPending ? (
                <SkeletonCard />
              ) : catalog ? (
                catalog.totalTracks === 0 ? (
                  <DonutChart
                    tracks={stats.content.tracks}
                    playlists={stats.content.playlists}
                  />
                ) : (
                  <div className="flex flex-col gap-5">
                    <div className="flex flex-wrap items-baseline gap-4 text-xs text-[var(--color-muted)]">
                      <span>
                        <strong className="text-base text-[var(--color-text)]">
                          {catalog.totalTracks}
                        </strong>{" "}
                        {t("admin.dashboard.catalogTracks")}
                      </span>
                      <span>
                        <strong className="text-[var(--color-text)]">
                          {formatBytes(catalog.totalBytes)}
                        </strong>{" "}
                        {t("admin.dashboard.catalogOnDisk")}
                      </span>
                      <span>
                        <strong className="text-[var(--color-text)]">
                          {formatDuration(catalog.totalDurationMs)}
                        </strong>{" "}
                        {t("admin.dashboard.catalogOfAudio")}
                      </span>
                    </div>

                    <div>
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-muted)]">
                        {t("admin.dashboard.catalogByGenre")}
                      </p>
                      <BucketBars
                        buckets={catalog.byGenre}
                        emptyMessage={t("admin.dashboard.catalogNoGenres")}
                      />
                    </div>

                    <div>
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-muted)]">
                        {t("admin.dashboard.catalogByCodec")}
                      </p>
                      <BucketBars
                        buckets={catalog.byCodec}
                        emptyMessage={t("admin.dashboard.catalogNoCodecs")}
                      />
                    </div>
                  </div>
                )
              ) : (
                <p className="text-xs text-rose-300">
                  {t("admin.dashboard.catalogError")}
                </p>
              )}
            </article>
          </div>
        )}
      </div>
    </section>
  );
}
