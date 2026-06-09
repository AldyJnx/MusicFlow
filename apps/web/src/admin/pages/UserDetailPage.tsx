import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Calendar,
  Music,
  Palette,
  Settings2,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import {
  deactivateUser,
  getUserDetail,
  updateUserPremium,
  updateUserRole,
} from "../../shared/api/admin";
import type {
  AdminUserDetail,
  DeviceType,
  UserRole,
} from "../../shared/api/admin";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${formatDate(iso)} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatDurationShort(ms: number): string {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rs = s % 60;
  return `${m}:${String(rs).padStart(2, "0")}`;
}

function deviceTypeLabel(t: DeviceType): string {
  switch (t) {
    case "DESKTOP_WIN":
      return "Windows";
    case "DESKTOP_MAC":
      return "macOS";
    case "DESKTOP_LINUX":
      return "Linux";
    case "WEB":
      return "Web";
    case "MOBILE_ANDROID":
      return "Android";
    case "MOBILE_IOS":
      return "iOS";
  }
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-5">
      <h2 className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-[var(--color-muted)]">
        <span className="text-[var(--color-primary)]">{icon}</span>
        {title}
      </h2>
      {children}
    </article>
  );
}

function EmptyRow({ message }: { message: string }) {
  return <p className="py-3 text-xs text-[var(--color-muted)]">{message}</p>;
}

function CountBadge({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-page)]/60 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-muted)]">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold tabular-nums text-[var(--color-text)]">
        {value}
      </p>
    </div>
  );
}

function SkeletonBlock() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-24 rounded-2xl bg-[var(--color-surface-alt)]" />
      <div className="h-40 rounded-2xl bg-[var(--color-surface-alt)]" />
      <div className="h-40 rounded-2xl bg-[var(--color-surface-alt)]" />
    </div>
  );
}

export default function UserDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();

  const detailQ = useQuery<AdminUserDetail>({
    queryKey: ["admin", "user-detail", id],
    queryFn: () => getUserDetail(id!),
    enabled: !!id,
    staleTime: 30_000,
  });

  const premiumM = useMutation({
    mutationFn: (next: boolean) => updateUserPremium(id!, next),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "user-detail", id] });
      void qc.invalidateQueries({ queryKey: ["admin", "users"] });
      void qc.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });
  const roleM = useMutation({
    mutationFn: (next: UserRole) => updateUserRole(id!, next),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "user-detail", id] });
      void qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
  const deactM = useMutation({
    mutationFn: () => deactivateUser(id!),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "user-detail", id] });
      void qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });

  if (!id) {
    return (
      <section className="min-h-screen w-full px-6 py-10">
        <p className="text-sm text-rose-300">
          {t("admin.userDetail.missingId")}
        </p>
      </section>
    );
  }

  return (
    <section className="min-h-screen w-full bg-[var(--color-page)] px-4 py-6 text-[var(--color-text)] sm:px-6 xl:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <Link
            to="/admin/users"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--color-muted)] transition hover:text-[var(--color-text)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t("admin.userDetail.backToUsers")}
          </Link>
          {detailQ.data && (
            <button
              type="button"
              onClick={() => {
                if (
                  detailQ.data &&
                  detailQ.data.user.isActive &&
                  confirm(
                    t("admin.userDetail.confirmDeactivate", {
                      username: detailQ.data.user.username,
                    }),
                  )
                ) {
                  deactM.mutate();
                }
              }}
              disabled={!detailQ.data.user.isActive || deactM.isPending}
              className="inline-flex items-center gap-2 rounded-full border border-rose-400/40 px-3 py-1.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/10 disabled:opacity-40"
            >
              {detailQ.data.user.isActive
                ? t("admin.userDetail.deactivate")
                : t("admin.userDetail.inactive")}
            </button>
          )}
        </div>

        {detailQ.isPending && <SkeletonBlock />}

        {detailQ.isError && (
          <div className="flex items-center justify-between rounded-2xl border border-rose-500/40 bg-rose-500/10 p-5">
            <p className="text-sm font-medium text-rose-300">
              {t("admin.userDetail.loadError")}
            </p>
            <button
              type="button"
              onClick={() => detailQ.refetch()}
              className="rounded-xl border border-rose-400/40 px-4 py-2 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20"
            >
              {t("admin.userDetail.retry")}
            </button>
          </div>
        )}

        {detailQ.data && (
          <>
            {/* ── Header ── */}
            <header className="flex flex-col gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-violet-400 text-base font-bold text-white">
                  {detailQ.data.user.username.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">
                    {detailQ.data.user.username}
                  </h1>
                  <p className="text-sm text-[var(--color-muted)]">
                    {detailQ.data.user.email}
                  </p>
                  <p className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-muted)]">
                    <Calendar className="h-3 w-3" />{" "}
                    {t("admin.userDetail.createdOn", {
                      date: formatDate(detailQ.data.user.createdAt),
                    })}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
                  {t("admin.userDetail.role")}
                  <select
                    value={detailQ.data.user.role}
                    disabled={roleM.isPending}
                    onChange={(e) =>
                      roleM.mutate(e.currentTarget.value as UserRole)
                    }
                    className="rounded-lg border border-[var(--color-border)] bg-[var(--color-page)] px-2 py-1 text-xs font-semibold text-[var(--color-text)]"
                  >
                    <option value="CLIENT">CLIENT</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </label>

                <label className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
                  {t("admin.userDetail.premium")}
                  <input
                    type="checkbox"
                    checked={detailQ.data.user.isPremium}
                    disabled={premiumM.isPending}
                    onChange={(e) => premiumM.mutate(e.currentTarget.checked)}
                    className="h-4 w-4 accent-[var(--color-primary)]"
                  />
                </label>

                <span
                  className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-widest ${
                    detailQ.data.user.isActive
                      ? "bg-emerald-500/15 text-emerald-300"
                      : "bg-rose-500/15 text-rose-300"
                  }`}
                >
                  {detailQ.data.user.isActive
                    ? t("admin.userDetail.active")
                    : t("admin.userDetail.inactive")}
                </span>
              </div>
            </header>

            {/* ── Counts grid ── */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
              <CountBadge
                label={t("admin.userDetail.counts.tracks")}
                value={detailQ.data.user._count.tracks}
              />
              <CountBadge
                label={t("admin.userDetail.counts.playlists")}
                value={detailQ.data.user._count.playlists}
              />
              <CountBadge
                label={t("admin.userDetail.counts.eqPresets")}
                value={detailQ.data.user._count.eqPresets}
              />
              <CountBadge
                label={t("admin.userDetail.counts.eqConfigs")}
                value={detailQ.data.user._count.eqConfigs}
              />
              <CountBadge
                label={t("admin.userDetail.counts.segments")}
                value={detailQ.data.user._count.eqSegments}
              />
              <CountBadge
                label={t("admin.userDetail.counts.aiReqs")}
                value={detailQ.data.user._count.aiRequests}
              />
              <CountBadge
                label={t("admin.userDetail.counts.plays")}
                value={detailQ.data.user._count.playHistory}
              />
              <CountBadge
                label={t("admin.userDetail.counts.devices")}
                value={detailQ.data.user._count.devices}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* ── Devices ── */}
              <Section
                title={t("admin.userDetail.sections.devices")}
                icon={<Smartphone className="h-3.5 w-3.5" />}
              >
                {detailQ.data.user.devices.length === 0 ? (
                  <EmptyRow message={t("admin.userDetail.noDevices")} />
                ) : (
                  <ul className="flex flex-col gap-2">
                    {detailQ.data.user.devices.map((d) => (
                      <li
                        key={d.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-page)]/60 px-3 py-2 text-xs"
                      >
                        <div>
                          <p className="font-semibold text-[var(--color-text)]">
                            {d.deviceName || deviceTypeLabel(d.deviceType)}
                          </p>
                          <p className="text-[10px] text-[var(--color-muted)]">
                            {deviceTypeLabel(d.deviceType)} ·{" "}
                            {t("admin.userDetail.createdOn", {
                              date: formatDate(d.createdAt),
                            })}
                          </p>
                        </div>
                        <div className="text-right text-[10px] text-[var(--color-muted)]">
                          <p>{t("admin.userDetail.lastSync")}</p>
                          <p className="font-mono">
                            {formatDateTime(d.lastSyncAt)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>

              {/* ── Preferences ── */}
              <Section
                title={t("admin.userDetail.sections.preferences")}
                icon={<Settings2 className="h-3.5 w-3.5" />}
              >
                {detailQ.data.user.preferences ? (
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    <dt className="flex items-center gap-1 text-[var(--color-muted)]">
                      <Palette className="h-3 w-3" />{" "}
                      {t("admin.userDetail.theme")}
                    </dt>
                    <dd className="font-mono text-[var(--color-text)]">
                      {detailQ.data.user.preferences.theme}
                    </dd>
                    <dt className="text-[var(--color-muted)]">
                      {t("admin.userDetail.player")}
                    </dt>
                    <dd className="font-mono text-[var(--color-text)]">
                      {detailQ.data.user.preferences.playerLayout}
                    </dd>
                    <dt className="text-[var(--color-muted)]">
                      {t("admin.userDetail.library")}
                    </dt>
                    <dd className="font-mono text-[var(--color-text)]">
                      {detailQ.data.user.preferences.libraryLayout}
                    </dd>
                    <dt className="text-[var(--color-muted)]">
                      {t("admin.userDetail.crossfade")}
                    </dt>
                    <dd className="text-[var(--color-text)]">
                      {detailQ.data.user.preferences.crossfadeEnabled
                        ? `${detailQ.data.user.preferences.crossfadeDurationMs} ms`
                        : t("admin.userDetail.off")}
                    </dd>
                    <dt className="text-[var(--color-muted)]">
                      {t("admin.userDetail.gapless")}
                    </dt>
                    <dd className="text-[var(--color-text)]">
                      {detailQ.data.user.preferences.gaplessEnabled
                        ? t("admin.userDetail.on")
                        : t("admin.userDetail.off")}
                    </dd>
                    <dt className="text-[var(--color-muted)]">
                      {t("admin.userDetail.scrobble")}
                    </dt>
                    <dd className="text-[var(--color-text)]">
                      {detailQ.data.user.preferences.scrobbleEnabled
                        ? `≥${detailQ.data.user.preferences.scrobbleThreshold}%`
                        : t("admin.userDetail.off")}
                    </dd>
                  </dl>
                ) : (
                  <EmptyRow message={t("admin.userDetail.noPreferences")} />
                )}
              </Section>

              {/* ── Recent plays ── */}
              <Section
                title={t("admin.userDetail.sections.recentPlays")}
                icon={<Music className="h-3.5 w-3.5" />}
              >
                {detailQ.data.recentPlays.length === 0 ? (
                  <EmptyRow message={t("admin.userDetail.noPlays")} />
                ) : (
                  <ul className="flex flex-col gap-1.5">
                    {detailQ.data.recentPlays.map((p) => (
                      <li
                        key={p.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-page)]/60 px-3 py-2 text-xs"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-[var(--color-text)]">
                            {p.track
                              ? `${p.track.title} — ${p.track.artist}`
                              : t("admin.userDetail.deletedTrack")}
                          </p>
                          <p className="text-[10px] text-[var(--color-muted)]">
                            {formatDateTime(p.playedAt)} · {p.device}
                            {p.skipped
                              ? ` · ${t("admin.userDetail.skipped")}`
                              : p.completed
                                ? ` · ${t("admin.userDetail.completed")}`
                                : ""}
                          </p>
                        </div>
                        <span className="shrink-0 font-mono text-[10px] text-[var(--color-muted)]">
                          {formatDurationShort(p.durationListenedMs)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>

              {/* ── AI usage ── */}
              <Section
                title={t("admin.userDetail.sections.aiUsage")}
                icon={<Sparkles className="h-3.5 w-3.5" />}
              >
                <div className="mb-3 grid grid-cols-3 gap-2 text-xs">
                  <CountBadge
                    label={t("admin.userDetail.tokensIn")}
                    value={detailQ.data.aiSpend.tokensInput}
                  />
                  <CountBadge
                    label={t("admin.userDetail.tokensOut")}
                    value={detailQ.data.aiSpend.tokensOutput}
                  />
                  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-page)]/60 px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-muted)]">
                      {t("admin.userDetail.costUsd")}
                    </p>
                    <p className="mt-1 text-lg font-semibold tabular-nums text-[var(--color-text)]">
                      ${Number(detailQ.data.aiSpend.costUsd).toFixed(4)}
                    </p>
                  </div>
                </div>
                {detailQ.data.recentAiRequests.length === 0 ? (
                  <EmptyRow message={t("admin.userDetail.noAi")} />
                ) : (
                  <ul className="flex flex-col gap-1.5">
                    {detailQ.data.recentAiRequests.map((r) => (
                      <li
                        key={r.id}
                        className="flex items-start justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-page)]/60 px-3 py-2 text-xs"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-[var(--color-text)]">
                            {r.prompt}
                          </p>
                          <p className="text-[10px] text-[var(--color-muted)]">
                            {formatDateTime(r.createdAt)} · {r.modelUsed} ·{" "}
                            {r.tokensInput + r.tokensOutput} tok ·{" "}
                            {r.responseTimeMs} ms
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                            r.feedback === "GOOD"
                              ? "bg-emerald-500/15 text-emerald-300"
                              : r.feedback === "BAD"
                                ? "bg-rose-500/15 text-rose-300"
                                : r.feedback === "NEUTRAL"
                                  ? "bg-slate-500/20 text-slate-300"
                                  : "bg-[var(--color-border)] text-[var(--color-muted)]"
                          }`}
                        >
                          {r.feedback ?? "—"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
