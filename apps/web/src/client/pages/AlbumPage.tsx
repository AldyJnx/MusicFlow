import {
  ArrowLeft,
  Clock3,
  Disc3,
  LayoutGrid,
  List,
  Music4,
  Play,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { animate, stagger } from "animejs";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";

import ClientLayout from "../layout/ClientLayout";
import {
  getCatalogAlbum,
  getCatalogArtist,
  type CatalogTrackCard,
} from "../../shared/api/catalog";
import SaveButton from "../../shared/ui/SaveButton";
import { useSavedCheckQuery } from "../../shared/hooks/useLibrarySaves";
import { usePlayerStore, type PlayerTrack } from "../stores/playStore";

function fmt(ms: number): string {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Total album length as "1 h 12 min" / "38 min". */
function fmtTotal(ms: number): string {
  const min = Math.round(ms / 60000);
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)} h ${min % 60} min`;
}

function toPlayerTrack(t: CatalogTrackCard): PlayerTrack | null {
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

// Album cover presented as a vinyl: the disc slides out from behind the sleeve
// and spins while the album is playing.
function Vinyl({
  cover,
  playing,
}: {
  cover?: string | null;
  playing: boolean;
}) {
  return (
    <div className="relative h-40 w-[224px] flex-none">
      {/* Disc positioner — only translates (vertical centering + slide-out).
          Kept separate from the spinning child so the spin animation can own
          `transform: rotate` without fighting the position transform. */}
      <div
        className="absolute left-0 top-1/2 h-40 w-40"
        style={{
          transform: playing
            ? "translateY(-50%) translateX(82px)"
            : "translateY(-50%) translateX(40px)",
          transition: "transform .6s cubic-bezier(.2,1,.3,1)",
        }}
      >
        {/* Disc — owns the spin (rotation) only */}
        <div
          className="h-full w-full rounded-full shadow-[0_18px_44px_-10px_rgba(0,0,0,.85)]"
          style={{
            background:
              "repeating-radial-gradient(circle at center, #0c0c0f 0 1px, #1b1b20 1px 3px), radial-gradient(circle at 38% 32%, rgba(255,255,255,.10), transparent 45%), #0a0a0d",
            animation: "spin 9s linear infinite",
            animationPlayState: playing ? "running" : "paused",
          }}
        >
          {/* Center label (uses the cover) */}
          <div
            className="absolute left-1/2 top-1/2 h-[52px] w-[52px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full ring-1 ring-black/40"
            style={
              cover
                ? { background: `center/cover no-repeat url(${cover})` }
                : {
                    background:
                      "linear-gradient(135deg,var(--color-primary),var(--color-accent))",
                  }
            }
          />
          {/* Spindle hole */}
          <div className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-page)] ring-1 ring-white/20" />
        </div>
      </div>

      {/* Sleeve (square cover) on top */}
      <div className="absolute left-0 top-1/2 z-10 h-40 w-40 -translate-y-1/2 overflow-hidden rounded-2xl bg-[var(--color-surface-alt)] shadow-[0_18px_40px_-12px_rgba(0,0,0,.7)]">
        {cover ? (
          <img src={cover} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Disc3
              className="h-12 w-12 text-[var(--color-muted)]"
              strokeWidth={1.4}
            />
          </div>
        )}
      </div>
    </div>
  );
}

const MINI_VINYL_BG =
  "repeating-radial-gradient(circle at center, #0c0c0f 0 1px, #1b1b20 1px 2.5px), #0a0a0d";

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * One song row. On hover/focus a small vinyl record slides out from behind the
 * cover and spins (anime.js drives the slide; CSS owns the rotation so the two
 * transforms don't fight), and the title nudges over to make room.
 */
function TrackRow({
  track,
  index,
  active,
  cover,
  saved,
  onPlay,
}: {
  track: CatalogTrackCard;
  index: number;
  active: boolean;
  cover: string | null;
  saved: boolean;
  onPlay: () => void;
}) {
  const discRef = useRef<HTMLDivElement>(null);

  function reveal() {
    const el = discRef.current;
    if (!el || prefersReducedMotion()) return;
    animate(el, {
      translateX: [0, 18],
      opacity: [0, 1],
      duration: 520,
      ease: "outBack",
    });
  }
  function hide() {
    const el = discRef.current;
    if (!el || prefersReducedMotion()) return;
    animate(el, {
      translateX: 0,
      opacity: 0,
      duration: 240,
      ease: "outQuad",
    });
  }

  return (
    <div
      data-anim-item
      role="button"
      tabIndex={0}
      onClick={onPlay}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onPlay();
        }
      }}
      onMouseEnter={reveal}
      onMouseLeave={hide}
      onFocus={reveal}
      onBlur={hide}
      className={`group grid cursor-pointer grid-cols-[28px_1fr_auto_56px] items-center gap-4 rounded-xl border border-[var(--color-line)]/60 px-3 py-2.5 text-left transition ${
        active
          ? "border-[var(--color-primary)]/50 bg-[var(--color-glass)] ring-1 ring-[var(--color-primary)]/40"
          : "bg-[var(--color-surface)]/80 hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-glass)]"
      }`}
    >
      {/* Index → play on hover */}
      <span className="relative flex h-4 items-center justify-center">
        <span
          className={`text-sm tabular-nums transition group-hover:opacity-0 ${active ? "text-[var(--color-accent)]" : "text-[var(--color-muted)]"}`}
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {track.albumOrder ?? index + 1}
        </span>
        <Play
          className="absolute h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100"
          fill="currentColor"
        />
      </span>

      {/* Cover thumb (vinyl slides out behind it) + title */}
      <span className="flex min-w-0 items-center gap-3">
        <span className="relative h-10 w-10 flex-none">
          {/* Mini vinyl — anime.js slides this out, CSS spins the inner disc */}
          <div
            ref={discRef}
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-0 h-10 w-10 opacity-0"
            style={{ willChange: "transform, opacity" }}
          >
            <div
              className="h-full w-full rounded-full shadow-[0_4px_14px_-3px_rgba(0,0,0,.9)] ring-1 ring-black/50"
              style={{
                background: MINI_VINYL_BG,
                animation: "spin 2.5s linear infinite",
              }}
            >
              <span
                className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full ring-1 ring-black/40"
                style={
                  cover
                    ? { background: `center/cover no-repeat url(${cover})` }
                    : {
                        background:
                          "linear-gradient(135deg,var(--color-primary),var(--color-accent))",
                      }
                }
              />
            </div>
          </div>

          {/* Cover on top */}
          <span className="relative z-10 block h-10 w-10 overflow-hidden rounded-md bg-[var(--color-surface-alt)]">
            {cover ? (
              <img src={cover} alt="" className="h-full w-full object-cover" />
            ) : (
              <Music4 className="absolute inset-0 m-auto h-4 w-4 text-[var(--color-muted)]" />
            )}
            {active ? (
              <span className="absolute inset-0 flex items-center justify-center bg-black/40">
                <span className="flex h-3.5 items-end gap-[2px]">
                  <span
                    className="w-[2.5px] rounded-[2px] bg-white"
                    style={{
                      height: "100%",
                      transformOrigin: "bottom",
                      animation: "eqbar .7s ease-in-out infinite",
                    }}
                  />
                  <span
                    className="w-[2.5px] rounded-[2px] bg-white"
                    style={{
                      height: "100%",
                      transformOrigin: "bottom",
                      animation: "eqbar .9s ease-in-out infinite .2s",
                    }}
                  />
                  <span
                    className="w-[2.5px] rounded-[2px] bg-white"
                    style={{
                      height: "100%",
                      transformOrigin: "bottom",
                      animation: "eqbar 1.1s ease-in-out infinite .1s",
                    }}
                  />
                </span>
              </span>
            ) : null}
          </span>
        </span>
        <span
          className={`min-w-0 truncate text-sm font-semibold transition-transform duration-500 ease-out group-hover:translate-x-2.5 ${active ? "text-[var(--color-accent)]" : "text-[var(--color-text)]"}`}
        >
          {track.title}
        </span>
      </span>

      {/* Save */}
      <span
        className="opacity-0 transition group-hover:opacity-100 focus-within:opacity-100 data-[saved=true]:opacity-100"
        data-saved={saved}
        onClick={(e) => e.stopPropagation()}
      >
        <SaveButton trackId={track.id} saved={saved} />
      </span>

      {/* Duration */}
      <span
        className="text-right text-xs text-[var(--color-muted)]"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {fmt(track.durationMs)}
      </span>
    </div>
  );
}

export default function AlbumPage() {
  const { t } = useTranslation();
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const playTrackList = usePlayerStore((s) => s.playTrackList);
  const currentTrackId = usePlayerStore((s) => s.currentTrack?.id ?? null);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const [view, setView] = useState<"list" | "cards">("list");

  const albumQ = useQuery({
    queryKey: ["catalog", "album", id],
    queryFn: () => getCatalogAlbum(id),
    enabled: !!id,
  });
  const album = albumQ.data;

  // The artist's other albums, to fill the page with real related content.
  const artistId = album?.artist.id;
  const artistQ = useQuery({
    queryKey: ["catalog", "artist", artistId],
    queryFn: () => getCatalogArtist(artistId as string),
    enabled: !!artistId,
    staleTime: 60_000,
  });
  const moreAlbums = useMemo(
    () => (artistQ.data?.albums ?? []).filter((a) => a.id !== id),
    [artistQ.data, id],
  );

  const trackIds = useMemo(
    () => (album?.tracks ?? []).map((tr) => tr.id),
    [album],
  );
  const savedCheckQ = useSavedCheckQuery(trackIds);
  const savedSet = useMemo(
    () => new Set(savedCheckQ.data ?? []),
    [savedCheckQ.data],
  );
  const totalMs = useMemo(
    () => (album?.tracks ?? []).reduce((s, tr) => s + tr.durationMs, 0),
    [album],
  );
  const albumIsPlaying =
    isPlaying && (album?.tracks ?? []).some((tr) => tr.id === currentTrackId);

  // Gentle staggered entrance for the rows/cards whenever the list loads or the
  // view toggles. Slide-only (no opacity) so there's never a flash of blanks.
  const tlRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!album || prefersReducedMotion()) return;
    const root = tlRef.current;
    if (!root) return;
    const items = root.querySelectorAll<HTMLElement>("[data-anim-item]");
    if (!items.length) return;
    animate(items, {
      translateY: [12, 0],
      duration: 460,
      delay: stagger(40),
      ease: "outCubic",
    });
  }, [album, view]);

  function playFrom(index = 0) {
    if (!album) return;
    const playable = album.tracks
      .map(toPlayerTrack)
      .filter((p): p is PlayerTrack => p !== null);
    if (playable.length) void playTrackList(playable, index);
  }

  return (
    <ClientLayout>
      <section className="min-h-screen w-full text-[var(--color-text)]">
        {/* Hero */}
        <header className="relative overflow-hidden pb-8 pt-16">
          {album?.coverArt ? (
            <>
              <img
                src={album.coverArt}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-page)]/65 via-[var(--color-page)]/85 to-[var(--color-page)]" />
            </>
          ) : null}

          <div className="relative flex max-w-6xl flex-col gap-6 px-8">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[var(--color-surface)]/70 px-3 py-1.5 text-xs font-semibold text-[var(--color-muted)] backdrop-blur transition hover:text-[var(--color-text)]"
            >
              <ArrowLeft className="h-3 w-3" strokeWidth={2.4} />
              {t("album.back", { defaultValue: "Volver" })}
            </button>

            <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
              <Vinyl cover={album?.coverArt} playing={albumIsPlaying} />
              <div className="min-w-0 flex-1 [text-shadow:0_2px_12px_rgba(0,0,0,.55)]">
                <p
                  className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/85"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {t("album.eyebrow", { defaultValue: "Álbum" })}
                </p>
                <h1
                  className="mt-1 truncate text-4xl font-extrabold tracking-tight text-white sm:text-5xl"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {album?.title ?? "…"}
                </h1>
                <button
                  type="button"
                  onClick={() =>
                    album &&
                    navigate(`/artist/${encodeURIComponent(album.artist.name)}`)
                  }
                  className="mt-2 text-sm font-semibold text-white/75 transition hover:text-white"
                >
                  {album?.artist.name}
                  {album?.year ? ` · ${album.year}` : ""}
                  {album
                    ? ` · ${t("album.songsCount", { defaultValue: "{{count}} canciones", count: album.tracks.length })}`
                    : ""}
                  {album && totalMs > 0 ? ` · ${fmtTotal(totalMs)}` : ""}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => playFrom(0)}
                disabled={!album?.tracks.length}
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white shadow-[0_12px_30px_-8px_var(--color-primary)] transition hover:scale-105 disabled:opacity-40"
                style={{
                  background:
                    "linear-gradient(135deg,var(--color-primary),var(--color-accent))",
                }}
              >
                <Play className="h-4 w-4" fill="currentColor" />
                {t("album.play", { defaultValue: "Reproducir" })}
              </button>

              {/* List / cards toggle */}
              <div className="inline-flex items-center gap-1 rounded-full border border-[var(--color-line)] bg-[var(--color-surface)]/60 p-1 backdrop-blur">
                <button
                  type="button"
                  onClick={() => setView("list")}
                  aria-pressed={view === "list"}
                  title={t("album.viewList", { defaultValue: "Lista" })}
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition ${
                    view === "list"
                      ? "bg-[var(--color-primary)] text-[var(--color-primary-contrast)]"
                      : "text-[var(--color-muted)] hover:text-[var(--color-text)]"
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setView("cards")}
                  aria-pressed={view === "cards"}
                  title={t("album.viewCards", { defaultValue: "Cards" })}
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition ${
                    view === "cards"
                      ? "bg-[var(--color-primary)] text-[var(--color-primary-contrast)]"
                      : "text-[var(--color-muted)] hover:text-[var(--color-text)]"
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Tracklist */}
        <div
          ref={tlRef}
          className={`px-8 pt-2 ${view === "cards" ? "max-w-[1560px] pb-12" : "max-w-5xl pb-10"}`}
        >
          {albumQ.isLoading ? (
            <p className="text-sm text-[var(--color-muted)]">
              {t("album.loading", { defaultValue: "Cargando…" })}
            </p>
          ) : album && album.tracks.length && view === "cards" ? (
            /* ── Cards view ─────────────────────────────────────────────── */
            <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(190px,1fr))]">
              {album.tracks.map((tr, i) => {
                const active = currentTrackId === tr.id;
                const cover = tr.coverArt ?? album.coverArt;
                const playingThis = active && isPlaying;
                return (
                  <div
                    key={tr.id}
                    data-anim-item
                    role="button"
                    tabIndex={0}
                    onClick={() => playFrom(i)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        playFrom(i);
                      }
                    }}
                    className={`group relative aspect-[4/5] cursor-pointer overflow-hidden rounded-2xl border text-left transition hover:-translate-y-1 ${
                      active
                        ? "border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/50"
                        : "border-[var(--color-line)] hover:border-[var(--color-primary)]/60"
                    }`}
                  >
                    {/* Cover as a dimmed background texture */}
                    {cover ? (
                      <img
                        src={cover}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-[var(--color-surface-alt)]" />
                    )}
                    {/* Legibility gradient — darkest at the bottom for the title */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/10" />

                    {/* Save — top-right */}
                    <span
                      className="absolute right-2 top-2 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100 data-[saved=true]:opacity-100"
                      data-saved={savedSet.has(tr.id)}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <SaveButton trackId={tr.id} saved={savedSet.has(tr.id)} />
                    </span>

                    {/* Play / EQ overlay — center on hover, persistent when active */}
                    <span
                      className={`absolute inset-0 flex items-center justify-center transition ${
                        active
                          ? "opacity-100"
                          : "opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      <span
                        className="flex h-12 w-12 items-center justify-center rounded-full text-white shadow-[0_8px_22px_-6px_rgba(0,0,0,.8)]"
                        style={{
                          background:
                            "linear-gradient(135deg,var(--color-primary),var(--color-accent))",
                        }}
                      >
                        {playingThis ? (
                          <span className="flex h-4 items-end gap-[2px]">
                            <span
                              className="w-[3px] rounded-[2px] bg-white"
                              style={{
                                height: "100%",
                                transformOrigin: "bottom",
                                animation: "eqbar .7s ease-in-out infinite",
                              }}
                            />
                            <span
                              className="w-[3px] rounded-[2px] bg-white"
                              style={{
                                height: "100%",
                                transformOrigin: "bottom",
                                animation: "eqbar .9s ease-in-out infinite .2s",
                              }}
                            />
                            <span
                              className="w-[3px] rounded-[2px] bg-white"
                              style={{
                                height: "100%",
                                transformOrigin: "bottom",
                                animation:
                                  "eqbar 1.1s ease-in-out infinite .1s",
                              }}
                            />
                          </span>
                        ) : (
                          <Play className="h-5 w-5" fill="currentColor" />
                        )}
                      </span>
                    </span>

                    {/* Title + duration — anchored at the bottom */}
                    <div className="absolute inset-x-0 bottom-0 p-3">
                      <p
                        className={`truncate text-sm font-bold [text-shadow:0_1px_6px_rgba(0,0,0,.7)] ${active ? "text-[var(--color-accent)]" : "text-white"}`}
                        title={tr.title}
                      >
                        {tr.title}
                      </p>
                      <p
                        className="text-[11px] text-white/70"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        {fmt(tr.durationMs)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : album && album.tracks.length ? (
            <>
              {/* Column header */}
              <div className="grid grid-cols-[28px_1fr_auto_56px] items-center gap-4 border-b border-[var(--color-line)] px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)]">
                <span className="text-center">#</span>
                <span>{t("album.colTitle", { defaultValue: "Título" })}</span>
                <span />
                <span className="flex justify-end">
                  <Clock3 className="h-3.5 w-3.5" />
                </span>
              </div>

              <div className="mt-2 flex flex-col gap-1.5">
                {album.tracks.map((tr, i) => (
                  <TrackRow
                    key={tr.id}
                    track={tr}
                    index={i}
                    active={currentTrackId === tr.id}
                    cover={tr.coverArt ?? album.coverArt}
                    saved={savedSet.has(tr.id)}
                    onPlay={() => playFrom(i)}
                  />
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-[var(--color-muted)]">
              {t("album.empty", {
                defaultValue: "Este álbum aún no tiene canciones asignadas.",
              })}
            </p>
          )}
        </div>

        {/* More from this artist — fills the page with real related content */}
        {moreAlbums.length > 0 ? (
          <div className="max-w-5xl px-8 pb-16">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.18em] text-[var(--color-muted)]">
              {t("album.moreFrom", {
                defaultValue: "Más de {{name}}",
                name: album?.artist.name,
              })}
            </h2>
            <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(160px,1fr))]">
              {moreAlbums.map((al) => (
                <button
                  key={al.id}
                  type="button"
                  onClick={() => navigate(`/album/${al.id}`)}
                  className="group flex flex-col gap-2.5 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]/60 p-3 text-left transition hover:-translate-y-1 hover:border-[var(--color-primary)]/60 hover:bg-[var(--color-surface-alt)]"
                >
                  <div className="relative aspect-square overflow-hidden rounded-xl bg-[var(--color-surface-alt)] shadow-[0_10px_30px_-12px_rgba(0,0,0,.7)]">
                    {al.coverArt ? (
                      <img
                        src={al.coverArt}
                        alt={al.title}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Disc3
                          className="h-10 w-10 text-[var(--color-muted)]"
                          strokeWidth={1.3}
                        />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[var(--color-text)]">
                      {al.title}
                    </p>
                    <p className="truncate text-[11px] text-[var(--color-muted)]">
                      {al.year ? `${al.year} · ` : ""}
                      {t("album.songsCount", {
                        defaultValue: "{{count}} canciones",
                        count: al.trackCount,
                      })}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </ClientLayout>
  );
}
