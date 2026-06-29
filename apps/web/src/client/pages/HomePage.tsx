import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import ClientLayout from "../layout/ClientLayout";
import { useArtistsQuery, useTracksQuery } from "../../shared/hooks/useTracks";
import { useScrollReveal } from "../../shared/hooks/useScrollReveal";
import { usePlayerStore, type PlayerTrack } from "../stores/playStore";
import type { Track } from "../../shared/api/tracks";

// ─── Deterministic gradients (mirror the pretesis palette) ──────────────────
const GRADS = [
  "linear-gradient(135deg,#7c5ce8,#e85cc0)",
  "linear-gradient(135deg,#4cf1a0,#3aa0ff)",
  "linear-gradient(135deg,#e85cc0,#ff8a5c)",
  "linear-gradient(135deg,#5c8cff,#7c5ce8)",
  "linear-gradient(135deg,#ff5c8a,#7c5ce8)",
  "linear-gradient(135deg,#4cf1a0,#7c5ce8)",
  "linear-gradient(135deg,#a855f7,#ec4899)",
  "linear-gradient(135deg,#22d3ee,#7c5ce8)",
];

function hashIndex(s: string, mod: number): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 100000;
  return h % mod;
}

function gradOf(seed: string): string {
  return GRADS[hashIndex(seed, GRADS.length)];
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

// ─── Section heading (Space Grotesk 21px + "Ver todo") ──────────────────────
function RowHead({
  title,
  onSeeAll,
  children,
}: {
  title: string;
  onSeeAll?: () => void;
  children?: React.ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <div className="mb-4 flex items-baseline justify-between gap-3">
      <h2
        className="text-[21px] font-bold tracking-[-0.01em] text-[var(--color-text)]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {title}
      </h2>
      <div className="flex items-center gap-3">
        {onSeeAll ? (
          <button
            type="button"
            onClick={onSeeAll}
            className="text-xs font-bold text-[var(--color-muted)] transition hover:text-[var(--color-text)]"
          >
            {t("home.seeAll", { defaultValue: "Ver todo" })}
          </button>
        ) : null}
        {children}
      </div>
    </div>
  );
}

// ─── Hero carousel (featured of the week) ───────────────────────────────────
function Hero({
  items,
  onPlay,
  onArtist,
}: {
  items: Track[];
  onPlay: (t: Track) => void;
  onArtist: (name: string) => void;
}) {
  const { t } = useTranslation();
  const [idx, setIdx] = useState(0);
  const touchedAt = useRef(0);
  const n = items.length;

  // Auto-advance, pausing for 7s after a manual interaction.
  useEffect(() => {
    if (n <= 1) return;
    const id = window.setInterval(() => {
      if (performance.now() - touchedAt.current < 7000) return;
      setIdx((p) => (p + 1) % n);
    }, 6000);
    return () => window.clearInterval(id);
  }, [n]);

  if (n === 0) return null;
  const cur = items[idx % n];
  const go = (d: 1 | -1) => {
    touchedAt.current = performance.now();
    setIdx((p) => (p + d + n) % n);
  };

  const grad = gradOf(cur.id);
  const art = cur.coverArt
    ? `center/cover no-repeat url(${cur.coverArt})`
    : gradOf(cur.title);

  return (
    <div
      className="relative mb-9 mt-1.5"
      style={{ animation: "fadeUp .5s ease both" }}
    >
      <div className="relative h-[312px] overflow-hidden rounded-[26px] shadow-[0_30px_70px_-30px_rgba(0,0,0,.85)]">
        <div
          key={cur.id}
          className="absolute inset-0"
          style={{ animation: "fadeUp .5s cubic-bezier(.16,1,.3,1) both" }}
        >
          <div className="absolute inset-0" style={{ background: grad }} />
          <div
            className="absolute bottom-0 right-0 top-0 w-[46%]"
            style={{ background: art }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, rgba(8,7,16,.82) 0%, rgba(8,7,16,.55) 42%, transparent 72%)",
            }}
          />
          <div
            className="absolute right-[5%] top-1/2 max-w-[48%] -translate-y-1/2 text-right"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 64,
              letterSpacing: "-.03em",
              lineHeight: 0.95,
              color: "rgba(255,255,255,.9)",
              textShadow: "0 8px 30px rgba(0,0,0,.4)",
            }}
          >
            {cur.title}
          </div>

          <div className="absolute bottom-0 left-0 top-0 flex max-w-[58%] flex-col justify-between p-[30px_38px]">
            <div className="flex flex-col gap-3.5">
              <span
                className="flex items-center gap-2 text-[var(--color-success)]"
                style={{
                  font: "700 11px var(--font-mono)",
                  letterSpacing: ".16em",
                }}
              >
                <span className="h-[7px] w-[7px] rounded-full bg-[var(--color-success)] shadow-[0_0_10px_var(--color-success)]" />
                {t("home.featuredWeek", {
                  defaultValue: "Destacado esta semana",
                })}
              </span>
              <div className="flex items-center gap-4">
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: 58,
                    lineHeight: 1,
                    letterSpacing: "-.03em",
                    background:
                      "linear-gradient(135deg,#fff,var(--color-accent))",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  #{(idx % n) + 1}
                </span>
                <div className="flex flex-col gap-[3px]">
                  <span
                    className="text-[var(--color-muted)]"
                    style={{
                      font: "700 10px var(--font-mono)",
                      letterSpacing: ".14em",
                      opacity: 0.7,
                    }}
                  >
                    {t("home.trending", { defaultValue: "EN TENDENCIA" })}
                  </span>
                  <span className="text-[13px] font-semibold text-[var(--color-muted)]">
                    {cur.artist}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-[34px]">
              <div className="flex flex-col gap-[3px]">
                <span
                  className="text-[var(--color-muted)]"
                  style={{
                    font: "700 10px var(--font-mono)",
                    letterSpacing: ".14em",
                    opacity: 0.7,
                  }}
                >
                  {t("home.track", { defaultValue: "CANCIÓN" })}
                </span>
                <span
                  className="truncate"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: 19,
                    letterSpacing: "-.01em",
                  }}
                >
                  {cur.title}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onArtist(cur.artist)}
                className="flex flex-col gap-[3px] text-left transition hover:text-[var(--color-accent)]"
              >
                <span
                  className="text-[var(--color-muted)]"
                  style={{
                    font: "700 10px var(--font-mono)",
                    letterSpacing: ".14em",
                    opacity: 0.7,
                  }}
                >
                  {t("home.artist", { defaultValue: "ARTISTA" })}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: 19,
                    letterSpacing: "-.01em",
                  }}
                >
                  {cur.artist}
                </span>
              </button>
            </div>
          </div>

          {/* Arrows */}
          {n > 1 ? (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label={t("home.scrollLeft", { defaultValue: "Anterior" })}
                className="absolute left-[18px] top-1/2 z-[2] flex h-[38px] w-[38px] -translate-y-1/2 items-center justify-center rounded-full border border-[var(--color-line)] bg-[rgba(8,8,16,.5)] text-white backdrop-blur-[14px] transition hover:bg-[rgba(8,8,16,.8)] active:scale-90"
              >
                <ChevronLeft className="h-[18px] w-[18px]" strokeWidth={2.4} />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label={t("home.scrollRight", {
                  defaultValue: "Siguiente",
                })}
                className="absolute right-[18px] top-[90px] z-[2] flex h-[38px] w-[38px] items-center justify-center rounded-full border border-[var(--color-line)] bg-[rgba(8,8,16,.5)] text-white backdrop-blur-[14px] transition hover:bg-[rgba(8,8,16,.8)] active:scale-90"
              >
                <ChevronRight className="h-[18px] w-[18px]" strokeWidth={2.4} />
              </button>

              {/* Dots */}
              <div className="absolute bottom-6 left-[38px] z-[2] flex gap-[7px]">
                {items.map((it, i) => (
                  <button
                    key={it.id}
                    type="button"
                    aria-label={`${i + 1}`}
                    onClick={() => {
                      touchedAt.current = performance.now();
                      setIdx(i);
                    }}
                    className="h-[6px] rounded-full transition-all"
                    style={{
                      width: i === idx % n ? 22 : 6,
                      background:
                        i === idx % n
                          ? "var(--color-text)"
                          : "rgba(255,255,255,.32)",
                    }}
                  />
                ))}
              </div>
            </>
          ) : null}

          {/* Play (bottom-right) */}
          <div className="absolute bottom-7 right-[30px] z-[2] flex items-center gap-3">
            <button
              type="button"
              onClick={() => onPlay(cur)}
              className="flex h-[50px] items-center gap-[9px] rounded-full px-7 text-[14.5px] font-bold text-white shadow-[0_12px_30px_-8px_var(--color-primary)] transition hover:scale-105 active:scale-95"
              style={{
                background:
                  "linear-gradient(135deg,var(--color-primary),var(--color-accent))",
              }}
            >
              <Play className="h-[18px] w-[18px]" fill="currentColor" />
              {t("home.play", { defaultValue: "Reproducir" })}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Album rail card (180px) ────────────────────────────────────────────────
function AlbumCard({ track, onPlay }: { track: Track; onPlay: () => void }) {
  return (
    <button
      type="button"
      onClick={onPlay}
      className="group w-full text-left"
      style={{ animation: "fadeUp .5s ease both" }}
    >
      <div className="relative mb-2.5 aspect-square overflow-hidden rounded-2xl shadow-[0_10px_30px_-12px_rgba(0,0,0,.7)]">
        <div
          className="absolute inset-0"
          style={{ background: gradOf(track.id) }}
        />
        {track.coverArt ? (
          <img
            src={track.coverArt}
            alt={track.title}
            className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
          />
        ) : null}
        <div className="absolute inset-0 flex items-end justify-end bg-gradient-to-t from-black/30 to-transparent p-3 opacity-0 transition group-hover:opacity-100">
          <span className="flex h-11 w-11 translate-y-2 items-center justify-center rounded-full bg-[var(--color-success)] shadow-[0_8px_22px_-6px_var(--color-success)] transition group-hover:translate-y-0">
            <Play className="h-5 w-5" fill="#0a0a14" stroke="none" />
          </span>
        </div>
      </div>
      <div className="truncate text-[13.5px] font-bold text-[var(--color-text)]">
        {track.title}
      </div>
      <div className="truncate text-[11.5px] font-medium text-[var(--color-muted)]">
        {track.artist}
      </div>
    </button>
  );
}

// ─── Artist avatar with conic-gradient ring ─────────────────────────────────
function ArtistAvatar({
  name,
  imageUrl,
  onClick,
}: {
  name: string;
  imageUrl?: string | null;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full flex-col items-center gap-2.5"
      style={{ animation: "fadeUp .5s ease both" }}
    >
      <div
        className="aspect-square w-full max-w-[132px] rounded-full p-[2.5px] transition-transform group-hover:scale-[1.07]"
        style={{
          background:
            "conic-gradient(from 0deg,var(--color-primary),var(--color-accent),var(--color-success),var(--color-primary))",
        }}
      >
        <div
          className="h-full w-full overflow-hidden rounded-full border-[2.5px] border-[var(--color-page)] shadow-[inset_0_-10px_24px_rgba(0,0,0,.4)]"
          style={imageUrl ? undefined : { background: gradOf(name) }}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          ) : null}
        </div>
      </div>
      <span className="text-center text-[12.5px] font-semibold text-[var(--color-text)]">
        {name}
      </span>
    </button>
  );
}

export default function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const playTrackList = usePlayerStore((s) => s.playTrackList);
  const currentTrackId = usePlayerStore((s) => s.currentTrack?.id ?? null);

  const tracksQ = useTracksQuery({ take: 20 });
  const artistsQ = useArtistsQuery();

  const tracks = tracksQ.data?.tracks ?? [];
  const artists = (artistsQ.data ?? []).slice(0, 8);

  const heroItems = useMemo(
    () => tracks.filter((tr) => tr.fileUrlRemote).slice(0, 5),
    [tracks],
  );
  const albums = tracks.slice(0, 10);
  const recs = tracks.slice(0, 6);

  function playFromList(list: Track[], track: Track) {
    const playable = list
      .map(toPlayerTrack)
      .filter((p): p is PlayerTrack => p !== null);
    if (playable.length === 0) return;
    const idx = playable.findIndex((p) => p.id === track.id);
    void playTrackList(playable, Math.max(0, idx));
  }

  const revealRef = useRef<HTMLDivElement>(null);
  useScrollReveal(revealRef, [tracks.length, artists.length]);

  return (
    <ClientLayout>
      <section className="min-h-screen w-full text-[var(--color-text)]">
        <div
          ref={revealRef}
          className="mx-auto w-full max-w-[1560px] px-4 pb-10 pt-6 sm:px-6 xl:px-8"
        >
          <div data-reveal>
            <Hero
              items={heroItems}
              onPlay={(tr) => playFromList(heroItems, tr)}
              onArtist={(name) =>
                navigate(`/artist/${encodeURIComponent(name)}`)
              }
            />
          </div>

          {/* ARTISTS */}
          {artists.length > 0 ? (
            <div className="mb-9" data-reveal data-reveal-delay="60">
              <RowHead
                title={t("home.popularArtists", {
                  defaultValue: "Artistas populares",
                })}
                onSeeAll={() => navigate("/library")}
              />
              <div className="grid gap-x-5 gap-y-6 [grid-template-columns:repeat(auto-fit,minmax(110px,1fr))]">
                {artists.map((a) => (
                  <ArtistAvatar
                    key={a.name}
                    name={a.name}
                    imageUrl={a.imageUrl}
                    onClick={() =>
                      navigate(`/artist/${encodeURIComponent(a.name)}`)
                    }
                  />
                ))}
              </div>
            </div>
          ) : null}

          {/* ALBUMS RAIL */}
          {albums.length > 0 ? (
            <div className="mb-9" data-reveal data-reveal-delay="100">
              <AlbumsRail
                albums={albums}
                onPlay={(tr) => playFromList(albums, tr)}
                onSeeAll={() => navigate("/library")}
              />
            </div>
          ) : null}

          {/* RECOMMENDED SONGS */}
          {recs.length > 0 ? (
            <div data-reveal data-reveal-delay="140">
              <RowHead
                title={t("home.recommended", {
                  defaultValue: "Recomendado para ti",
                })}
                onSeeAll={() => navigate("/library")}
              />
              <div className="flex flex-col gap-0.5">
                {recs.map((tr) => (
                  <RecRow
                    key={tr.id}
                    track={tr}
                    active={currentTrackId === tr.id}
                    onPlay={() => playFromList(recs, tr)}
                  />
                ))}
              </div>
            </div>
          ) : null}

          {tracksQ.isSuccess && tracks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--color-line)] p-8 text-center">
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

// ─── Albums rail (own scroll ref + arrows) ──────────────────────────────────
function AlbumsRail({
  albums,
  onPlay,
  onSeeAll,
}: {
  albums: Track[];
  onPlay: (t: Track) => void;
  onSeeAll: () => void;
}) {
  const { t } = useTranslation();
  return (
    <>
      <RowHead
        title={t("home.newAlbums", { defaultValue: "Nuevos álbumes" })}
        onSeeAll={onSeeAll}
      />
      <div className="grid gap-x-[18px] gap-y-6 [grid-template-columns:repeat(auto-fill,minmax(160px,1fr))]">
        {albums.map((tr) => (
          <AlbumCard key={tr.id} track={tr} onPlay={() => onPlay(tr)} />
        ))}
      </div>
    </>
  );
}

// ─── Recommended song row (46px thumb + EQ bars when active) ────────────────
function RecRow({
  track,
  active,
  onPlay,
}: {
  track: Track;
  active: boolean;
  onPlay: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPlay}
      className="group flex items-center gap-3.5 rounded-xl px-3 py-2 text-left transition hover:bg-[var(--color-glass)]"
    >
      <div
        className="relative h-[46px] w-[46px] flex-none overflow-hidden rounded-[11px] shadow-[0_4px_12px_-4px_rgba(0,0,0,.6)]"
        style={{ background: gradOf(track.id) }}
      >
        {track.coverArt ? (
          <img
            src={track.coverArt}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : null}
        <div
          className={`absolute inset-0 flex items-center justify-center bg-black/35 transition ${
            active ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
        >
          {active ? (
            <div className="flex h-3.5 items-end gap-[2px]">
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
            </div>
          ) : (
            <Play className="h-[18px] w-[18px]" fill="#fff" stroke="none" />
          )}
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div
          className={`truncate text-sm font-bold ${active ? "text-[var(--color-accent)]" : "text-[var(--color-text)]"}`}
        >
          {track.title}
        </div>
        <div className="truncate text-xs text-[var(--color-muted)]">
          {track.artist}
        </div>
      </div>
    </button>
  );
}
