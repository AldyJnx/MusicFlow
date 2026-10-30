import {
  Bell,
  Crown,
  Loader2,
  LogOut,
  Music4,
  Search,
  Settings as SettingsIcon,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import QuotaBadge from "../QuotaBadge";
import OfflineIndicator from "../OfflineIndicator";
import TierBadge from "../TierBadge";
import { useAuthStore } from "../../stores/authStore";
import { getMyNotifications, markMyNotificationsRead } from "../../api/auth";
import { useGlobalSearch } from "../../hooks/useGlobalSearch";
import {
  usePlayerStore,
  type PlayerTrack,
} from "../../../client/stores/playStore";
import type { Track } from "../../api/tracks";
import {
  formatTrackArtist,
  toPlayerFeaturedArtists,
} from "../../utils/trackArtist";

type NavbarProps = {
  placeholder?: string;
};

export interface NavbarRef {
  focusSearch: () => void;
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function toPlayerTrack(t: Track): PlayerTrack | null {
  if (!t.fileUrlRemote) return null;
  return {
    id: t.id,
    title: t.title,
    artistProfileName: t.artist,
    artist: formatTrackArtist(t.artist, t.featuredArtists),
    featuredArtists: toPlayerFeaturedArtists(t.featuredArtists),
    cover: t.coverArt,
    url: t.fileUrlRemote,
    durationMs: t.durationMs,
  };
}

const Navbar = forwardRef<NavbarRef, NavbarProps>(function Navbar(
  { placeholder },
  ref,
) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const clearSession = useAuthStore((s) => s.clear);
  const playTrack = usePlayerStore((s) => s.playTrack);
  const stopPlayback = usePlayerStore((s) => s.stop);
  const { query, setQuery, tracks, artists, isLoading } = useGlobalSearch();
  const [focused, setFocused] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const queryClient = useQueryClient();
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(
    ref,
    () => ({
      focusSearch: () => {
        inputRef.current?.focus();
        setFocused(true);
      },
    }),
    [],
  );

  const resolvedPlaceholder =
    placeholder ??
    t("navbar.searchPlaceholder", { defaultValue: "Buscar música, artistas…" });

  // Close dropdown + menu when clicking outside their respective containers.
  useEffect(() => {
    function onPointer(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setFocused(false);
      }
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, []);

  useEffect(() => {
    setAvatarFailed(false);
  }, [user?.avatar]);

  const dropdownOpen = focused && query.trim().length >= 2;
  const notifications = useQuery({
    queryKey: ["user-notifications", "quick"],
    queryFn: () =>
      getMyNotifications({ page: 1, pageSize: 3, sort: "RECENT", q: "" }),
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
  const notificationCount = notifications.data?.unreadCount ?? 0;
  const markNotificationsRead = useMutation({
    mutationFn: () => markMyNotificationsRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["user-notifications"] });
      queryClient.setQueriesData(
        { queryKey: ["user-notifications"] },
        (data: typeof notifications.data) =>
          data
            ? {
                ...data,
                unreadCount: 0,
                items: data.items.map((notification) => ({
                  ...notification,
                  read: true,
                })),
              }
            : data,
      );
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["user-notifications"] }),
  });
  const toggleNotifications = () => {
    setNotificationsOpen((open) => {
      if (!open) markNotificationsRead.mutate();
      return !open;
    });
  };

  function handlePick(track: Track) {
    const playable = toPlayerTrack(track);
    if (!playable) return;
    void playTrack(playable);
    setQuery("");
    setFocused(false);
  }

  function handlePickArtist(name: string) {
    navigate(`/artist/${encodeURIComponent(name)}`);
    setQuery("");
    setFocused(false);
  }

  return (
    <header className="sticky top-0 z-30 flex h-[62px] items-center justify-between gap-4 border-b border-[var(--color-line)] bg-[rgba(7,7,14,.3)] px-6 backdrop-blur-[20px]">
      <div className="flex flex-1 justify-start">
        <div ref={containerRef} className="relative w-full max-w-md">
          <div className="flex items-center gap-3 rounded-full bg-[var(--color-page)]/70 px-4 py-2.5">
            <Search
              className="h-4 w-4 text-[var(--color-muted)]"
              strokeWidth={2.2}
            />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onFocus={() => setFocused(true)}
              placeholder={resolvedPlaceholder}
              className="w-full bg-transparent text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-muted)]"
            />
            {isLoading ? (
              <Loader2
                className="h-4 w-4 animate-spin text-[var(--color-muted)]"
                strokeWidth={2.2}
              />
            ) : null}
          </div>

          {dropdownOpen ? (
            <div className="absolute left-0 right-0 top-[calc(100%+10px)] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_18px_40px_rgba(0,0,0,0.34)]">
              {artists.length === 0 && tracks.length === 0 && !isLoading ? (
                <div className="px-4 py-6 text-center text-sm text-[var(--color-muted)]">
                  {t("navbar.searchEmpty", {
                    defaultValue: "Sin resultados",
                  })}
                </div>
              ) : null}
              {artists.length > 0 ? (
                <div className="py-1.5">
                  <p className="px-4 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                    {t("navbar.artists", { defaultValue: "Artistas" })}
                  </p>
                  {artists.map((artist) => (
                    <button
                      key={artist.id}
                      type="button"
                      onClick={() => handlePickArtist(artist.name)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-white/[0.04]"
                    >
                      {artist.imageUrl ? (
                        <img
                          src={artist.imageUrl}
                          alt=""
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface-alt)]">
                          <UserIcon
                            className="h-4 w-4 text-[var(--color-muted)]"
                            strokeWidth={1.8}
                          />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[var(--color-text)]">
                          {artist.name}
                        </p>
                        <p className="truncate text-xs text-[var(--color-muted)]">
                          {artist.trackCount} canciones disponibles
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : null}
              {tracks.length > 0 ? (
                <div className="border-t border-[var(--color-border)] py-1.5">
                  <p className="px-4 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                    {t("navbar.tracks", { defaultValue: "Canciones" })}
                  </p>
                  {tracks.map((track) => (
                    <button
                      key={track.id}
                      type="button"
                      onClick={() => handlePick(track)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-white/[0.04]"
                    >
                      {track.coverArt ? (
                        <img
                          src={track.coverArt}
                          alt=""
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-surface-alt)]">
                          <Music4
                            className="h-4 w-4 text-[var(--color-muted)]"
                            strokeWidth={1.8}
                          />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[var(--color-text)]">
                          {track.title}
                        </p>
                        <p className="truncate text-xs text-[var(--color-muted)]">
                          {formatTrackArtist(
                            track.artist,
                            track.featuredArtists,
                          )}
                          {track.album ? ` · ${track.album}` : ""}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <OfflineIndicator />
        {isAuthenticated && user?.role === "ADMIN" ? (
          <button
            type="button"
            onClick={() => navigate("/admin")}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-primary)] bg-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] transition hover:bg-[color-mix(in_srgb,var(--color-primary)_22%,transparent)]"
            title={t("navbar.backToAdmin", {
              defaultValue: "Volver al modo admin",
            })}
          >
            <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2.4} />
            <span className="hidden sm:inline">
              {t("navbar.adminMode", { defaultValue: "Modo admin" })}
            </span>
          </button>
        ) : null}
        {isAuthenticated && user?.role !== "ADMIN" ? (
          <TierBadge className="hidden sm:inline-flex" />
        ) : null}
        {isAuthenticated ? <QuotaBadge /> : null}
        <button
          type="button"
          onClick={() => navigate("/settings")}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--color-muted)] transition hover:bg-white/[0.04] hover:text-[var(--color-text)]"
          aria-label={t("navbar.settings", { defaultValue: "Ajustes" })}
        >
          <SettingsIcon className="h-4 w-4" strokeWidth={2.1} />
        </button>
        {isAuthenticated ? (
          <div className="relative">
            <button
              type="button"
              onClick={toggleNotifications}
              className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--color-muted)] transition hover:bg-white/[0.04] hover:text-[var(--color-text)]"
              aria-label={t("navbar.notifications", {
                defaultValue: "Notificaciones",
              })}
              aria-expanded={notificationsOpen}
            >
              <Bell className="h-4 w-4" strokeWidth={2.1} />
              {notificationCount ? (
                <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-[var(--color-primary)] px-1 py-0.5 text-[10px] font-black text-[var(--color-primary-contrast)]">
                  {notificationCount > 9 ? "+9" : notificationCount}
                </span>
              ) : null}
            </button>
            {notificationsOpen ? (
              <section className="absolute right-0 top-[calc(100%+8px)] z-50 w-[min(92vw,24rem)] rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.34)]">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-black">Notificaciones</h2>
                  <button
                    type="button"
                    onClick={() => {
                      setNotificationsOpen(false);
                      navigate("/notifications");
                    }}
                    className="text-xs font-bold text-[var(--color-primary)]"
                  >
                    Ver todas
                  </button>
                </div>
                <div className="mt-3 space-y-2">
                  {notifications.isLoading ? (
                    <p className="text-sm text-[var(--color-muted)]">
                      Cargando novedades…
                    </p>
                  ) : null}
                  {notifications.data?.items.map((notification) => (
                    <article
                      key={notification.id}
                      className="rounded-xl border border-[var(--color-border)] p-3"
                    >
                      <p className="text-sm font-bold">{notification.title}</p>
                      <p className="mt-1 text-sm text-[var(--color-muted)]">
                        {notification.message}
                      </p>
                    </article>
                  ))}
                  {notifications.data && !notifications.data.items.length ? (
                    <p className="py-4 text-center text-sm text-[var(--color-muted)]">
                      No tienes nuevas notificaciones.
                    </p>
                  ) : null}
                </div>
              </section>
            ) : null}
          </div>
        ) : null}
        {isAuthenticated && user ? (
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label={t("navbar.userMenu", {
                defaultValue: "Menú de usuario",
              })}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-400 text-xs font-bold text-white transition hover:brightness-110"
            >
              {user.avatar && !avatarFailed ? (
                <img
                  src={user.avatar}
                  alt={user.username}
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarFailed(true)}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                initialsOf(user.username)
              )}
            </button>
            {menuOpen ? (
              <div
                role="menu"
                className="absolute right-0 top-[calc(100%+8px)] w-56 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_18px_40px_rgba(0,0,0,0.34)]"
              >
                <div className="border-b border-[var(--color-border)] px-4 py-3">
                  <p className="truncate text-sm font-semibold text-[var(--color-text)]">
                    {user.username}
                  </p>
                  <p
                    className={`mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                      user.role === "ADMIN"
                        ? "text-[var(--color-primary)]"
                        : user.isPremium
                          ? "text-emerald-400"
                          : "text-[var(--color-muted)]"
                    }`}
                  >
                    {user.role === "ADMIN"
                      ? "Admin"
                      : user.isPremium
                        ? "Premium"
                        : "Free"}
                  </p>
                </div>
                {user.role === "ADMIN" ? (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      navigate("/admin");
                    }}
                    className="flex w-full items-center gap-3 border-b border-[var(--color-border)] px-4 py-2.5 text-left text-sm font-semibold text-[var(--color-primary)] transition hover:bg-white/[0.04]"
                  >
                    <ShieldCheck className="h-4 w-4" strokeWidth={2.1} />
                    {t("navbar.menu.admin", { defaultValue: "Panel de admin" })}
                  </button>
                ) : null}
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate("/profile");
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-[var(--color-text)] transition hover:bg-white/[0.04]"
                >
                  <UserIcon className="h-4 w-4" strokeWidth={2.1} />
                  {t("navbar.menu.profile", { defaultValue: "Mi perfil" })}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate("/settings/billing");
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-[var(--color-text)] transition hover:bg-white/[0.04]"
                >
                  <Crown className="h-4 w-4" strokeWidth={2.1} />
                  {user.isPremium
                    ? t("navbar.menu.manageBilling", {
                        defaultValue: "Mi suscripción",
                      })
                    : t("navbar.menu.upgrade", {
                        defaultValue: "Hacerme Premium",
                      })}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate("/settings");
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-[var(--color-text)] transition hover:bg-white/[0.04]"
                >
                  <SettingsIcon className="h-4 w-4" strokeWidth={2.1} />
                  {t("navbar.menu.settings", { defaultValue: "Ajustes" })}
                </button>
                <div className="border-t border-[var(--color-border)]">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      stopPlayback();
                      clearSession();
                      navigate("/");
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-rose-300 transition hover:bg-rose-500/10"
                  >
                    <LogOut className="h-4 w-4" strokeWidth={2.1} />
                    {t("navbar.menu.logout", {
                      defaultValue: "Cerrar sesión",
                    })}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </header>
  );
});

export default Navbar;
