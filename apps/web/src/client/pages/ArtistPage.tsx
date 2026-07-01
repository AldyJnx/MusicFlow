import {
  ArrowLeft,
  Disc3,
  Eye,
  ListMusic,
  ListPlus,
  MoreHorizontal,
  Play,
  Sliders,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import type { TFunction } from "i18next";

import ClientLayout from "../layout/ClientLayout";
import { useTracksQuery } from "../../shared/hooks/useTracks";
import {
  getCatalogArtist,
  listCatalogArtists,
  type CatalogAlbumSummary,
  type CatalogTrackCard,
} from "../../shared/api/catalog";
import TrackRow from "../../shared/ui/TrackRow";
import AnimatedList from "../../shared/ui/reactbits/AnimatedList";
import SplitText from "../../shared/ui/reactbits/SplitText";
import { useSavedCheckQuery } from "../../shared/hooks/useLibrarySaves";
import { usePremiumGate } from "../../shared/hooks/usePremiumGate";
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

/** Total album length as "1 h 12 min" / "38 min". */
function formatTotal(ms: number): string {
  const min = Math.round(ms / 60000);
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)} h ${min % 60} min`;
}

/**
 * Dedicated artist view inspired by the mock's `arjit.html`. Shows a
 * gradient avatar + name + track count, a "Reproducir todo" CTA, and the
 * artist's full track list rendered as a dense numbered table. Follows the
 * same CTA hierarchy as HeroFeatured (solid primary / outline primary /
 * outline accent).
 */
export default function ArtistPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = useParams<{ name: string }>();
  const artistName = decodeURIComponent(params.name ?? "");
  const playTrack = usePlayerStore((s) => s.playTrack);
  const playTrackList = usePlayerStore((s) => s.playTrackList);
  const addToQueue = usePlayerStore((s) => s.addToQueue);
  const openEqDrawer = usePlayerStore((s) => s.openEqDrawer);
  const openAiPrompt = usePlayerStore((s) => s.openAiPrompt);
  const currentTrackId = usePlayerStore((s) => s.currentTrack?.id ?? null);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const { guard } = usePremiumGate();

  const tracksQ = useTracksQuery({ artist: artistName, take: 100 });
  const tracks = tracksQ.data?.tracks ?? [];

  // Resolve the catalog artist (by name) to surface admin-curated albums.
  const catalogArtistsQ = useQuery({
    queryKey: ["catalog", "artists"],
    queryFn: listCatalogArtists,
    staleTime: 60_000,
  });
  const catalogArtistId = useMemo(
    () =>
      (catalogArtistsQ.data ?? []).find((a) => a.name === artistName)?.id ??
      null,
    [catalogArtistsQ.data, artistName],
  );
  const catalogArtistQ = useQuery({
    queryKey: ["catalog", "artist", catalogArtistId],
    queryFn: () => getCatalogArtist(catalogArtistId as string),
    enabled: !!catalogArtistId,
  });
  const albums = catalogArtistQ.data?.albums ?? [];

  // Map album title → id so a track's album label can link to its album page
  // (the Track shape only carries the album name, not its id).
  const albumIdByTitle = useMemo(() => {
    const m = new Map<string, string>();
    for (const al of albums) if (al.title) m.set(al.title, al.id);
    return m;
  }, [albums]);

  // Group the artist's catalog tracks by album so each card can show the real
  // total duration and play the whole album.
  const albumTracks = useMemo(() => {
    const m = new Map<string, CatalogTrackCard[]>();
    for (const tr of catalogArtistQ.data?.tracks ?? []) {
      if (!tr.albumId) continue;
      const list = m.get(tr.albumId) ?? [];
      list.push(tr);
      m.set(tr.albumId, list);
    }
    for (const list of m.values())
      list.sort((a, b) => (a.albumOrder ?? 0) - (b.albumOrder ?? 0));
    return m;
  }, [catalogArtistQ.data]);

  function albumPlayable(albumId: string): PlayerTrack[] {
    return (albumTracks.get(albumId) ?? [])
      .map((c): PlayerTrack | null =>
        c.fileUrlRemote
          ? {
              id: c.id,
              title: c.title,
              artist: c.artist,
              cover: c.coverArt,
              url: c.fileUrlRemote,
              durationMs: c.durationMs,
            }
          : null,
      )
      .filter((p): p is PlayerTrack => p !== null);
  }

  function playAlbum(albumId: string) {
    const list = albumPlayable(albumId);
    if (list.length > 0) void playTrackList(list, 0);
  }

  function queueAlbum(albumId: string) {
    for (const track of albumPlayable(albumId)) addToQueue(track);
  }

  const visibleIds = useMemo(() => tracks.map((tr) => tr.id), [tracks]);
  const savedCheckQ = useSavedCheckQuery(visibleIds);
  const savedSet = useMemo(
    () => new Set(savedCheckQ.data ?? []),
    [savedCheckQ.data],
  );

  // Prefer the real artist photo; fall back to the first track's cover, then
  // a generated gradient.
  const artistImage = tracks.find((tr) => tr.artistImage)?.artistImage ?? null;
  const heroCover =
    artistImage ?? tracks.find((tr) => tr.coverArt)?.coverArt ?? null;
  const hue = useMemo(() => {
    let h = 0;
    for (let i = 0; i < artistName.length; i++) {
      h = (h * 31 + artistName.charCodeAt(i)) % 360;
    }
    return h;
  }, [artistName]);
  const initials = artistName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  function playOne(track: Track) {
    const playable = toPlayerTrack(track);
    if (playable) void playTrack(playable);
  }

  function playAll(startIndex = 0) {
    const playable = tracks
      .map(toPlayerTrack)
      .filter((p): p is PlayerTrack => p !== null);
    if (playable.length > 0) void playTrackList(playable, startIndex);
  }

  if (!artistName) {
    return (
      <ClientLayout>
        <div className="px-8 py-12">
          <p className="text-[var(--color-muted)]">
            {t("artist.missing", { defaultValue: "Artista no especificado." })}
          </p>
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <section className="min-h-screen w-full text-[var(--color-text)]">
        {/* Hero — artist art + name + CTAs */}
        <header className="relative h-[320px] w-full overflow-hidden">
          {heroCover ? (
            <>
              <img
                src={heroCover}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-page)]/40 via-[var(--color-page)]/70 to-[var(--color-page)]" />
            </>
          ) : (
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(135deg, hsl(${hue} 70% 35%) 0%, var(--color-page) 70%)`,
              }}
            />
          )}

          <div className="relative flex h-full flex-col justify-end gap-4 px-8 pb-8 pt-16">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[var(--color-surface)]/70 px-3 py-1.5 text-xs font-semibold text-[var(--color-muted)] backdrop-blur transition hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
            >
              <ArrowLeft className="h-3 w-3" strokeWidth={2.4} />
              {t("artist.back", { defaultValue: "Volver" })}
            </button>

            <div className="flex items-end gap-5">
              <div
                className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full text-2xl font-bold text-white shadow-[0_14px_30px_rgba(0,0,0,0.4)] ring-2 ring-[var(--color-line)]"
                style={
                  artistImage
                    ? undefined
                    : {
                        background: `linear-gradient(135deg, hsl(${hue} 70% 50%) 0%, hsl(${(hue + 40) % 360} 65% 35%) 100%)`,
                      }
                }
              >
                {artistImage ? (
                  <img
                    src={artistImage}
                    alt={artistName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initials || "?"
                )}
              </div>
              <div className="flex min-w-0 flex-col gap-1">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-primary)]">
                  {t("artist.eyebrow", { defaultValue: "Artista" })}
                </p>
                <h1 className="text-5xl font-extrabold leading-tight tracking-tight text-[var(--color-text)] sm:text-6xl">
                  <SplitText text={artistName} />
                </h1>
                <p className="text-sm text-[var(--color-muted)]">
                  {t("artist.trackCount", {
                    defaultValue: "{{count}} canciones",
                    count: tracks.length,
                  })}
                </p>
              </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-3">
              {/* Solid primary — dominant action. */}
              <button
                type="button"
                onClick={() => playAll(0)}
                disabled={tracks.length === 0}
                className="inline-flex items-center gap-2.5 rounded-full bg-[var(--color-primary)] px-8 py-3.5 text-base font-bold uppercase tracking-wider text-[var(--color-primary-contrast)] shadow-[0_10px_24px_rgba(0,0,0,0.35)] transition hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Play
                  className="h-5 w-5"
                  strokeWidth={2.4}
                  fill="currentColor"
                />
                {t("artist.playAll", { defaultValue: "Reproducir todo" })}
              </button>
              {/* Outline primary — secondary config action. */}
              <button
                type="button"
                onClick={openEqDrawer}
                className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--color-primary)] bg-transparent px-5 py-3 text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] transition hover:bg-[var(--color-primary)]/10"
              >
                <Sliders className="h-3.5 w-3.5" strokeWidth={2.5} />
                {t("home.editEq", { defaultValue: "Editar EQ" })}
              </button>
              {/* Outline accent — IA action. */}
              <button
                type="button"
                onClick={() => guard("ai", openAiPrompt)}
                className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--color-accent)] bg-transparent px-5 py-3 text-xs font-bold uppercase tracking-wider text-[var(--color-accent)] transition hover:bg-[var(--color-accent)]/10"
              >
                <Sparkles className="h-3.5 w-3.5" strokeWidth={2.5} />
                {t("home.aiSuggest", { defaultValue: "IA sugiere" })}
              </button>
            </div>
          </div>
        </header>

        {/* Albums (admin-curated) */}
        {albums.length > 0 ? (
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-8 pt-10">
            <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--color-muted)]">
              {t("artist.albums", { defaultValue: "Álbumes" })}
            </h2>
            <div className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(190px,1fr))]">
              {albums.map((al) => {
                const list = albumTracks.get(al.id) ?? [];
                const dur = list.reduce((s, c) => s + c.durationMs, 0);
                const playable = list.some((c) => c.fileUrlRemote);
                return (
                  <AlbumCard
                    key={al.id}
                    album={al}
                    durationMs={dur}
                    playable={playable}
                    t={t}
                    onOpen={() => navigate(`/album/${al.id}`)}
                    onPlay={() => playAlbum(al.id)}
                    onQueue={() => queueAlbum(al.id)}
                  />
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Tracks list */}
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-8 py-10">
          <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--color-muted)]">
            {t("artist.songs", { defaultValue: "Canciones" })}
          </h2>

          {tracksQ.isLoading ? (
            <ul className="flex flex-col gap-1">
              {Array.from({ length: 8 }).map((_, i) => (
                <li
                  key={i}
                  className="flex animate-pulse items-center gap-4 rounded-lg bg-[var(--color-surface)] p-3"
                >
                  <div className="h-4 w-6 rounded bg-[var(--color-surface-alt)]" />
                  <div className="h-10 w-10 rounded bg-[var(--color-surface-alt)]" />
                  <div className="h-3 flex-1 rounded bg-[var(--color-surface-alt)]" />
                </li>
              ))}
            </ul>
          ) : tracks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-10 text-center">
              <ListMusic
                className="mx-auto mb-2 h-8 w-8 text-[var(--color-muted)]"
                strokeWidth={1.4}
              />
              <p className="text-sm text-[var(--color-muted)]">
                {t("artist.empty", {
                  defaultValue:
                    "Este artista todavía no tiene canciones en el catálogo.",
                })}
              </p>
            </div>
          ) : (
            <AnimatedList className="flex flex-col gap-1.5">
              {tracks.map((track, idx) => {
                const albumId = track.album
                  ? albumIdByTitle.get(track.album)
                  : undefined;
                return (
                  <TrackRow
                    key={track.id}
                    number={String(idx + 1).padStart(2, "0")}
                    title={track.title}
                    subtitle={
                      track.album ||
                      t("artist.singleSentinel", { defaultValue: "Single" })
                    }
                    cover={track.coverArt}
                    durationMs={track.durationMs}
                    active={currentTrackId === track.id}
                    playing={currentTrackId === track.id && isPlaying}
                    saved={savedSet.has(track.id)}
                    trackId={track.id}
                    vinyl
                    onPlay={() => playOne(track)}
                    onSubtitleClick={
                      albumId ? () => navigate(`/album/${albumId}`) : undefined
                    }
                  />
                );
              })}
            </AnimatedList>
          )}
        </div>
      </section>
    </ClientLayout>
  );
}

/**
 * Rich album card with a hover play button and a "⋯" options menu
 * (reproducir / añadir a la cola / ver álbum). The menu closes on outside
 * click or Escape.
 */
function AlbumCard({
  album,
  durationMs,
  playable,
  t,
  onOpen,
  onPlay,
  onQueue,
}: {
  album: CatalogAlbumSummary;
  durationMs: number;
  playable: boolean;
  t: TFunction;
  onOpen: () => void;
  onPlay: () => void;
  onQueue: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onDocClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <div
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") onOpen();
      }}
      className="group relative flex cursor-pointer flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-left transition hover:-translate-y-1 hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-alt)] hover:shadow-[0_18px_40px_-16px_rgba(0,0,0,.7)]"
    >
      <div className="relative aspect-square overflow-hidden rounded-xl bg-[var(--color-surface-alt)] shadow-[0_10px_30px_-12px_rgba(0,0,0,.7)]">
        {album.coverArt ? (
          <img
            src={album.coverArt}
            alt={album.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Disc3
              className="h-12 w-12 text-[var(--color-muted)]"
              strokeWidth={1.3}
            />
          </div>
        )}

        {/* Options "⋯" — top-right */}
        <div
          ref={menuRef}
          className="absolute right-2 top-2"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label={t("artist.albumOptions", {
              defaultValue: "Opciones del álbum",
            })}
            className={`flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur transition hover:bg-black/75 ${
              menuOpen
                ? "opacity-100"
                : "opacity-0 group-hover:opacity-100 focus:opacity-100"
            }`}
          >
            <MoreHorizontal className="h-4 w-4" strokeWidth={2.4} />
          </button>

          {menuOpen ? (
            <div
              role="menu"
              className="absolute right-0 top-9 z-20 w-48 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1 shadow-[0_18px_40px_-12px_rgba(0,0,0,.7)]"
            >
              <button
                type="button"
                role="menuitem"
                disabled={!playable}
                onClick={() => {
                  setMenuOpen(false);
                  onPlay();
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-[var(--color-text)] transition hover:bg-[var(--color-surface-alt)] disabled:opacity-40"
              >
                <Play className="h-4 w-4" fill="currentColor" />
                {t("artist.playAlbum", { defaultValue: "Reproducir álbum" })}
              </button>
              <button
                type="button"
                role="menuitem"
                disabled={!playable}
                onClick={() => {
                  setMenuOpen(false);
                  onQueue();
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-[var(--color-text)] transition hover:bg-[var(--color-surface-alt)] disabled:opacity-40"
              >
                <ListPlus className="h-4 w-4" strokeWidth={2.2} />
                {t("artist.queueAlbum", { defaultValue: "Añadir a la cola" })}
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onOpen();
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-[var(--color-text)] transition hover:bg-[var(--color-surface-alt)]"
              >
                <Eye className="h-4 w-4" strokeWidth={2.2} />
                {t("artist.viewAlbum", { defaultValue: "Ver álbum" })}
              </button>
            </div>
          ) : null}
        </div>

        {/* Play overlay */}
        {playable ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPlay();
            }}
            aria-label={t("artist.playAlbum", {
              defaultValue: "Reproducir álbum",
            })}
            className="absolute bottom-2 right-2 flex h-11 w-11 translate-y-2 items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-primary-contrast)] opacity-0 shadow-[0_10px_24px_-6px_var(--color-primary)] transition group-hover:translate-y-0 group-hover:opacity-100 hover:scale-110"
          >
            <Play className="h-5 w-5" fill="currentColor" />
          </button>
        ) : null}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-[var(--color-text)]">
          {album.title}
        </p>
        <p className="truncate text-[11px] text-[var(--color-muted)]">
          {album.year ? `${album.year} · ` : ""}
          {t("artist.albumMeta", {
            defaultValue: "{{count}} canciones",
            count: album.trackCount,
          })}
          {durationMs > 0 ? ` · ${formatTotal(durationMs)}` : ""}
        </p>
      </div>
    </div>
  );
}
