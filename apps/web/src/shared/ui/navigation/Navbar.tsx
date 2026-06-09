import { Bell, Loader2, Music4, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
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

export default function Navbar({ placeholder }: NavbarProps) {
  const { t } = useTranslation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const playTrack = usePlayerStore((s) => s.playTrack);
  const { query, setQuery, results, isLoading } = useGlobalSearch();
  const [focused, setFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const resolvedPlaceholder =
    placeholder ??
    t("navbar.searchPlaceholder", { defaultValue: "Buscar música, artistas…" });

  // Close the dropdown when clicking outside the search container.
  useEffect(() => {
    function onPointer(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setFocused(false);
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
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-[var(--color-border)] bg-[var(--color-navbar)] px-6 py-3">
      <div className="w-10 shrink-0" />

      <div className="flex flex-1 justify-center">
        <div ref={containerRef} className="relative w-full max-w-md">
          <div className="flex items-center gap-3 rounded-full bg-[var(--color-page)]/70 px-4 py-2.5">
            <Search
              className="h-4 w-4 text-[var(--color-muted)]"
              strokeWidth={2.2}
            />
            <input
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
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--color-muted)] transition hover:bg-white/[0.04] hover:text-[var(--color-text)]"
          aria-label={t("navbar.notifications", {
            defaultValue: "Notifications",
          })}
        >
          <Bell className="h-4 w-4" strokeWidth={2.1} />
        </button>
      </div>
    </header>
  );
}
