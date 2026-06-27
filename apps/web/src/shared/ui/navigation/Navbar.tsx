import {
  Bell,
  Crown,
  Loader2,
  LogOut,
  Music4,
  Search,
  Settings as SettingsIcon,
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
import { useNavigate } from "react-router-dom";
import QuotaBadge from "../QuotaBadge";
import OfflineIndicator from "../OfflineIndicator";
import { useAuthStore } from "../../stores/authStore";
import { useGlobalSearch } from "../../hooks/useGlobalSearch";
import {
  usePlayerStore,
  type PlayerTrack,
} from "../../../client/stores/playStore";
import type { Track } from "../../api/tracks";

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
    artist: t.artist,
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
  const { query, setQuery, results, isLoading } = useGlobalSearch();
  const [focused, setFocused] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
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

  const dropdownOpen = focused && query.trim().length >= 2;

  function handlePick(track: Track) {
    const playable = toPlayerTrack(track);
    if (!playable) return;
    void playTrack(playable);
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
              {results.length === 0 && !isLoading ? (
                <div className="px-4 py-6 text-center text-sm text-[var(--color-muted)]">
                  {t("navbar.searchEmpty", {
                    defaultValue: "Sin resultados",
                  })}
                </div>
              ) : null}
              {results.map((track) => (
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
                      {track.artist}
                      {track.album ? ` · ${track.album}` : ""}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <OfflineIndicator />
        {isAuthenticated ? <QuotaBadge /> : null}
        <button
          type="button"
          onClick={() => navigate("/settings")}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--color-muted)] transition hover:bg-white/[0.04] hover:text-[var(--color-text)]"
          aria-label={t("navbar.settings", { defaultValue: "Ajustes" })}
        >
          <SettingsIcon className="h-4 w-4" strokeWidth={2.1} />
        </button>
        <button
          type="button"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--color-muted)] transition hover:bg-white/[0.04] hover:text-[var(--color-text)]"
          aria-label={t("navbar.notifications", {
            defaultValue: "Notificaciones",
          })}
        >
          <Bell className="h-4 w-4" strokeWidth={2.1} />
        </button>
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
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.username}
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
                      user.isPremium
                        ? "text-emerald-400"
                        : "text-[var(--color-muted)]"
                    }`}
                  >
                    {user.isPremium ? "Premium" : "Free"}
                  </p>
                </div>
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
