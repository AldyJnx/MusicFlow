import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  Search,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import {
  listUsers,
  updateUserRole,
  updateUserPremium,
  deactivateUser,
} from "../../shared/api/admin";
import type { AdminUser, UserRole } from "../../shared/api/admin";

const PAGE_SIZE = 50;

function formatDate(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

// ─── Toggle switch ─────────────────────────────────────────────────────────────
function PremiumToggle({
  enabled,
  disabled,
  onToggle,
}: {
  enabled: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={enabled}
      disabled={disabled}
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full border transition disabled:opacity-50 ${
        enabled
          ? "border-[var(--color-primary)] bg-[var(--color-primary)]"
          : "border-[var(--color-border)] bg-[var(--color-surface-alt)]"
      }`}
    >
      <span
        className={`h-4 w-4 rounded-full bg-white shadow-sm transition ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

// ─── Skeleton row ──────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr className="animate-pulse border-b border-[var(--color-border)]">
      {Array.from({ length: 9 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 w-full rounded-md bg-[var(--color-border)]" />
        </td>
      ))}
    </tr>
  );
}

// ─── Popover for actions ────────────────────────────────────────────────────────
function ActionsPopover({
  user,
  onDeactivate,
  isPending,
}: {
  user: AdminUser;
  onDeactivate: () => void;
  isPending: boolean;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (!user.isActive) return null;

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg p-1.5 text-[var(--color-muted)] transition hover:bg-[var(--color-border)] hover:text-[var(--color-text)]"
        aria-label={t("admin.users.actions")}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-1 w-40 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] py-1 shadow-lg">
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              setOpen(false);
              onDeactivate();
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-rose-400 transition hover:bg-[var(--color-border)] disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : null}
            {t("admin.users.deactivate")}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── UserRow ───────────────────────────────────────────────────────────────────
function UserRow({
  user,
  mutatingUserId,
  onRoleChange,
  onPremiumToggle,
  onDeactivate,
}: {
  user: AdminUser;
  mutatingUserId: string | null;
  onRoleChange: (userId: string, role: UserRole) => void;
  onPremiumToggle: (userId: string, current: boolean) => void;
  onDeactivate: (userId: string) => void;
}) {
  const { t } = useTranslation();
  const isThisUserMutating = mutatingUserId === user.id;

  function handleRoleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newRole = e.target.value as UserRole;
    if (newRole === user.role) return;
    const confirmed = window.confirm(
      t("admin.users.confirmRole", { username: user.username, role: newRole }),
    );
    if (!confirmed) return;
    onRoleChange(user.id, newRole);
  }

  function handleDeactivate() {
    const confirmed = window.confirm(
      t("admin.users.confirmDeactivate", { username: user.username }),
    );
    if (!confirmed) return;
    onDeactivate(user.id);
  }

  return (
    <tr className="border-b border-[var(--color-border)] text-sm transition hover:bg-[var(--color-border)]/20">
      {/* Username (links to detail) */}
      <td className="px-4 py-3 font-semibold text-[var(--color-text)]">
        <Link
          to={`/admin/users/${user.id}`}
          className="hover:text-[var(--color-primary)] hover:underline focus:outline-none focus:underline"
        >
          {user.username}
        </Link>
      </td>

      {/* Email (also links to detail for a bigger hit target) */}
      <td className="px-4 py-3 text-xs text-[var(--color-muted)]">
        <Link
          to={`/admin/users/${user.id}`}
          className="hover:text-[var(--color-text)] focus:outline-none focus:text-[var(--color-text)]"
        >
          {user.email}
        </Link>
      </td>

      {/* Rol */}
      <td className="px-4 py-3">
        {isThisUserMutating ? (
          <Loader2 className="h-4 w-4 animate-spin text-[var(--color-primary)]" />
        ) : (
          <select
            value={user.role}
            onChange={handleRoleChange}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-2 py-1 text-xs text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
          >
            <option value="CLIENT">CLIENT</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        )}
      </td>

      {/* Premium */}
      <td className="px-4 py-3">
        <PremiumToggle
          enabled={user.isPremium}
          disabled={isThisUserMutating}
          onToggle={() => onPremiumToggle(user.id, user.isPremium)}
        />
      </td>

      {/* Activo */}
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
            user.isActive
              ? "bg-green-500/10 text-green-400"
              : "bg-rose-500/10 text-rose-400"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              user.isActive ? "bg-green-400" : "bg-rose-400"
            }`}
          />
          {user.isActive
            ? t("admin.users.statusActive")
            : t("admin.users.statusInactive")}
        </span>
      </td>

      {/* Tracks */}
      <td className="px-4 py-3 text-center text-[var(--color-muted)]">
        {user._count.tracks}
      </td>

      {/* Playlists */}
      <td className="px-4 py-3 text-center text-[var(--color-muted)]">
        {user._count.playlists}
      </td>

      {/* Creado */}
      <td className="px-4 py-3 text-xs text-[var(--color-muted)]">
        {formatDate(user.createdAt)}
      </td>

      {/* Acciones */}
      <td className="px-4 py-3 text-right">
        <ActionsPopover
          user={user}
          onDeactivate={handleDeactivate}
          isPending={isThisUserMutating}
        />
      </td>
    </tr>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function UsersPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [skip, setSkip] = useState(0);
  const take = PAGE_SIZE;

  // Debounce search; reset pagination when the debounced term is applied
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setSkip(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Track which user has an in-flight mutation to prevent double-mutations
  const [mutatingUserId, setMutatingUserId] = useState<string | null>(null);

  // Inline error state
  const [mutationError, setMutationError] = useState<string | null>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showError(message: string) {
    setMutationError(message);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => setMutationError(null), 5000);
  }

  useEffect(() => {
    return () => {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    };
  }, []);

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
  }

  // ── Query ────────────────────────────────────────────────────────────────────
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "users", { search: debouncedSearch, skip, take }],
    queryFn: () =>
      listUsers({ search: debouncedSearch || undefined, skip, take }),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });

  const users = data?.users ?? [];
  const total = data?.total ?? 0;

  // ── Role mutation ─────────────────────────────────────────────────────────────
  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
      updateUserRole(userId, role),
    onMutate: ({ userId }) => setMutatingUserId(userId),
    onSettled: () => setMutatingUserId(null),
    onSuccess: () => invalidateAll(),
    onError: () => showError(t("admin.users.errorRole")),
  });

  // ── Premium mutation ──────────────────────────────────────────────────────────
  const premiumMutation = useMutation({
    mutationFn: ({
      userId,
      isPremium,
    }: {
      userId: string;
      isPremium: boolean;
    }) => updateUserPremium(userId, isPremium),
    onMutate: ({ userId }) => setMutatingUserId(userId),
    onSettled: () => setMutatingUserId(null),
    onSuccess: () => invalidateAll(),
    onError: () => showError(t("admin.users.errorPremium")),
  });

  // ── Deactivate mutation ───────────────────────────────────────────────────────
  const deactivateMutation = useMutation({
    mutationFn: (userId: string) => deactivateUser(userId),
    onMutate: (userId) => setMutatingUserId(userId),
    onSettled: () => setMutatingUserId(null),
    onSuccess: () => invalidateAll(),
    onError: () => showError(t("admin.users.errorDeactivate")),
  });

  function handleRoleChange(userId: string, role: UserRole) {
    if (mutatingUserId !== null) return;
    roleMutation.mutate({ userId, role });
  }

  function handlePremiumToggle(userId: string, current: boolean) {
    if (mutatingUserId !== null) return;
    premiumMutation.mutate({ userId, isPremium: !current });
  }

  function handleDeactivate(userId: string) {
    if (mutatingUserId !== null) return;
    deactivateMutation.mutate(userId);
  }

  const canGoPrev = skip > 0;
  const canGoNext = skip + take < total;

  return (
    <section className="min-h-screen w-full bg-[var(--color-page)] px-4 py-6 text-[var(--color-text)] sm:px-6 xl:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-text)]">
              {t("admin.users.title")}
            </h1>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              {t("admin.users.subtitle")}
            </p>
          </div>
          <span className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-1 text-xs font-semibold text-[var(--color-muted)]">
            {t("admin.users.count", { count: total })}
          </span>
        </div>

        {/* ── Toolbar ── */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Search */}
          <div className="relative min-w-[220px] max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
            <input
              type="search"
              placeholder={t("admin.users.search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] py-2 pl-9 pr-4 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-primary)] focus:outline-none"
            />
          </div>

          {/* Pagination */}
          <div className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
            {total > 0 && (
              <span className="text-xs">
                {t("admin.users.rangeOf", {
                  from: skip + 1,
                  to: Math.min(skip + take, total),
                  total,
                })}
              </span>
            )}
            <button
              type="button"
              disabled={!canGoPrev}
              onClick={() => setSkip((s) => Math.max(0, s - take))}
              className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-1.5 text-xs font-medium transition hover:border-[var(--color-primary)] disabled:opacity-40 disabled:pointer-events-none"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              {t("admin.users.previous")}
            </button>
            <button
              type="button"
              disabled={!canGoNext}
              onClick={() => setSkip((s) => s + take)}
              className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-1.5 text-xs font-medium transition hover:border-[var(--color-primary)] disabled:opacity-40 disabled:pointer-events-none"
            >
              {t("admin.users.next")}
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* ── Error banner (query) ── */}
        {isError && (
          <div className="flex items-center justify-between gap-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
            <span>{t("admin.users.loadError")}</span>
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-lg border border-rose-500/30 px-3 py-1 text-xs font-semibold transition hover:bg-rose-500/20"
            >
              {t("admin.users.retry")}
            </button>
          </div>
        )}

        {/* ── Table card ── */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  {[
                    "user",
                    "email",
                    "role",
                    "premium",
                    "status",
                    "tracks",
                    "playlists",
                    "created",
                    "actions",
                  ].map((col) => (
                    <th
                      key={col}
                      className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]"
                    >
                      {t(`admin.users.table.${col}`)}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <SkeletonRow key={i} />
                  ))
                ) : users.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-12 text-center text-sm text-[var(--color-muted)]"
                    >
                      {t("admin.users.empty")}
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <UserRow
                      key={user.id}
                      user={user}
                      mutatingUserId={mutatingUserId}
                      onRoleChange={handleRoleChange}
                      onPremiumToggle={handlePremiumToggle}
                      onDeactivate={handleDeactivate}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Mutation error toast ── */}
        {mutationError && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
            {mutationError}
          </div>
        )}
      </div>
    </section>
  );
}
