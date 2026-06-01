import { Clock3, Equal, Music4, MoreHorizontal, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import ClientLayout from "../layout/ClientLayout";
import {
  useTracksQuery,
  useAlbumsQuery,
  useArtistsQuery,
} from "../../shared/hooks/useTracks";
import type { Track } from "../../shared/api/tracks";

type LibraryTab = "Canciones" | "Álbumes" | "Artistas";
const tabs: LibraryTab[] = ["Canciones", "Álbumes", "Artistas"];

type GenreFilter = "Indie" | "Electronic" | "Jazz" | "Rock";
const genres: GenreFilter[] = ["Indie", "Electronic", "Jazz", "Rock"];

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
    <div className="grid grid-cols-[58px_minmax(260px,1.8fr)_minmax(170px,1.1fr)_160px_90px_48px] items-center gap-4 px-4 py-4 animate-pulse">
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
  const [activeTab, setActiveTab] = useState<LibraryTab>("Canciones");
  const [activeGenre, setActiveGenre] = useState<GenreFilter | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const tracksQuery = useTracksQuery({
    search: debouncedSearch || undefined,
    genre: activeGenre ?? undefined,
    take: 100,
  });

  const albumsQuery = useAlbumsQuery();
  const artistsQuery = useArtistsQuery();

  const tracks = tracksQuery.data?.tracks ?? [];
  const albums = albumsQuery.data ?? [];
  const artists = artistsQuery.data ?? [];

  // --- Track row click handler ---
  // TODO: connect to player store (other agent owns playStore)
  function handleTrackClick(track: Track) {
    console.log("play track", track.id);
  }

  return (
    <ClientLayout>
      <section className="min-h-screen w-full bg-[var(--color-page)] px-6 py-6 text-[var(--color-text)]">
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
          {/* --- Stat Cards --- */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            {/* Total canciones — live from API */}
            <article className="flex items-center justify-between rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-5 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
                  Total canciones
                </p>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-[var(--color-text)]">
                  {tracksQuery.data?.total ?? "—"}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-secondary)] text-[var(--color-primary)]">
                <Music4 className="h-5 w-5" strokeWidth={2.2} />
              </div>
            </article>

            {/* EQ aplicados — TODO: replace with count from GET /equalizer/configs or similar endpoint */}
            <article className="flex items-center justify-between rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-5 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
                  EQ aplicados
                </p>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-[var(--color-text)]">
                  412
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-secondary)] text-[var(--color-primary)]">
                <Equal className="h-5 w-5" strokeWidth={2.2} />
              </div>
            </article>

            {/* Segmentos definidos — TODO: replace with count from GET /equalizer/segments or similar endpoint */}
            <article className="flex items-center justify-between rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-5 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
                  Segmentos definidos
                </p>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-[var(--color-text)]">
                  56
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-secondary)] text-[var(--color-primary)]">
                <Sparkles className="h-5 w-5" strokeWidth={2.2} />
              </div>
            </article>
          </div>

          <div className="flex flex-col gap-5">
            {/* --- Header: tabs + search + genre chips --- */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-text)]">
                  Tu Biblioteca
                </h1>
                <div className="mt-3 flex items-center gap-5 border-b border-[var(--color-border)] pb-2">
                  {tabs.map((tab) => (
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
                      {tab}
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
                placeholder="Buscar canciones…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full max-w-xs rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-4 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] lg:w-64"
              />
            </div>

            {/* Genre chips — only relevant for Canciones tab */}
            {activeTab === "Canciones" && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
                  Géneros:
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
                  All
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
            {activeTab === "Canciones" && (
              <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)]">
                {/* Table header */}
                <div className="grid grid-cols-[58px_minmax(260px,1.8fr)_minmax(170px,1.1fr)_160px_90px_48px] items-center gap-4 border-b border-[var(--color-border)] px-4 py-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">
                  <span>#</span>
                  <span>Título</span>
                  <span>Álbum</span>
                  <span>Estado EQ</span>
                  <span className="flex items-center gap-2">
                    <Clock3 className="h-3.5 w-3.5" strokeWidth={2.1} />
                  </span>
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
                      No pudimos cargar tu biblioteca. Intenta de nuevo.
                    </p>
                    <button
                      type="button"
                      onClick={() => tracksQuery.refetch()}
                      className="rounded-xl border border-[var(--color-primary)] px-5 py-2 text-sm font-medium text-[var(--color-primary)] transition hover:bg-[var(--color-secondary)]"
                    >
                      Reintentar
                    </button>
                  </div>
                )}

                {/* Empty state */}
                {tracksQuery.isSuccess && tracks.length === 0 && (
                  <div className="flex flex-col items-center gap-3 py-16 text-center">
                    <Music4
                      className="h-10 w-10 text-[var(--color-muted)]"
                      strokeWidth={1.5}
                    />
                    <p className="text-sm text-[var(--color-muted)]">
                      Tu biblioteca está vacía. Sube tus primeras canciones.
                    </p>
                  </div>
                )}

                {/* Track rows */}
                {tracksQuery.isSuccess && tracks.length > 0 && (
                  <div className="divide-y divide-[var(--color-border)]">
                    {tracks.map((track, index) => (
                      <article
                        key={track.id}
                        className="grid cursor-pointer grid-cols-[58px_minmax(260px,1.8fr)_minmax(170px,1.1fr)_160px_90px_48px] items-center gap-4 px-4 py-4 transition hover:bg-[var(--color-surface)]"
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
                          {/* EQ label placeholder — no eqLabel on Track yet, reserved for future */}
                          <span className="text-[var(--color-muted)]">—</span>
                        </div>

                        <span className="text-sm text-[var(--color-muted)]">
                          {formatMs(track.durationMs)}
                        </span>

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

            {/* --- Álbumes tab --- */}
            {activeTab === "Álbumes" && (
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
                      No pudimos cargar tu biblioteca. Intenta de nuevo.
                    </p>
                    <button
                      type="button"
                      onClick={() => albumsQuery.refetch()}
                      className="rounded-xl border border-[var(--color-primary)] px-5 py-2 text-sm font-medium text-[var(--color-primary)] transition hover:bg-[var(--color-secondary)]"
                    >
                      Reintentar
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
                      Tu biblioteca está vacía. Sube tus primeras canciones.
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

            {/* --- Artistas tab --- */}
            {activeTab === "Artistas" && (
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
                      No pudimos cargar tu biblioteca. Intenta de nuevo.
                    </p>
                    <button
                      type="button"
                      onClick={() => artistsQuery.refetch()}
                      className="rounded-xl border border-[var(--color-primary)] px-5 py-2 text-sm font-medium text-[var(--color-primary)] transition hover:bg-[var(--color-secondary)]"
                    >
                      Reintentar
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
                      Tu biblioteca está vacía. Sube tus primeras canciones.
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
