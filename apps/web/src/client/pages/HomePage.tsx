import {
  ChevronLeft,
  ChevronRight,
  ListPlus,
  Music4,
  Play,
} from "lucide-react";
import { useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import ClientLayout from "../layout/ClientLayout";
import { useArtistsQuery, useTracksQuery } from "../../shared/hooks/useTracks";
import {
  useSavedCheckQuery,
  useLatestSavedCoverQuery,
} from "../../shared/hooks/useLibrarySaves";
import {
  useMostPlayedQuery,
  useRecentlyPlayedQuery,
} from "../../shared/hooks/useAnalytics";
import { listPlaylists, type Playlist } from "../../shared/api/playlists";
import SaveButton from "../../shared/ui/SaveButton";
import HeroFeatured from "../features/home/HeroFeatured";
import { usePlayerStore, type PlayerTrack } from "../stores/playStore";
import type { Track } from "../../shared/api/tracks";

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

/**
 * Horizontally scrollable carousel with ‹ › buttons that snap to card width.
 * Children render inside a flex row; the wrapper handles overflow + scroll.
 */
function Carousel({
  title,
  children,
  onSeeAll,
}: {
  title: string;
  children: React.ReactNode;
  onSeeAll?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  function scrollBy(dir: 1 | -1) {
    const el = ref.current;
    if (!el) return;
    const step = Math.max(el.clientWidth * 0.7, 320);
    el.scrollBy({ left: step * dir, behavior: "smooth" });
  }

  return (
    <section className="flex flex-col gap-3">
      <header className="flex items-end justify-between gap-3 px-1">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--color-text)]">
            {title}
          </h2>
          {onSeeAll ? (
            <button
              type="button"
              onClick={onSeeAll}
              className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)] transition hover:text-[var(--color-primary)]"
            >
              {t("home.seeAll", { defaultValue: "Ver todo" })}
            </button>
          ) : null}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            aria-label={t("home.scrollLeft", {
              defaultValue: "Anterior",
            })}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-text)]"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2.2} />
          </button>
          <button
            type="button"
            onClick={() => scrollBy(1)}
            aria-label={t("home.scrollRight", {
              defaultValue: "Siguiente",
            })}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-text)]"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={2.2} />
          </button>
        </div>
      </header>
      <div
        ref={ref}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-2"
        style={{ scrollbarWidth: "none" }}
      >
        {children}
      </div>
    </section>
  );
}

function TrackCard({
  track,
  saved,
  onPlay,
  onAddToQueue,
}: {
  track: Track;
  saved: boolean;
  onPlay: () => void;
  onAddToQueue?: () => void;
}) {
  return (
    <article
      className="group relative w-44 shrink-0 snap-start cursor-pointer rounded-xl bg-[var(--color-surface)] p-3 transition hover:bg-[var(--color-surface-alt)]"
      onClick={onPlay}
    >
      <div className="relative aspect-square overflow-hidden rounded-lg bg-[var(--color-surface-alt)]">
        {track.coverArt ? (
          <img
            src={track.coverArt}
            alt={track.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Music4
              className="h-10 w-10 text-[var(--color-muted)]"
              strokeWidth={1.4}
            />
          </div>
        )}
        {/* Cluster of hover-revealed actions in the cover corner. */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1.5 opacity-0 transition-all duration-200 group-hover:opacity-100">
          {onAddToQueue ? (
            <button
              type="button"
              aria-label="Agregar a la cola"
              title="Agregar a la cola"
              onClick={(e) => {
                e.stopPropagation();
                onAddToQueue();
              }}
              className="inline-flex h-10 w-10 translate-y-2 items-center justify-center rounded-full bg-black/55 text-white shadow-[0_8px_18px_rgba(0,0,0,0.35)] backdrop-blur transition-all duration-200 hover:scale-105 hover:bg-black/75 group-hover:translate-y-0"
            >
              <ListPlus className="h-4 w-4" strokeWidth={2.4} />
            </button>
          ) : null}
          <button
            type="button"
            aria-label="Reproducir"
            onClick={(e) => {
              e.stopPropagation();
              onPlay();
            }}
            className="inline-flex h-10 w-10 translate-y-2 items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-primary-contrast)] shadow-[0_8px_18px_rgba(0,0,0,0.35)] transition-all duration-200 hover:scale-105 group-hover:translate-y-0"
          >
            <Play className="h-4 w-4" strokeWidth={2.4} fill="currentColor" />
          </button>
        </div>
      </div>
      <div className="mt-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-[var(--color-text)]">
            {track.title}
          </p>
          <p className="truncate text-xs text-[var(--color-muted)]">
            {track.artist}
          </p>
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          <SaveButton trackId={track.id} saved={saved} />
        </div>
      </div>
    </article>
  );
}

function ArtistAvatar({
  name,
  onClick,
}: {
  name: string;
  onClick: () => void;
}) {
  // Deterministic gradient per artist so each avatar feels distinct without
  // needing real photos. Hash the name → pick a hue.
  const hue = useMemo(() => {
    let h = 0;
    for (let i = 0; i < name.length; i++)
      h = (h * 31 + name.charCodeAt(i)) % 360;
    return h;
  }, [name]);
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-28 shrink-0 snap-start flex-col items-center gap-2"
    >
      <div
        className="flex h-24 w-24 items-center justify-center rounded-full text-lg font-bold text-white shadow-[0_8px_18px_rgba(0,0,0,0.35)] transition group-hover:scale-105"
        style={{
          background: `linear-gradient(135deg, hsl(${hue} 70% 50%) 0%, hsl(${(hue + 40) % 360} 65% 35%) 100%)`,
        }}
      >
        {initials || "?"}
      </div>
      <p className="w-full truncate text-center text-xs font-semibold text-[var(--color-text)] group-hover:text-[var(--color-primary)]">
        {name}
      </p>
    </button>
  );
}

export default function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const playTrackList = usePlayerStore((s) => s.playTrackList);
  const addToQueue = usePlayerStore((s) => s.addToQueue);

  const tracksQ = useTracksQuery({ take: 20 });
  const artistsQ = useArtistsQuery();
  const heroCoverQ = useLatestSavedCoverQuery();
  const recentlyPlayedQ = useRecentlyPlayedQuery(12);
  const mostPlayedQ = useMostPlayedQuery(12);
  const recentlyPlayed = recentlyPlayedQ.data ?? [];
  const mostPlayed = mostPlayedQ.data ?? [];
  // Used by the playlist hero variant. Cheap query, dedup'd by react-query
  // with the sidebar's listPlaylists call.
  const playlistsQ = useQuery({
    queryKey: ["playlists"],
    queryFn: listPlaylists,
    staleTime: 30_000,
  });
  const featuredPlaylist = useMemo<Playlist | null>(() => {
    const list = playlistsQ.data ?? [];
    if (list.length === 0) return null;
    // Prefer a playlist with a cover, fall back to first.
    return list.find((p) => p.coverArt) ?? list[0];
  }, [playlistsQ.data]);

  const tracks = tracksQ.data?.tracks ?? [];
  const artists = (artistsQ.data ?? []).slice(0, 12);
  const visibleIds = useMemo(() => tracks.map((tr) => tr.id), [tracks]);
  const savedCheckQ = useSavedCheckQuery(visibleIds);
  const savedSet = useMemo(
    () => new Set(savedCheckQ.data ?? []),
    [savedCheckQ.data],
  );

  // Pick a hero track: the most-recently-saved if any, else the first catalog
  // track with a cover, else just the first one.
  const heroTrack = useMemo<Track | null>(() => {
    if (tracks.length === 0) return null;
    if (heroCoverQ.data?.trackId) {
      const found = tracks.find((tr) => tr.id === heroCoverQ.data?.trackId);
      if (found) return found;
    }
    const withCover = tracks.find((tr) => tr.coverArt);
    return withCover ?? tracks[0];
  }, [tracks, heroCoverQ.data]);

  // Play a track within the context of its list, so the queue holds the whole
  // carousel and the prev/next arrows have somewhere to go.
  function playFromList(list: Track[], track: Track) {
    const playable = list
      .map(toPlayerTrack)
      .filter((p): p is PlayerTrack => p !== null);
    if (playable.length === 0) return;
    const idx = playable.findIndex((p) => p.id === track.id);
    void playTrackList(playable, Math.max(0, idx));
  }

  function playAll() {
    const playable = tracks
      .map(toPlayerTrack)
      .filter((p): p is PlayerTrack => p !== null);
    if (playable.length > 0) void playTrackList(playable, 0);
  }

  return (
    <ClientLayout>
      <section className="min-h-screen w-full bg-[var(--color-page)] text-[var(--color-text)]">
        <HeroFeatured
          heroTrack={heroTrack}
          featuredPlaylist={featuredPlaylist}
          saved={heroTrack ? savedSet.has(heroTrack.id) : false}
          toPlayerTrack={toPlayerTrack}
        />

        <div className="mx-auto flex max-w-7xl flex-col gap-10 px-8 py-10">
          {/* Recently played — only once the user has listening history. */}
          {recentlyPlayed.length > 0 ? (
            <Carousel
              title={t("home.recentlyPlayed", {
                defaultValue: "Reproducidas recientemente",
              })}
            >
              {recentlyPlayed.map((track) => (
                <TrackCard
                  key={track.id}
                  track={track}
                  saved={savedSet.has(track.id)}
                  onPlay={() => playFromList(recentlyPlayed, track)}
                  onAddToQueue={() => {
                    const playable = toPlayerTrack(track);
                    if (playable) addToQueue(playable);
                  }}
                />
              ))}
            </Carousel>
          ) : null}

          {/* Most played */}
          {mostPlayed.length > 0 ? (
            <Carousel
              title={t("home.mostPlayed", {
                defaultValue: "Más escuchadas",
              })}
            >
              {mostPlayed.map((track) => (
                <TrackCard
                  key={track.id}
                  track={track}
                  saved={savedSet.has(track.id)}
                  onPlay={() => playFromList(mostPlayed, track)}
                  onAddToQueue={() => {
                    const playable = toPlayerTrack(track);
                    if (playable) addToQueue(playable);
                  }}
                />
              ))}
            </Carousel>
          ) : null}

          {/* Popular Songs carousel */}
          <Carousel
            title={t("home.popularSongs", {
              defaultValue: "Top del catálogo",
            })}
            onSeeAll={() => navigate("/library")}
          >
            {tracksQ.isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-44 shrink-0 animate-pulse rounded-xl bg-[var(--color-surface)] p-3"
                  >
                    <div className="aspect-square rounded-lg bg-[var(--color-surface-alt)]" />
                    <div className="mt-3 h-3 w-3/4 rounded bg-[var(--color-surface-alt)]" />
                    <div className="mt-2 h-3 w-1/2 rounded bg-[var(--color-surface-alt)]" />
                  </div>
                ))
              : tracks.slice(0, 12).map((track) => (
                  <TrackCard
                    key={track.id}
                    track={track}
                    saved={savedSet.has(track.id)}
                    onPlay={() => playFromList(tracks.slice(0, 12), track)}
                    onAddToQueue={() => {
                      const playable = toPlayerTrack(track);
                      if (playable) addToQueue(playable);
                    }}
                  />
                ))}
            {tracksQ.isSuccess && tracks.length > 1 ? (
              <button
                type="button"
                onClick={playAll}
                className="flex h-full min-h-[200px] w-44 shrink-0 snap-start flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--color-primary)]/40 bg-transparent text-[var(--color-primary)] transition hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5"
              >
                <Play className="h-6 w-6" fill="currentColor" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  {t("home.playAll", { defaultValue: "Reproducir todo" })}
                </span>
              </button>
            ) : null}
          </Carousel>

          {/* Popular Artists carousel */}
          <Carousel
            title={t("home.popularArtists", {
              defaultValue: "Artistas populares",
            })}
            onSeeAll={() => navigate("/library")}
          >
            {artistsQ.isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex w-28 shrink-0 animate-pulse flex-col items-center gap-2"
                  >
                    <div className="h-24 w-24 rounded-full bg-[var(--color-surface)]" />
                    <div className="h-3 w-16 rounded bg-[var(--color-surface)]" />
                  </div>
                ))
              : artists.map((artist) => (
                  <ArtistAvatar
                    key={artist}
                    name={artist}
                    onClick={() =>
                      navigate(`/artist/${encodeURIComponent(artist)}`)
                    }
                  />
                ))}
          </Carousel>

          {artistsQ.isSuccess && artists.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-8 text-center">
              <p className="text-sm text-[var(--color-muted)]">
                {t("home.empty", {
                  defaultValue:
                    "Tu catálogo todavía está vacío. Importá tus primeras canciones para empezar.",
                })}
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </ClientLayout>
  );
}
