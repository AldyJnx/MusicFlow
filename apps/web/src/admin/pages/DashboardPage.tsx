import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  CalendarDays,
  CalendarRange,
  Crown,
  HardDrive,
  ListMusic,
  Minus,
  Music,
  RefreshCw,
  Sparkles,
  ThumbsUp,
  TrendingDown,
  TrendingUp,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";
import {
  getDashboardStats,
  getAiFeedbackStats,
  getUserGrowth,
  getCatalogDistribution,
  getActiveUsers,
  getActiveUsersTrend,
  getTopActiveUsers,
} from "../../shared/api/admin";
import type {
  AIFeedbackStats,
  ActiveUsersStats,
  ActiveUsersTrend,
  CatalogDistribution,
  DashboardStats,
  TopActiveUser,
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

type StatTone = "primary" | "accent" | "positive" | "warning";

interface StatTrend {
  /** Numeric change vs prior period. Sign drives arrow direction. */
  delta: number;
  /** Localized label, e.g. "vs semana pasada". */
  label: string;
  /** When true a negative delta is shown as positive (e.g. "churn dropped"). */
  invertSemantics?: boolean;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtitle?: string;
  tone?: StatTone;
  trend?: StatTrend;
  /** Action label rendered as a hover-revealed "Ver detalle →" CTA. */
  href?: string;
  /** Variant — "hero" doubles the title size for the two headline KPIs. */
  size?: "default" | "hero";
  /** Show "—" with this hint instead of the value when the metric is N/A. */
  empty?: string;
  /** Optional sparkline data — rendered as a tiny SVG in the corner. */
  sparkline?: number[];
}

/**
 * Compact SVG sparkline for embedding in a StatCard. No axes, no labels,
 * just shape. Scales the series to fit the box; flat zero series renders
 * a baseline so the card doesn't look broken when there's no activity yet.
 */
function Sparkline({
  data,
  color,
  width = 80,
  height = 24,
}: {
  data: number[];
  color: string;
  width?: number;
  height?: number;
}) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const stepX = width / (data.length - 1);
  const points = data
    .map((v, i) => `${i * stepX},${height - (v / max) * height}`)
    .join(" ");
  const last = data[data.length - 1];
  const lastY = height - (last / max) * height;
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
      aria-hidden="true"
    >
      <polyline
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      <circle cx={width} cy={lastY} r={2.2} fill={color} />
    </svg>
  );
}

const TONE_BG: Record<StatTone, string> = {
  primary: "var(--color-primary)",
  accent: "var(--color-accent)",
  positive: "#22c55e",
  warning: "#f59e0b",
};

function StatCard({
  icon,
  label,
  value,
  subtitle,
  tone = "primary",
  trend,
  href,
  size = "default",
  empty,
  sparkline,
}: StatCardProps) {
  const navigate = useNavigate();
  const clickable = !!href;
  const isHero = size === "hero";
  const isEmpty = empty !== undefined;
  const accent = TONE_BG[tone];

  const TrendIcon = trend
    ? trend.delta > 0
      ? TrendingUp
      : trend.delta < 0
        ? TrendingDown
        : Minus
    : null;
  // For positive metrics (users, satisfaction) up = good. For inverted ones
  // (churn, errors) down = good — the caller toggles `invertSemantics`.
  const trendPositive = trend
    ? (trend.invertSemantics ? -trend.delta : trend.delta) > 0
    : false;
  const trendColor = trend
    ? trend.delta === 0
      ? "var(--color-muted)"
      : trendPositive
        ? "#22c55e"
        : "#ef4444"
    : undefined;

  function handleClick() {
    if (href) navigate(href);
  }

  return (
    <article
      onClick={clickable ? handleClick : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleClick();
              }
            }
          : undefined
      }
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-label={clickable ? `${label}: ${value}` : undefined}
      className={`group relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-5 transition ${
        clickable
          ? "cursor-pointer hover:-translate-y-0.5 hover:border-[color:var(--accent-tone)] hover:shadow-[0_18px_40px_rgba(0,0,0,0.32)]"
          : ""
      } ${isHero ? "sm:p-6" : ""}`}
      style={{ ["--accent-tone" as string]: accent }}
    >
      {/* Top-left tinted glow per tone — subtle wayfinding */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-10 -left-10 h-24 w-24 rounded-full opacity-20 blur-2xl"
        style={{ backgroundColor: accent }}
      />

      <div className="relative mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span style={{ color: accent }}>{icon}</span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-muted)]">
            {label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {sparkline && sparkline.length > 1 ? (
            <Sparkline data={sparkline} color={accent} />
          ) : null}
          {clickable ? (
            <ArrowRight
              className="h-3.5 w-3.5 -translate-x-1 text-[var(--color-muted)] opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100"
              strokeWidth={2.4}
              style={{ color: accent }}
            />
          ) : null}
        </div>
      </div>

      {isEmpty ? (
        <>
          <p
            className={`font-bold tracking-tight text-[var(--color-muted)] ${
              isHero ? "text-5xl" : "text-3xl"
            }`}
          >
            —
          </p>
          <p className="mt-1 text-xs text-[var(--color-muted)]">{empty}</p>
        </>
      ) : (
        <>
          <p
            className={`font-bold tracking-tight text-[var(--color-text)] ${
              isHero ? "text-4xl sm:text-5xl" : "text-3xl"
            }`}
          >
            {value}
          </p>
          {(subtitle || trend) && (
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
              {trend && TrendIcon ? (
                <span
                  className="inline-flex items-center gap-1 font-semibold"
                  style={{ color: trendColor }}
                >
                  <TrendIcon className="h-3 w-3" strokeWidth={2.6} />
                  {trend.delta > 0 ? "+" : ""}
                  {trend.delta}
                  <span className="font-normal text-[var(--color-muted)]">
                    {trend.label}
                  </span>
                </span>
              ) : null}
              {subtitle && (
                <span className="text-[var(--color-muted)]">{subtitle}</span>
              )}
            </div>
          )}
        </>
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

/** Coarse "hace 5 min / hace 3h / hace 2d" — enough resolution for a list. */
function formatRelativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return "ahora";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `hace ${days}d`;
  const months = Math.floor(days / 30);
  return `hace ${months}m`;
}

/**
 * Compact row in the "Power users" widget. Same gradient-initials pattern
 * the client uses for ArtistAvatar so admin and client stay visually
 * consistent.
 */
function PowerUserRow({ user }: { user: TopActiveUser }) {
  const navigate = useNavigate();
  let hue = 0;
  for (let i = 0; i < user.username.length; i++) {
    hue = (hue * 31 + user.username.charCodeAt(i)) % 360;
  }
  const initials = user.username
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <button
      type="button"
      onClick={() => navigate(`/admin/users/${user.id}`)}
      className="group flex w-full items-center gap-3 rounded-xl border border-transparent px-2 py-2 text-left transition hover:border-[var(--color-border)] hover:bg-[var(--color-page)]"
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-[0_6px_14px_rgba(0,0,0,0.3)]"
        style={{
          background: `linear-gradient(135deg, hsl(${hue} 70% 50%) 0%, hsl(${(hue + 40) % 360} 65% 35%) 100%)`,
        }}
      >
        {initials || "?"}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-[var(--color-text)]">
            {user.username}
          </p>
          {user.isPremium ? (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-400">
              <Crown className="h-2.5 w-2.5" strokeWidth={2.6} />
              Premium
            </span>
          ) : null}
        </div>
        <p className="truncate text-[11px] text-[var(--color-muted)]">
          {user.email}
        </p>
      </div>
      <div className="hidden shrink-0 flex-col items-end text-right sm:flex">
        <p className="text-xs font-semibold text-[var(--color-text)]">
          {formatRelativeTime(user.lastLogin)}
        </p>
        <p className="text-[10px] text-[var(--color-muted)]">
          {user._count.tracks} pistas · {user._count.playlists} listas
        </p>
      </div>
      <ArrowRight
        className="h-3.5 w-3.5 shrink-0 -translate-x-1 text-[var(--color-muted)] opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100"
        strokeWidth={2.4}
      />
    </button>
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

/** Formats "actualizado hace Xs / Xm" for the header freshness indicator. */
function useTimeAgo(timestamp: number | null): string {
  const { t } = useTranslation();
  const [, force] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => force((v) => v + 1), 15_000);
    return () => window.clearInterval(id);
  }, []);
  if (!timestamp)
    return t("admin.dashboard.neverUpdated", { defaultValue: "—" });
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60)
    return t("admin.dashboard.updatedSeconds", {
      defaultValue: "hace {{n}}s",
      n: seconds,
    });
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60)
    return t("admin.dashboard.updatedMinutes", {
      defaultValue: "hace {{n}} min",
      n: minutes,
    });
  const hours = Math.floor(minutes / 60);
  return t("admin.dashboard.updatedHours", {
    defaultValue: "hace {{n}}h",
    n: hours,
  });
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
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

  const activeQ = useQuery<ActiveUsersStats>({
    queryKey: ["admin", "dashboard", "active-users"],
    queryFn: getActiveUsers,
    staleTime: 60_000,
  });

  const topUsersQ = useQuery<TopActiveUser[]>({
    queryKey: ["admin", "dashboard", "top-users", 5],
    queryFn: () => getTopActiveUsers(5),
    staleTime: 60_000,
  });

  const dauTrendQ = useQuery<ActiveUsersTrend>({
    queryKey: ["admin", "dashboard", "active-users-trend", 30],
    queryFn: () => getActiveUsersTrend(30),
    staleTime: 60_000,
  });

  const isLoading = dashboardQ.isPending || feedbackQ.isPending;
  const hasError = dashboardQ.isError || feedbackQ.isError;

  // Track the latest successful fetch across all four queries — that's what
  // the user actually cares about when reading the freshness indicator.
  const lastUpdated = Math.max(
    dashboardQ.dataUpdatedAt ?? 0,
    feedbackQ.dataUpdatedAt ?? 0,
    growthQ.dataUpdatedAt ?? 0,
    catalogQ.dataUpdatedAt ?? 0,
    activeQ.dataUpdatedAt ?? 0,
    topUsersQ.dataUpdatedAt ?? 0,
    dauTrendQ.dataUpdatedAt ?? 0,
  );
  const timeAgo = useTimeAgo(lastUpdated || null);
  const anyRefreshing =
    dashboardQ.isFetching ||
    feedbackQ.isFetching ||
    growthQ.isFetching ||
    catalogQ.isFetching ||
    activeQ.isFetching ||
    topUsersQ.isFetching ||
    dauTrendQ.isFetching;

  function refreshAll() {
    void dashboardQ.refetch();
    void feedbackQ.refetch();
    void growthQ.refetch();
    void catalogQ.refetch();
    void activeQ.refetch();
    void topUsersQ.refetch();
    void dauTrendQ.refetch();
  }

  function handleRetry() {
    if (dashboardQ.isError) void dashboardQ.refetch();
    if (feedbackQ.isError) void feedbackQ.refetch();
    if (growthQ.isError) void growthQ.refetch();
    if (catalogQ.isError) void catalogQ.refetch();
    if (activeQ.isError) void activeQ.refetch();
    if (topUsersQ.isError) void topUsersQ.refetch();
    if (dauTrendQ.isError) void dauTrendQ.refetch();
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
        {/* ── Header with freshness + refresh ── */}
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)] sm:text-3xl">
              {t("admin.dashboard.title")}
            </h1>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              {t("admin.dashboard.subtitle")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-1.5 text-xs text-[var(--color-muted)]"
              aria-live="polite"
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  anyRefreshing
                    ? "animate-pulse bg-amber-400"
                    : "bg-emerald-400"
                }`}
                aria-hidden="true"
              />
              {t("admin.dashboard.updated", { defaultValue: "Actualizado" })}{" "}
              {timeAgo}
            </span>
            <button
              type="button"
              onClick={refreshAll}
              disabled={anyRefreshing}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-alt)] text-[var(--color-muted)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] disabled:opacity-60"
              title={t("admin.dashboard.refresh", {
                defaultValue: "Refrescar",
              })}
              aria-label={t("admin.dashboard.refresh", {
                defaultValue: "Refrescar",
              })}
            >
              <RefreshCw
                className={`h-4 w-4 ${anyRefreshing ? "animate-spin" : ""}`}
                strokeWidth={2.3}
              />
            </button>
          </div>
        </header>

        {/* ── Error banner ── */}
        {hasError && !isLoading && (
          <ErrorBanner
            message={t("admin.dashboard.error")}
            onRetry={handleRetry}
          />
        )}

        {/* ── Hero KPIs (2 cards) — Users + AI Satisfaction ── */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : stats && feedbackStats ? (
          <div
            className="grid grid-cols-1 gap-4 md:grid-cols-2"
            aria-label={t("admin.dashboard.heroKpisAria", {
              defaultValue: "Indicadores principales",
            })}
          >
            <StatCard
              size="hero"
              tone="primary"
              icon={<Users className="h-4 w-4" />}
              label={t("admin.dashboard.totalUsers")}
              value={stats.users.total}
              trend={{
                delta: stats.users.recentWeek,
                label: t("admin.dashboard.trendWeek", {
                  defaultValue: "esta semana",
                }),
              }}
              subtitle={t("admin.dashboard.premiumSubtitle", {
                premium: stats.users.premium,
                recent: stats.users.recentWeek,
              })}
              href="/admin/users"
            />
            <StatCard
              size="hero"
              tone="accent"
              icon={<ThumbsUp className="h-4 w-4" />}
              label={t("admin.dashboard.aiSatisfaction")}
              value={
                feedbackStats.total === 0
                  ? "—"
                  : `${feedbackStats.satisfactionRate.toFixed(1)}%`
              }
              empty={
                feedbackStats.total === 0
                  ? t("admin.dashboard.aiNoFeedback", {
                      defaultValue:
                        "Aún no hay feedback registrado de los usuarios.",
                    })
                  : undefined
              }
              subtitle={
                feedbackStats.total > 0
                  ? t("admin.dashboard.aiSatisfactionSubtitle", {
                      good: feedbackStats.good,
                      bad: feedbackStats.bad,
                      neutral: feedbackStats.neutral,
                      total: feedbackStats.total,
                    })
                  : undefined
              }
              href="/admin/ai"
            />
          </div>
        ) : null}

        {/* ── Activity KPIs — DAU / WAU / MAU ── */}
        {activeQ.isPending ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : activeQ.data ? (
          <section
            className="flex flex-col gap-3"
            aria-labelledby="activity-section-title"
          >
            <h2
              id="activity-section-title"
              className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]"
            >
              {t("admin.dashboard.activitySection", {
                defaultValue: "Actividad real",
              })}
            </h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <StatCard
                tone="positive"
                icon={<Activity className="h-4 w-4" />}
                label={t("admin.dashboard.dau", {
                  defaultValue: "DAU · últimas 24h",
                })}
                value={activeQ.data.dau}
                subtitle={
                  activeQ.data.total > 0
                    ? t("admin.dashboard.activeOfTotal", {
                        defaultValue: "{{pct}}% de {{total}}",
                        pct: pct(activeQ.data.dau, activeQ.data.total),
                        total: activeQ.data.total,
                      })
                    : undefined
                }
                sparkline={dauTrendQ.data?.series.map((p) => p.count)}
              />
              <StatCard
                tone="accent"
                icon={<CalendarDays className="h-4 w-4" />}
                label={t("admin.dashboard.wau", {
                  defaultValue: "WAU · 7 días",
                })}
                value={activeQ.data.wau}
                subtitle={
                  activeQ.data.total > 0
                    ? t("admin.dashboard.activeOfTotal", {
                        defaultValue: "{{pct}}% de {{total}}",
                        pct: pct(activeQ.data.wau, activeQ.data.total),
                        total: activeQ.data.total,
                      })
                    : undefined
                }
              />
              <StatCard
                tone="primary"
                icon={<CalendarRange className="h-4 w-4" />}
                label={t("admin.dashboard.mau", {
                  defaultValue: "MAU · 30 días",
                })}
                value={activeQ.data.mau}
                subtitle={
                  activeQ.data.total > 0
                    ? t("admin.dashboard.activeOfTotal", {
                        defaultValue: "{{pct}}% de {{total}}",
                        pct: pct(activeQ.data.mau, activeQ.data.total),
                        total: activeQ.data.total,
                      })
                    : undefined
                }
              />
              <StatCard
                tone="warning"
                icon={<TrendingUp className="h-4 w-4" />}
                label={t("admin.dashboard.stickiness", {
                  defaultValue: "Stickiness · DAU/MAU",
                })}
                value={
                  activeQ.data.mau > 0
                    ? `${pct(activeQ.data.dau, activeQ.data.mau)}%`
                    : "—"
                }
                subtitle={t("admin.dashboard.stickinessHint", {
                  defaultValue: "Qué tan recurrente es la app",
                })}
                empty={
                  activeQ.data.mau === 0
                    ? t("admin.dashboard.stickinessEmpty", {
                        defaultValue: "Sin actividad reciente para calcular.",
                      })
                    : undefined
                }
              />
            </div>
          </section>
        ) : null}

        {/* ── Power users widget ── */}
        {!isLoading && (
          <article
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-5"
            aria-labelledby="power-users-title"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2
                id="power-users-title"
                className="text-sm font-semibold uppercase tracking-widest text-[var(--color-muted)]"
              >
                {t("admin.dashboard.powerUsersTitle", {
                  defaultValue: "Power users · más activos",
                })}
              </h2>
              <button
                type="button"
                onClick={() => navigate("/admin/users")}
                className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted)] transition hover:text-[var(--color-primary)]"
              >
                {t("admin.dashboard.viewAllUsers", {
                  defaultValue: "Ver todos",
                })}
                <ArrowRight className="h-3 w-3" strokeWidth={2.4} />
              </button>
            </div>
            {topUsersQ.isPending ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex animate-pulse items-center gap-3 rounded-xl p-2"
                  >
                    <div className="h-10 w-10 rounded-full bg-[var(--color-border)]" />
                    <div className="flex flex-1 flex-col gap-2">
                      <div className="h-3 w-32 rounded bg-[var(--color-border)]" />
                      <div className="h-2 w-48 rounded bg-[var(--color-border)]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : topUsersQ.data && topUsersQ.data.length > 0 ? (
              <ul className="flex flex-col gap-1">
                {topUsersQ.data.map((u) => (
                  <li key={u.id}>
                    <PowerUserRow user={u} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-6 text-center text-sm text-[var(--color-muted)]">
                {t("admin.dashboard.powerUsersEmpty", {
                  defaultValue:
                    "Aún no hay actividad — nadie se ha conectado todavía.",
                })}
              </p>
            )}
          </article>
        )}

        {/* ── Operational KPIs — user base health ── */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : stats && feedbackStats ? (
          <section
            className="flex flex-col gap-3"
            aria-labelledby="ops-section-title"
          >
            <h2
              id="ops-section-title"
              className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]"
            >
              {t("admin.dashboard.opsSection", {
                defaultValue: "Base de usuarios",
              })}
            </h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <StatCard
                tone="warning"
                icon={<Crown className="h-4 w-4" />}
                label={t("admin.dashboard.premiumUsers", {
                  defaultValue: "Premium",
                })}
                value={stats.users.premium}
                subtitle={t("admin.dashboard.percentOfTotal", {
                  defaultValue: "{{pct}}% del total",
                  pct: pct(stats.users.premium, stats.users.total),
                })}
                href="/admin/users"
              />
              <StatCard
                tone="primary"
                icon={<UserMinus className="h-4 w-4" />}
                label={t("admin.dashboard.freeUsers", {
                  defaultValue: "Free",
                })}
                value={stats.users.total - stats.users.premium}
                subtitle={t("admin.dashboard.percentOfTotal", {
                  defaultValue: "{{pct}}% del total",
                  pct: pct(
                    stats.users.total - stats.users.premium,
                    stats.users.total,
                  ),
                })}
                href="/admin/users"
              />
              <StatCard
                tone="positive"
                icon={<UserPlus className="h-4 w-4" />}
                label={t("admin.dashboard.newThisWeek", {
                  defaultValue: "Nuevos esta semana",
                })}
                value={stats.users.recentWeek}
                trend={{
                  delta: stats.users.recentWeek,
                  label: t("admin.dashboard.trendWeek", {
                    defaultValue: "esta semana",
                  }),
                }}
                href="/admin/users"
              />
              <StatCard
                tone="accent"
                icon={<TrendingUp className="h-4 w-4" />}
                label={t("admin.dashboard.premiumConversions")}
                value={`${premiumRate}%`}
                subtitle={t("admin.dashboard.premiumConversionsSubtitle", {
                  premium: stats.users.premium,
                  total: stats.users.total,
                })}
                href="/admin/users"
              />
            </div>
          </section>
        ) : null}

        {/* ── Content KPIs — catalog + AI usage ── */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : stats && feedbackStats ? (
          <section
            className="flex flex-col gap-3"
            aria-labelledby="content-section-title"
          >
            <h2
              id="content-section-title"
              className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]"
            >
              {t("admin.dashboard.contentSection", {
                defaultValue: "Contenido y uso",
              })}
            </h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <StatCard
                tone="primary"
                icon={<Music className="h-4 w-4" />}
                label={t("admin.dashboard.tracks")}
                value={stats.content.tracks}
                subtitle={
                  stats.users.total > 0
                    ? t("admin.dashboard.perUser", {
                        defaultValue: "{{n}} por usuario",
                        n: (stats.content.tracks / stats.users.total).toFixed(
                          1,
                        ),
                      })
                    : undefined
                }
              />
              <StatCard
                tone="primary"
                icon={<ListMusic className="h-4 w-4" />}
                label={t("admin.dashboard.playlists")}
                value={stats.content.playlists}
                subtitle={
                  stats.users.total > 0
                    ? t("admin.dashboard.perUser", {
                        defaultValue: "{{n}} por usuario",
                        n: (
                          stats.content.playlists / stats.users.total
                        ).toFixed(1),
                      })
                    : undefined
                }
              />
              <StatCard
                tone="accent"
                icon={<Sparkles className="h-4 w-4" />}
                label={t("admin.dashboard.aiRequests")}
                value={stats.ai.totalRequests}
                subtitle={
                  stats.users.total > 0
                    ? t("admin.dashboard.perUser", {
                        defaultValue: "{{n}} por usuario",
                        n: (stats.ai.totalRequests / stats.users.total).toFixed(
                          1,
                        ),
                      })
                    : undefined
                }
                href="/admin/ai"
              />
              <StatCard
                tone="primary"
                icon={<HardDrive className="h-4 w-4" />}
                label={t("admin.dashboard.storage", {
                  defaultValue: "Almacenamiento",
                })}
                value={catalog ? formatBytes(catalog.totalBytes) : "—"}
                subtitle={
                  catalog
                    ? t("admin.dashboard.audioTotal", {
                        defaultValue: "{{dur}} de audio",
                        dur: formatDuration(catalog.totalDurationMs),
                      })
                    : undefined
                }
              />
            </div>
          </section>
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
