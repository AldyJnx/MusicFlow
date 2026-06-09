import { Clock3, Globe, Heart, Music4, MoreHorizontal } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import ClientLayout from "../layout/ClientLayout";
import {
  useTracksQuery,
  useAlbumsQuery,
  useArtistsQuery,
} from "../../shared/hooks/useTracks";
import {
  useSavedCheckQuery,
  useSavedTracksQuery,
} from "../../shared/hooks/useLibrarySaves";
import { listGenres, type Track } from "../../shared/api/tracks";
import { usePlayerStore, type PlayerTrack } from "../stores/playStore";
import SaveButton from "../../shared/ui/SaveButton";

type LibraryScope = "catalog" | "mylibrary";
type LibraryTab = "songs" | "albums" | "artists";
const tabs: LibraryTab[] = ["songs", "albums", "artists"];

/** Convert milliseconds to M:SS display string */
function formatMs(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

// --- Skeleton row for loading state ---
function SkeletonRow() {
  return (
    <div className="grid grid-cols-[58px_minmax(260px,1.8fr)_minmax(170px,1.1fr)_160px_90px_48px_48px] items-center gap-4 px-4 py-4 animate-pulse">
      <div className="h-4 w-6 rounded bg-[var(--color-border)]" />
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-md bg-[var(--color-border)]" />
        <div className="flex flex-col gap-2">
          <div className="h-4 w-36 rounded bg-[var(--color-border)]" />
          <div className="h-3 w-24 rounded bg-[var(--color-border)]" />
        </div>
      </div>
      <div className="h-4 w-28 rounded bg-[var(--color-border)]" />
      <div className="h-6 w-20 rounded bg-[var(--color-border)]" />
      <div className="h-4 w-10 rounded bg-[var(--color-border)]" />
      <div className="h-8 w-8 rounded-lg bg-[var(--color-border)]" />
    </div>
  );
}

export default function LibraryPage() {
  const { t } = useTranslation();
  const [scope, setScope] = useState<LibraryScope>("catalog");
  const [activeTab, setActiveTab] = useState<LibraryTab>("songs");
  const [activeGenre, setActiveGenre] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Albums/artists only make sense in the catalog scope. Reset to songs when
  // switching to "My Library" — that view is a flat saved-tracks list.
  useEffect(() => {
    if (scope === "mylibrary" && activeTab !== "songs") {
      setActiveTab("songs");
    }
  }, [scope, activeTab]);

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

  const catalogQuery = useTracksQuery({
    search: debouncedSearch || undefined,
    genre: activeGenre ?? undefined,
    take: 100,
  });
  const savedQuery = useSavedTracksQuery({
    search: debouncedSearch || undefined,
    take: 100,
  });
  const tracksQuery = scope === "catalog" ? catalogQuery : savedQuery;

  const albumsQuery = useAlbumsQuery();
  const artistsQuery = useArtistsQuery();
  const genresQuery = useQuery({
    queryKey: ["library", "genres"],
    queryFn: listGenres,
    staleTime: 60_000,
  });
  const genres = genresQuery.data ?? [];

  const tracks = tracksQuery.data?.tracks ?? [];
  const albums = albumsQuery.data ?? [];
  const artists = artistsQuery.data ?? [];

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

  function handleTrackClick(track: Track) {
    const playable = (tracksQuery.data?.tracks ?? [])
      .map(toPlayerTrack)
      .filter((p): p is PlayerTrack => p !== null);
    if (playable.length === 0) return;
    const idx = playable.findIndex((p) => p.id === track.id);
    void playTrackList(playable, Math.max(0, idx));
  }

  return (
    <ClientLayout>
      <section className="min-h-screen w-full bg-[var(--color-page)] px-6 py-6 text-[var(--color-text)]">
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
          {/* --- Scope switcher: Catálogo vs Mi biblioteca --- */}
          <div className="inline-flex self-start rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-1">
            <button
              type="button"
              onClick={() => setScope("catalog")}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
                scope === "catalog"
                  ? "bg-[var(--color-primary)] text-[var(--color-primary-contrast,#0b0b0b)] shadow"
                  : "text-[var(--color-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              <Globe className="h-3.5 w-3.5" strokeWidth={2.3} />
              {t("library.scope.catalog", { defaultValue: "Catálogo" })}
            </button>
            <button
              type="button"
              onClick={() => setScope("mylibrary")}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
                scope === "mylibrary"
                  ? "bg-[var(--color-primary)] text-[var(--color-primary-contrast,#0b0b0b)] shadow"
                  : "text-[var(--color-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              <Heart
                className="h-3.5 w-3.5"
                strokeWidth={2.3}
                fill={scope === "mylibrary" ? "currentColor" : "none"}
              />
              {t("library.scope.myLibrary", {
                defaultValue: "Mi biblioteca",
              })}
            </button>
          </div>

          {/* --- Stat card: total tracks (live from API) --- */}
          <article className="flex items-center justify-between rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-5 py-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
                {scope === "catalog"
                  ? t("library.totalTracks")
                  : t("library.savedTracks", {
                      defaultValue: "TUS CANCIONES GUARDADAS",
                    })}
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-[var(--color-text)]">
                {tracksQuery.data?.total ?? "—"}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-secondary)] text-[var(--color-primary)]">
              {scope === "catalog" ? (
                <Music4 className="h-5 w-5" strokeWidth={2.2} />
              ) : (
                <Heart
                  className="h-5 w-5"
                  strokeWidth={2.2}
                  fill="currentColor"
                />
              )}
            </div>
          </article>

          <div className="flex flex-col gap-5">
            {/* --- Header: tabs + search + genre chips --- */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-text)]">
                  {t("library.title")}
                </h1>
                <div className="mt-3 flex items-center gap-5 border-b border-[var(--color-border)] pb-2">
                  {(scope === "catalog"
                    ? tabs
                    : (["songs"] as LibraryTab[])
                  ).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`relative pb-2 text-sm font-medium transition ${
                        activeTab === tab
                          ? "text-[var(--color-primary)]"
                          : "text-[var(--color-muted)] hover:text-[var(--color-text)]"
                      }`}
                    >
                      {t(`library.tabs.${tab}`)}
                      {activeTab === tab ? (
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
              activeTab === "songs" &&
              genres.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="mr-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
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
            {activeTab === "songs" && (
              <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)]">
                {/* Table header */}
                <div className="grid grid-cols-[58px_minmax(260px,1.8fr)_minmax(170px,1.1fr)_160px_90px_48px_48px] items-center gap-4 border-b border-[var(--color-border)] px-4 py-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">
                  <span>{t("library.table.number")}</span>
                  <span>{t("library.table.title")}</span>
                  <span>{t("library.table.album")}</span>
                  <span>{t("library.table.eqStatus")}</span>
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
                        className="grid cursor-pointer grid-cols-[58px_minmax(260px,1.8fr)_minmax(170px,1.1fr)_160px_90px_48px_48px] items-center gap-4 px-4 py-4 transition hover:bg-[var(--color-surface)]"
                        onClick={() => handleTrackClick(track)}
                      >
                        <span className="text-xs font-semibold text-[var(--color-muted)]">
                          {String(index + 1).padStart(2, "0")}
                        </span>

                        <div className="flex items-center gap-4">
                          {track.coverArt ? (
                            <img
                              src={track.coverArt}
                              alt={track.title}
                              className="h-14 w-14 rounded-md object-cover"
                            />
                          ) : (
                            <div className="flex h-14 w-14 items-center justify-center rounded-md bg-[var(--color-border)]">
                              <Music4
                                className="h-6 w-6 text-[var(--color-muted)]"
                                strokeWidth={1.5}
                              />
                            </div>
                          )}
                          <div>
                            <h2 className="text-base font-semibold tracking-tight text-[var(--color-text)]">
                              {track.title}
                            </h2>
                            <p className="mt-1 text-sm text-[var(--color-muted)]">
                              {track.artist}
                            </p>
                          </div>
                        </div>

                        <div>
                          <p className="text-base italic text-[var(--color-muted)]">
                            {track.album}
                          </p>
                        </div>

                        <div>
                          {track.isCatalog ? (
                            <span className="inline-flex items-center rounded-full border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-primary)]">
                              {t("library.catalogBadge")}
                            </span>
                          ) : (
                            <span className="text-[var(--color-muted)]">—</span>
                          )}
                        </div>

                        <span className="text-sm text-[var(--color-muted)]">
                          {formatMs(track.durationMs)}
                        </span>

                        <SaveButton
                          trackId={track.id}
                          saved={savedIdSet.has(track.id)}
                        />

                        <button
                          type="button"
                          onClick={(e) => e.stopPropagation()}
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
              </div>
            )}

            {/* --- Albums tab --- */}
            {activeTab === "albums" && (
              <div>
                {albumsQuery.isLoading && (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div
                        key={i}
                        className="animate-pulse rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3"
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

                {albumsQuery.isSuccess && albums.length === 0 && (
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

                {albumsQuery.isSuccess && albums.length > 0 && (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {albums.map((album) => (
                      <article
                        key={album.album}
                        className="cursor-pointer rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3 transition hover:bg-[var(--color-surface)]"
                      >
                        {album.coverArt ? (
                          <img
                            src={album.coverArt}
                            alt={album.album}
                            className="mb-3 h-36 w-full rounded-lg object-cover"
                          />
                        ) : (
                          <div className="mb-3 flex h-36 w-full items-center justify-center rounded-lg bg-[var(--color-border)]">
                            <Music4
                              className="h-8 w-8 text-[var(--color-muted)]"
                              strokeWidth={1.5}
                            />
                          </div>
                        )}
                        <p className="truncate text-sm font-semibold text-[var(--color-text)]">
                          {album.album}
                        </p>
                        {album.albumArtist && (
                          <p className="mt-1 truncate text-xs text-[var(--color-muted)]">
                            {album.albumArtist}
                          </p>
                        )}
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* --- Artists tab --- */}
            {activeTab === "artists" && (
              <div>
                {artistsQuery.isLoading && (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div
                        key={i}
                        className="animate-pulse rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4"
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

                {artistsQuery.isSuccess && artists.length === 0 && (
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

                {artistsQuery.isSuccess && artists.length > 0 && (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                    {artists.map((artist) => (
                      <article
                        key={artist}
                        className="cursor-pointer rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-4 py-5 text-center transition hover:bg-[var(--color-surface)]"
                      >
                        <p className="truncate text-sm font-semibold text-[var(--color-text)]">
                          {artist}
                        </p>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </ClientLayout>
  );
}
