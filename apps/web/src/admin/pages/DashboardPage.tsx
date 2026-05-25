import { useQuery } from "@tanstack/react-query";
import {
  Crown,
  ListMusic,
  Music,
  Sparkles,
  ThumbsUp,
  Users,
} from "lucide-react";
import AdminLayout from "../layout/AdminLayout";
import { getDashboardStats, getAiFeedbackStats } from "../../shared/api/admin";
import type { DashboardStats, AIFeedbackStats } from "../../shared/api/admin";

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
    { color: "#10b981", label: "Positivo", count: good, pct: goodPct },
    { color: "#94a3b8", label: "Neutral", count: neutral, pct: neutralPct },
    { color: "#f43f5e", label: "Negativo", count: bad, pct: badPct },
  ];

  if (total === 0) {
    return (
      <p className="py-8 text-center text-sm text-[var(--color-muted)]">
        Aún no hay feedback registrado.
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
  const total = tracks + playlists;

  if (total === 0) {
    return (
      <p className="py-8 text-center text-sm text-[var(--color-muted)]">
        Aún no hay contenido registrado.
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
    { color: "#3b82f6", label: "Tracks", count: tracks, ratio: tracksPct },
    {
      color: "#a78bfa",
      label: "Playlists",
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
          total
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
// Error banner
// ---------------------------------------------------------------------------

interface ErrorBannerProps {
  message: string;
  onRetry: () => void;
}

function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
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
        Reintentar
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function DashboardPage() {
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

  const isLoading = dashboardQ.isPending || feedbackQ.isPending;
  const hasError = dashboardQ.isError || feedbackQ.isError;

  function handleRetry() {
    if (dashboardQ.isError) void dashboardQ.refetch();
    if (feedbackQ.isError) void feedbackQ.refetch();
  }

  // Derived values (safe-guards against undefined while loading)
  const stats = dashboardQ.data;
  const feedbackStats = feedbackQ.data;

  const premiumRate =
    stats && stats.users.total > 0
      ? ((stats.users.premium / stats.users.total) * 100).toFixed(1)
      : "0.0";

  return (
    <AdminLayout>
      <section className="min-h-screen w-full bg-[var(--color-page)] px-4 py-6 text-[var(--color-text)] sm:px-6 xl:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-8">
          {/* ── Header ── */}
          <header>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)] sm:text-3xl">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              Resumen general de la plataforma MusicFlow.
            </p>
          </header>

          {/* ── Error banner ── */}
          {hasError && !isLoading && (
            <ErrorBanner
              message="No se pudo cargar la información del dashboard. Verifica la conexión con el servidor."
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
                label="Usuarios totales"
                value={stats.users.total}
                subtitle={`${stats.users.premium} premium · ${stats.users.recentWeek} nuevos esta semana`}
              />
              <StatCard
                icon={<Music className="h-4 w-4" />}
                label="Tracks"
                value={stats.content.tracks}
              />
              <StatCard
                icon={<ListMusic className="h-4 w-4" />}
                label="Playlists"
                value={stats.content.playlists}
              />
              <StatCard
                icon={<Sparkles className="h-4 w-4" />}
                label="Requests IA"
                value={stats.ai.totalRequests}
              />
              <StatCard
                icon={<ThumbsUp className="h-4 w-4" />}
                label="Satisfacción IA"
                value={`${feedbackStats.satisfactionRate.toFixed(1)}%`}
                subtitle={`${feedbackStats.good} 👍 / ${feedbackStats.bad} 👎 / ${feedbackStats.neutral} neutral = ${feedbackStats.total} total`}
              />
              <StatCard
                icon={<Crown className="h-4 w-4" />}
                label="Conversiones premium"
                value={`${premiumRate}%`}
                subtitle={`${stats.users.premium} de ${stats.users.total} usuarios`}
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
                Distribución de feedback IA
              </h2>
              <FeedbackBar feedbackStats={feedbackStats} />
            </article>
          )}

          {/* ── Two-card row ── */}
          {!isLoading && stats && feedbackStats && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* Growth placeholder */}
              <article
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-5"
                aria-labelledby="growth-card-title"
              >
                <h2
                  id="growth-card-title"
                  className="mb-3 text-sm font-semibold uppercase tracking-widest text-[var(--color-muted)]"
                >
                  Crecimiento de usuarios
                </h2>
                <p className="text-sm leading-6 text-[var(--color-muted)]">
                  Esta vista todavía no muestra serie histórica; el endpoint{" "}
                  <code className="rounded bg-[var(--color-border)] px-1 py-0.5 text-xs font-mono text-[var(--color-text)]">
                    /admin/dashboard
                  </code>{" "}
                  solo retorna conteos puntuales.
                </p>
                <div className="mt-4 flex items-end gap-1" aria-hidden="true">
                  {/* Decorative mini bars */}
                  {[40, 55, 48, 65, 72, 60, 80, 75, 90, 85, 100, 95].map(
                    (h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t-sm bg-[var(--color-primary)] opacity-30"
                        style={{ height: h * 0.6 }}
                      />
                    ),
                  )}
                </div>
                {/* TODO: wire to /admin/users filtered by createdAt to build a sparkline */}
              </article>

              {/* Catalog donut */}
              <article
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-5"
                aria-labelledby="catalog-chart-title"
              >
                <h2
                  id="catalog-chart-title"
                  className="mb-4 text-sm font-semibold uppercase tracking-widest text-[var(--color-muted)]"
                >
                  Distribución del catálogo
                </h2>
                <DonutChart
                  tracks={stats.content.tracks}
                  playlists={stats.content.playlists}
                />
              </article>
            </div>
          )}
        </div>
      </section>
    </AdminLayout>
  );
}
