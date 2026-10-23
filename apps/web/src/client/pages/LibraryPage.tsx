import {
  Clock3,
  Globe,
  Heart,
  ListMusic,
  ListPlus,
  Music4,
  MoreHorizontal,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";

import ClientLayout from "../layout/ClientLayout";
import {
  useInfiniteTracksQuery,
  useAlbumsInfiniteQuery,
  useArtistsInfiniteQuery,
} from "../../shared/hooks/useTracks";
import {
  useSavedCheckQuery,
  useInfiniteSavedTracksQuery,
} from "../../shared/hooks/useLibrarySaves";
import { listGenres, type Track } from "../../shared/api/tracks";
import { formatDuration } from "../../shared/utils/duration";
import {
  formatTrackArtist,
  toPlayerFeaturedArtists,
} from "../../shared/utils/trackArtist";
import { usePlayerStore, type PlayerTrack } from "../stores/playStore";
import SaveButton from "../../shared/ui/SaveButton";
import AddToPlaylistModal from "../features/playlists/AddToPlaylistModal";
import PagedLibraryCarousel from "../../shared/ui/PagedLibraryCarousel";

type LibraryScope = "catalog" | "mylibrary";
type LibraryTab = "songs" | "albums" | "artists";
const tabs: LibraryTab[] = ["songs", "albums", "artists"];

// Songs-table column template, shared by header, rows and skeletons. Columns
// collapse with the viewport: base = title/duration/save/menu, md adds the
// row number, lg adds the EQ-status column (the product differentiator), and
// xl finally adds the album. minmax(0,…) lets the title cell truncate instead
// of forcing horizontal clipping.
const ROW_GRID =
  "grid grid-cols-[minmax(0,1fr)_64px_40px_40px] md:grid-cols-[40px_minmax(0,1fr)_64px_44px_44px] lg:grid-cols-[40px_minmax(0,1.6fr)_150px_64px_44px_44px] xl:grid-cols-[58px_minmax(0,1.8fr)_minmax(0,1.1fr)_160px_90px_48px_48px]";

/**
 * Tile for the Artists tab. Uses the same gradient + initials pattern as
 * HomePage's ArtistAvatar so the same artist looks identical across
 * surfaces. Navigates to /artist/:name on click.
 */
function ArtistTile({
  name,
  imageUrl,
  onClick,
}: {
  name: string;
  imageUrl?: string | null;
  onClick: () => void;
}) {
  let hue = 0;
  for (let i = 0; i < name.length; i++) {
    hue = (hue * 31 + name.charCodeAt(i)) % 360;
  }
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <button
      type="button"
      data-testid={`library-artist-${name}`}
      onClick={onClick}
      className="group flex h-[248px] w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4 text-center transition hover:-translate-y-1 hover:border-[var(--color-primary)] hover:shadow-[0_18px_40px_rgba(0,0,0,0.32)]"
    >
      <div
        className="flex h-40 w-40 shrink-0 items-center justify-center overflow-hidden rounded-full text-xl font-bold text-white shadow-[0_10px_24px_rgba(0,0,0,0.32)] transition group-hover:scale-105"
        style={
          imageUrl
            ? undefined
            : {
                background: `linear-gradient(135deg, hsl(${hue} 70% 50%) 0%, hsl(${(hue + 40) % 360} 65% 35%) 100%)`,
              }
        }
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          initials || "?"
        )}
      </div>
      <p className="min-h-10 w-full overflow-hidden text-base font-semibold leading-5 text-[var(--color-text)] group-hover:text-[var(--color-primary)]">
        {name}
      </p>
    </button>
  );
}

// --- Skeleton row for loading state ---
function SkeletonRow() {
  return (
    <div className={`${ROW_GRID} items-center gap-4 px-4 py-4 animate-pulse`}>
      <div className="hidden h-4 w-6 rounded bg-[var(--color-border)] md:block" />
      <div className="flex min-w-0 items-center gap-4">
        <div className="h-14 w-14 flex-none rounded-md bg-[var(--color-border)]" />
        <div className="flex flex-col gap-2">
          <div className="h-4 w-36 rounded bg-[var(--color-border)]" />
          <div className="h-3 w-24 rounded bg-[var(--color-border)]" />
        </div>
      </div>
      <div className="hidden h-4 w-28 rounded bg-[var(--color-border)] xl:block" />
      <div className="hidden h-6 w-20 rounded bg-[var(--color-border)] lg:block" />
      <div className="h-4 w-10 rounded bg-[var(--color-border)]" />
      <div className="h-8 w-8 rounded-lg bg-[var(--color-border)]" />
    </div>
  );
}

export default function LibraryPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialScope: LibraryScope =
    searchParams.get("scope") === "mylibrary" ? "mylibrary" : "catalog";
  const tabParam = searchParams.get("tab");
  const initialTab: LibraryTab =
    initialScope === "mylibrary"
      ? "songs"
      : tabParam === "albums" || tabParam === "artists"
        ? tabParam
        : "songs";
  const [scope, setScope] = useState<LibraryScope>(initialScope);
  // Track queued for the "add to playlist" modal (null = modal closed).
  const [playlistTarget, setPlaylistTarget] = useState<Track | null>(null);
  // Row action menu (three-dots). Fixed-positioned so the table's
  // overflow-hidden doesn't clip it. null = closed.
  const [rowMenu, setRowMenu] = useState<{
    track: Track;
    x: number;
    y: number;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<LibraryTab>(initialTab);
  const [activeGenre, setActiveGenre] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Albums and artists only exist in the shared catalog. Keep this derived so
  // switching scopes cannot leave the page rendering a tab without data.
  const effectiveTab: LibraryTab = scope === "mylibrary" ? "songs" : activeTab;

  useEffect(() => {
    if (!rowMenu) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setRowMenu(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [rowMenu]);

  // Debounce search input by 300 ms
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchInput]);

  const catalogQuery = useInfiniteTracksQuery(
    {
      search: debouncedSearch || undefined,
      genre: activeGenre ?? undefined,
    },
    { enabled: scope === "catalog" },
  );
  const savedQuery = useInfiniteSavedTracksQuery(
    { search: debouncedSearch || undefined },
    { enabled: scope === "mylibrary" },
  );
  const tracksQuery = scope === "catalog" ? catalogQuery : savedQuery;

  const albumsQuery = useAlbumsInfiniteQuery(debouncedSearch, {
    enabled: scope === "catalog" && effectiveTab === "albums",
  });
  const artistsQuery = useArtistsInfiniteQuery(debouncedSearch, {
    enabled: scope === "catalog" && effectiveTab === "artists",
  });
  const genresQuery = useQuery({
    queryKey: ["library", "genres"],
    queryFn: listGenres,
    staleTime: 10 * 60_000,
    gcTime: 15 * 60_000,
    enabled: scope === "catalog" && effectiveTab === "songs",
  });
  const genres = genresQuery.data ?? [];

  // Both catalog and saved-track hooks use the same paginated response.
  // De-dup as a defensive measure in case a catalog row changes between pages.
  const tracks = useMemo(() => {
    const loaded = tracksQuery.data?.pages.flatMap((page) => page.tracks) ?? [];
    const seen = new Set<string>();
    return loaded.filter((track) =>
      seen.has(track.id) ? false : (seen.add(track.id), true),
    );
  }, [tracksQuery.data]);
  const totalTracks = tracksQuery.data?.pages[0]?.total ?? null;
  const albumPages = albumsQuery.data?.pages.map((page) => page.items) ?? [];
  const artistPages = artistsQuery.data?.pages.map((page) => page.items) ?? [];
  const albumTotal = albumsQuery.data?.pages[0]?.total ?? 0;
  const artistTotal = artistsQuery.data?.pages[0]?.total ?? 0;

  // Infinite-scroll sentinel: when it scrolls into view, pull the next page.
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const { fetchNextPage, hasNextPage, isFetchingNextPage } = tracksQuery;
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el || !hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { rootMargin: "600px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, effectiveTab]);

  // Bulk-check which visible tracks are saved so the heart icons paint
  // correctly. In "My Library" everything in the list is implicitly saved,
  // so we skip the round-trip there.
  const visibleTrackIds = useMemo(() => tracks.map((t) => t.id), [tracks]);
  const savedCheckQuery = useSavedCheckQuery(
    scope === "catalog" ? visibleTrackIds : [],
  );
  const savedIdSet = useMemo(() => {
    if (scope === "mylibrary") return new Set(visibleTrackIds);
    return new Set(savedCheckQuery.data ?? []);
  }, [scope, visibleTrackIds, savedCheckQuery.data]);

  // --- Track row click handler ---
  // Pushes the whole filtered list to the player so next/previous work, and
  // jumps directly to the clicked track. Tracks without a remote URL are
  // skipped silently (they wouldn't decode anyway).
  const playTrackList = usePlayerStore((s) => s.playTrackList);
  const addToQueue = usePlayerStore((s) => s.addToQueue);

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

  function handleTrackClick(track: Track) {
    const playable = tracks
      .map(toPlayerTrack)
      .filter((p): p is PlayerTrack => p !== null);
    if (playable.length === 0) return;
    const idx = playable.findIndex((p) => p.id === track.id);
    void playTrackList(playable, Math.max(0, idx));
  }

  return (
    <ClientLayout>
      <section className="min-h-screen w-full px-6 py-6 text-[var(--color-text)]">
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
          {/* --- Top row: scope switcher + import CTA --- */}
          <div className="flex items-center justify-between gap-3">
            <div className="inline-flex rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-1">
              <button
                type="button"
                onClick={() => {
                  setScope("catalog");
                  setSearchParams(
                    (current) => {
                      current.delete("scope");
                      current.set("tab", activeTab);
                      return current;
                    },
                    { replace: true },
                  );
                }}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
                  scope === "catalog"
                    ? "bg-[var(--color-primary)] text-[var(--color-primary-contrast)] shadow"
                    : "text-[var(--color-muted)] hover:text-[var(--color-text)]"
                }`}
              >
                <Globe className="h-3.5 w-3.5" strokeWidth={2.3} />
                {t("library.scope.catalog", { defaultValue: "Catálogo" })}
              </button>
              <button
                type="button"
                onClick={() => {
                  setScope("mylibrary");
                  setActiveTab("songs");
                  setSearchParams({ scope: "mylibrary" }, { replace: true });
                }}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
                  scope === "mylibrary"
                    ? "bg-[var(--color-primary)] text-[var(--color-primary-contrast)] shadow"
                    : "text-[var(--color-muted)] hover:text-[var(--color-text)]"
                }`}
              >
                <Heart
                  className="h-3.5 w-3.5"
                  strokeWidth={2.3}
                  fill={scope === "mylibrary" ? "currentColor" : "none"}
                />
                {t("library.scope.myLibrary", {
                  defaultValue: "Favoritos",
                })}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            {/* --- Header: title + live count + tabs + search + genre chips --- */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-text)]">
                  {t("library.title")}
                </h1>
                {/* The track count reads as a subtitle instead of a separate
                    stat card so the page has a single visual anchor. */}
                {totalTracks !== null ? (
                  <p className="mt-1 text-sm text-[var(--color-muted)]">
                    {scope === "catalog"
                      ? t("library.catalogCount", { count: totalTracks })
                      : t("library.savedCount", { count: totalTracks })}
                  </p>
                ) : null}
                <div className="mt-3 flex items-center gap-5 border-b border-[var(--color-border)] pb-2">
                  {(scope === "catalog"
                    ? tabs
                    : (["songs"] as LibraryTab[])
                  ).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => {
                        setActiveTab(tab);
                        setSearchParams({ tab }, { replace: true });
                      }}
                      className={`relative pb-2 text-sm font-medium transition ${
                        effectiveTab === tab
                          ? "text-[var(--color-primary)]"
                          : "text-[var(--color-muted)] hover:text-[var(--color-text)]"
                      }`}
                    >
                      {t(`library.tabs.${tab}`)}
                      {effectiveTab === tab ? (
                        <span className="absolute inset-x-0 -bottom-[9px] h-0.5 rounded-full bg-[var(--color-primary)]" />
                      ) : null}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search field */}
              <input
                type="search"
                placeholder={t("library.searchPlaceholder")}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full max-w-xs rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-4 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] lg:w-64"
              />
            </div>

            {/* Genre chips — only relevant for Canciones tab in the catalog
                scope, only when the user actually has tracks across distinct
                genres. The saved-tracks endpoint doesn't filter by genre. */}
            {scope === "catalog" &&
              effectiveTab === "songs" &&
              genres.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="mr-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
                    {t("library.genres")}:
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveGenre(null)}
                    className={`rounded-full border px-4 py-1.5 text-sm transition ${
                      activeGenre === null
                        ? "border-[var(--color-primary)] bg-[var(--color-secondary)] text-[var(--color-primary)]"
                        : "border-[var(--color-border)] bg-transparent text-[var(--color-text)] hover:border-[var(--color-primary)]"
                    }`}
                  >
                    {t("library.all")}
                  </button>
                  {genres.map((genre) => (
                    <button
                      key={genre}
                      type="button"
                      onClick={() =>
                        setActiveGenre((current) =>
                          current === genre ? null : genre,
                        )
                      }
                      className={`rounded-full border px-4 py-1.5 text-sm transition ${
                        activeGenre === genre
                          ? "border-[var(--color-primary)] bg-[var(--color-secondary)] text-[var(--color-primary)]"
                          : "border-[var(--color-border)] bg-transparent text-[var(--color-text)] hover:border-[var(--color-primary)]"
                      }`}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              )}

            {/* --- Tab content --- */}
            {effectiveTab === "songs" && (
              <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface-alt)]">
                {/* Table header */}
                <div
                  className={`${ROW_GRID} items-center gap-4 border-b border-[var(--color-border)] px-4 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]`}
                >
                  <span className="hidden md:block">
                    {t("library.table.number")}
                  </span>
                  <span>{t("library.table.title")}</span>
                  <span className="hidden xl:block">
                    {t("library.table.album")}
                  </span>
                  <span className="hidden lg:block">
                    {t("library.table.eqStatus")}
                  </span>
                  <span className="flex items-center gap-2">
                    <Clock3 className="h-3.5 w-3.5" strokeWidth={2.1} />
                  </span>
                  <span />
                  <span />
                </div>

                {/* Loading state */}
                {tracksQuery.isLoading && (
                  <div className="divide-y divide-[var(--color-border)]">
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                  </div>
                )}

                {/* Error state */}
                {tracksQuery.isError && (
                  <div className="flex flex-col items-center gap-4 py-16 text-center">
                    <p className="text-sm text-[var(--color-muted)]">
                      {t("library.loadError")}
                    </p>
                    <button
                      type="button"
                      onClick={() => tracksQuery.refetch()}
                      className="rounded-xl border border-[var(--color-primary)] px-5 py-2 text-sm font-medium text-[var(--color-primary)] transition hover:bg-[var(--color-secondary)]"
                    >
                      {t("library.retry")}
                    </button>
                  </div>
                )}

                {/* Empty state */}
                {tracksQuery.isSuccess && tracks.length === 0 && (
                  <div className="flex flex-col items-center gap-3 py-16 text-center">
                    {scope === "mylibrary" ? (
                      <Heart
                        className="h-10 w-10 text-[var(--color-muted)]"
                        strokeWidth={1.5}
                      />
                    ) : (
                      <Music4
                        className="h-10 w-10 text-[var(--color-muted)]"
                        strokeWidth={1.5}
                      />
                    )}
                    <p className="text-sm text-[var(--color-muted)]">
                      {scope === "mylibrary"
                        ? t("library.savedEmpty", {
                            defaultValue:
                              "Aún no guardaste ninguna canción. Tocá el corazón en el catálogo.",
                          })
                        : t("library.empty")}
                    </p>
                  </div>
                )}

                {/* Track rows */}
                {tracksQuery.isSuccess && tracks.length > 0 && (
                  <div className="divide-y divide-[var(--color-border)]">
                    {tracks.map((track, index) => (
                      <article
                        key={track.id}
                        role="button"
                        tabIndex={0}
                        className={`${ROW_GRID} cursor-pointer items-center gap-4 px-4 py-4 transition hover:bg-[var(--color-surface)] focus-visible:bg-[var(--color-surface)] focus-visible:outline-none`}
                        onClick={() => handleTrackClick(track)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleTrackClick(track);
                          }
                        }}
                      >
                        <span className="hidden text-xs font-semibold text-[var(--color-muted)] md:block">
                          {String(index + 1).padStart(2, "0")}
                        </span>

                        <div className="flex min-w-0 items-center gap-4">
                          {track.coverArt ? (
                            <img
                              src={track.coverArt}
                              alt={track.title}
                              loading="lazy"
                              decoding="async"
                              className="h-14 w-14 flex-none rounded-md object-cover"
                            />
                          ) : (
                            <div className="flex h-14 w-14 flex-none items-center justify-center rounded-md bg-[var(--color-border)]">
                              <Music4
                                className="h-6 w-6 text-[var(--color-muted)]"
                                strokeWidth={1.5}
                              />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h2 className="truncate text-base font-semibold tracking-tight text-[var(--color-text)]">
                                {track.title}
                              </h2>
                              {track.isCatalog ? (
                                <span className="hidden flex-none items-center rounded-full border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[var(--color-primary)] sm:inline-flex">
                                  {t("library.catalogBadge")}
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-1 truncate text-sm text-[var(--color-muted)]">
                              {formatTrackArtist(
                                track.artist,
                                track.featuredArtists,
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="hidden min-w-0 xl:block">
                          <p className="truncate text-base italic text-[var(--color-muted)]">
                            {track.album}
                          </p>
                        </div>

                        <div className="hidden lg:block">
                          {(track.eqSegmentCount ?? 0) > 0 ? (
                            <span className="inline-flex items-center rounded-full border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[var(--color-accent)]">
                              {t("library.eqSegments", {
                                count: track.eqSegmentCount,
                              })}
                            </span>
                          ) : track.hasCustomEq ? (
                            <span className="inline-flex items-center rounded-full border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[var(--color-primary)]">
                              {t("library.eqCustomBadge")}
                            </span>
                          ) : (
                            <span className="text-[var(--color-muted)]">—</span>
                          )}
                        </div>

                        <span
                          className="text-sm text-[var(--color-muted)]"
                          style={{ fontFamily: "var(--font-mono)" }}
                        >
                          {formatDuration(track.durationMs)}
                        </span>

                        <SaveButton
                          trackId={track.id}
                          saved={savedIdSet.has(track.id)}
                        />

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const rect =
                              e.currentTarget.getBoundingClientRect();
                            setRowMenu((cur) =>
                              cur?.track.id === track.id
                                ? null
                                : {
                                    track,
                                    x: rect.right,
                                    y: rect.bottom + 4,
                                  },
                            );
                          }}
                          aria-label={t("library.trackActionsAria", {
                            defaultValue: "Más acciones",
                          })}
                          aria-haspopup="menu"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-muted)] transition hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
                        >
                          <MoreHorizontal
                            className="h-4 w-4"
                            strokeWidth={2.1}
                          />
                        </button>
                      </article>
                    ))}
                  </div>
                )}

                {/* Infinite-scroll sentinel + "loading more" rows. Needs a
                    non-zero height so the IntersectionObserver can detect it
                    even before any skeletons render. A manual button is kept as
                    a fallback (accessibility + environments where the observer
                    doesn't fire). */}
                {tracksQuery.isSuccess && hasNextPage && (
                  <div
                    ref={loadMoreRef}
                    className="min-h-[64px] divide-y divide-[var(--color-border)]"
                  >
                    {isFetchingNextPage ? (
                      <>
                        <SkeletonRow />
                        <SkeletonRow />
                      </>
                    ) : (
                      <div className="flex justify-center py-4">
                        <button
                          type="button"
                          onClick={() => fetchNextPage()}
                          className="rounded-xl border border-[var(--color-border)] px-5 py-2 text-sm font-medium text-[var(--color-muted)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                        >
                          {t("library.loadMore", {
                            defaultValue: "Cargar más",
                          })}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* --- Albums tab --- */}
            {effectiveTab === "albums" && (
              <div>
                {albumsQuery.isLoading && (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={i}
                        className="animate-pulse rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3"
                      >
                        <div className="mb-3 h-36 rounded-lg bg-[var(--color-border)]" />
                        <div className="h-4 w-3/4 rounded bg-[var(--color-border)]" />
                        <div className="mt-2 h-3 w-1/2 rounded bg-[var(--color-border)]" />
                      </div>
                    ))}
                  </div>
                )}

                {albumsQuery.isError && (
                  <div className="flex flex-col items-center gap-4 py-16 text-center">
                    <p className="text-sm text-[var(--color-muted)]">
                      {t("library.loadError")}
                    </p>
                    <button
                      type="button"
                      onClick={() => albumsQuery.refetch()}
                      className="rounded-xl border border-[var(--color-primary)] px-5 py-2 text-sm font-medium text-[var(--color-primary)] transition hover:bg-[var(--color-secondary)]"
                    >
                      {t("library.retry")}
                    </button>
                  </div>
                )}

                {albumsQuery.isSuccess && albumTotal === 0 && (
                  <div className="flex flex-col items-center gap-3 py-16 text-center">
                    <Music4
                      className="h-10 w-10 text-[var(--color-muted)]"
                      strokeWidth={1.5}
                    />
                    <p className="text-sm text-[var(--color-muted)]">
                      {t("library.empty")}
                    </p>
                  </div>
                )}

                {albumsQuery.isSuccess && albumTotal > 0 && (
                  <PagedLibraryCarousel
                    key={`albums-${debouncedSearch}`}
                    pages={albumPages}
                    total={albumTotal}
                    getKey={(album) =>
                      `${album.album}-${album.albumArtist ?? ""}`
                    }
                    hasNextPage={albumsQuery.hasNextPage}
                    isFetchingNextPage={albumsQuery.isFetchingNextPage}
                    fetchNextPage={albumsQuery.fetchNextPage}
                    resetKey={`albums-${debouncedSearch}`}
                    label="Álbumes"
                    renderItem={(album) => (
                      <button
                        type="button"
                        onClick={() => {
                          if (album.albumId)
                            navigate(`/album/${album.albumId}`);
                        }}
                        className="flex h-[276px] min-w-0 flex-col rounded-xl border border-[var(--color-border)] bg-[rgba(18,24,35,0.78)] p-3 text-left shadow-[0_12px_30px_rgba(0,0,0,0.14)] backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-[var(--color-primary)]/50 hover:bg-[rgba(18,24,35,0.9)]"
                        aria-label={
                          album.albumId
                            ? `Abrir álbum ${album.album}`
                            : `Álbum ${album.album} no disponible`
                        }
                      >
                        {album.coverArt ? (
                          <img
                            src={album.coverArt}
                            loading="lazy"
                            decoding="async"
                            alt={album.album}
                            className="mb-3 h-[176px] w-full shrink-0 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="mb-3 flex h-[176px] w-full shrink-0 items-center justify-center rounded-lg bg-[var(--color-border)]">
                            <Music4
                              className="h-8 w-8 text-[var(--color-muted)]"
                              strokeWidth={1.5}
                            />
                          </div>
                        )}
                        <p className="min-h-10 break-words text-sm font-semibold leading-5 text-[var(--color-text)] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                          {album.album}
                        </p>
                        {album.albumArtist && (
                          <p className="mt-1 truncate text-xs text-[var(--color-muted)]">
                            {album.albumArtist}
                          </p>
                        )}
                      </button>
                    )}
                  />
                )}
              </div>
            )}

            {/* --- Artists tab --- */}
            {effectiveTab === "artists" && (
              <div>
                {artistsQuery.isLoading && (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={i}
                        className="animate-pulse rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4"
                      >
                        <div className="h-5 w-3/4 rounded bg-[var(--color-border)]" />
                      </div>
                    ))}
                  </div>
                )}

                {artistsQuery.isError && (
                  <div className="flex flex-col items-center gap-4 py-16 text-center">
                    <p className="text-sm text-[var(--color-muted)]">
                      {t("library.loadError")}
                    </p>
                    <button
                      type="button"
                      onClick={() => artistsQuery.refetch()}
                      className="rounded-xl border border-[var(--color-primary)] px-5 py-2 text-sm font-medium text-[var(--color-primary)] transition hover:bg-[var(--color-secondary)]"
                    >
                      {t("library.retry")}
                    </button>
                  </div>
                )}

                {artistsQuery.isSuccess && artistTotal === 0 && (
                  <div className="flex flex-col items-center gap-3 py-16 text-center">
                    <Music4
                      className="h-10 w-10 text-[var(--color-muted)]"
                      strokeWidth={1.5}
                    />
                    <p className="text-sm text-[var(--color-muted)]">
                      {t("library.empty")}
                    </p>
                  </div>
                )}

                {artistsQuery.isSuccess && artistTotal > 0 && (
                  <PagedLibraryCarousel
                    key={`artists-${debouncedSearch}`}
                    pages={artistPages}
                    total={artistTotal}
                    getKey={(artist) => artist.name}
                    hasNextPage={artistsQuery.hasNextPage}
                    isFetchingNextPage={artistsQuery.isFetchingNextPage}
                    fetchNextPage={artistsQuery.fetchNextPage}
                    resetKey={`artists-${debouncedSearch}`}
                    label="Artistas"
                    showArrowControls={false}
                    renderItem={(artist) => (
                      <ArtistTile
                        name={artist.name}
                        imageUrl={artist.imageUrl}
                        onClick={() =>
                          navigate(
                            `/artist/${encodeURIComponent(artist.name)}`,
                            {
                              state: { fromLibrary: true },
                            },
                          )
                        }
                      />
                    )}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </section>
      {/* Row action menu — fixed-positioned so it escapes the table's
          overflow-hidden. A full-screen backdrop closes it on any outside
          click. */}
      {rowMenu ? (
        <>
          <div
            className="fixed inset-0 z-[60]"
            onClick={() => setRowMenu(null)}
          />
          <div
            role="menu"
            className="fixed z-[61] w-52 -translate-x-full overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
            style={{ left: rowMenu.x, top: rowMenu.y }}
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                const playable = toPlayerTrack(rowMenu.track);
                if (playable) addToQueue(playable);
                setRowMenu(null);
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-[var(--color-text)] transition hover:bg-[var(--color-surface-alt)]"
            >
              <ListPlus className="h-4 w-4" strokeWidth={2.1} />
              {t("library.addToQueue", { defaultValue: "Agregar a la cola" })}
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setPlaylistTarget(rowMenu.track);
                setRowMenu(null);
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-[var(--color-text)] transition hover:bg-[var(--color-surface-alt)]"
            >
              <ListMusic className="h-4 w-4" strokeWidth={2.1} />
              {t("library.addToPlaylistAria", {
                defaultValue: "Agregar a una playlist",
              })}
            </button>
          </div>
        </>
      ) : null}

      <AddToPlaylistModal
        open={playlistTarget !== null}
        onClose={() => setPlaylistTarget(null)}
        trackId={playlistTarget?.id ?? null}
        trackTitle={playlistTarget?.title}
      />
    </ClientLayout>
  );
}
