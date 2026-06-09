import { Bell, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import QuotaBadge from "../QuotaBadge";
import { useAuthStore } from "../../stores/authStore";

type NavbarProps = {
  placeholder?: string;
  searchSongs?: Array<{
    id: number;
    title: string;
    artist: string;
    cover: string;
  }>;
};

export default function Navbar({ placeholder, searchSongs = [] }: NavbarProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const resolvedPlaceholder =
    placeholder ??
    t("navbar.searchPlaceholder", { defaultValue: "Search music, artists…" });

  const filteredSongs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return [];
    }

    return searchSongs
      .filter(
        (song) =>
          song.title.toLowerCase().includes(normalizedQuery) ||
          song.artist.toLowerCase().includes(normalizedQuery),
      )
      .slice(0, 5);
  }, [query, searchSongs]);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-[var(--color-border)] bg-[var(--color-navbar)] px-6 py-3">
      <div className="w-10 shrink-0" />

      <div className="flex flex-1 justify-center">
        <div className="relative w-full max-w-md">
          <div className="flex items-center gap-3 rounded-full bg-[var(--color-page)]/70 px-4 py-2.5">
            <Search
              className="h-4 w-4 text-[var(--color-muted)]"
              strokeWidth={2.2}
            />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={resolvedPlaceholder}
              className="w-full bg-transparent text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-muted)]"
            />
          </div>

          {filteredSongs.length > 0 ? (
            <div className="absolute left-0 right-0 top-[calc(100%+10px)] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_18px_40px_rgba(0,0,0,0.34)]">
              {filteredSongs.map((song) => (
                <button
                  key={song.id}
                  type="button"
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-white/[0.04]"
                >
                  <img
                    src={song.cover}
                    alt={song.title}
                    className="h-10 w-10 rounded-lg object-cover"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--color-text)]">
                      {song.title}
                    </p>
                    <p className="truncate text-xs text-[var(--color-muted)]">
                      {song.artist}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
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
