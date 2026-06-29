import { ArrowLeft, Clock3, Disc3, Music4, Play } from "lucide-react";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";

import ClientLayout from "../layout/ClientLayout";
import {
  getCatalogAlbum,
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

export default function AlbumPage() {
  const { t } = useTranslation();
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const playTrackList = usePlayerStore((s) => s.playTrackList);
  const currentTrackId = usePlayerStore((s) => s.currentTrack?.id ?? null);

  const albumQ = useQuery({
    queryKey: ["catalog", "album", id],
    queryFn: () => getCatalogAlbum(id),
    enabled: !!id,
  });
  const album = albumQ.data;

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
        <header className="relative overflow-hidden px-8 pb-8 pt-16">
          {album?.coverArt ? (
            <>
              <img
                src={album.coverArt}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-page)]/50 via-[var(--color-page)]/75 to-[var(--color-page)]" />
            </>
          ) : null}

          <div className="relative flex flex-col gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[var(--color-surface)]/70 px-3 py-1.5 text-xs font-semibold text-[var(--color-muted)] backdrop-blur transition hover:text-[var(--color-text)]"
            >
              <ArrowLeft className="h-3 w-3" strokeWidth={2.4} />
              {t("album.back", { defaultValue: "Volver" })}
            </button>

            <div className="flex items-end gap-6">
              <div className="h-40 w-40 flex-none overflow-hidden rounded-2xl bg-[var(--color-surface-alt)] shadow-[0_18px_40px_-12px_rgba(0,0,0,.7)]">
                {album?.coverArt ? (
                  <img
                    src={album.coverArt}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Disc3
                      className="h-12 w-12 text-[var(--color-muted)]"
                      strokeWidth={1.4}
                    />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p
                  className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-accent)]"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {t("album.eyebrow", { defaultValue: "Álbum" })}
                </p>
                <h1
                  className="truncate text-4xl font-extrabold tracking-tight sm:text-5xl"
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
                  className="mt-1 text-sm font-semibold text-[var(--color-muted)] transition hover:text-[var(--color-accent)]"
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

            <div className="mt-2">
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
            </div>
          </div>
        </header>

        {/* Tracklist */}
        <div className="mx-auto max-w-4xl px-8 pb-12">
          {albumQ.isLoading ? (
            <p className="text-sm text-[var(--color-muted)]">
              {t("album.loading", { defaultValue: "Cargando…" })}
            </p>
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

              <div className="mt-1 flex flex-col">
                {album.tracks.map((tr, i) => {
                  const active = currentTrackId === tr.id;
                  const cover = tr.coverArt ?? album.coverArt;
                  return (
                    <div
                      key={tr.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => playFrom(i)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          playFrom(i);
                        }
                      }}
                      className={`group grid cursor-pointer grid-cols-[28px_1fr_auto_56px] items-center gap-4 rounded-lg px-3 py-2 text-left transition ${
                        active
                          ? "bg-[var(--color-glass)]"
                          : "hover:bg-[var(--color-glass)]"
                      }`}
                    >
                      {/* Index → play on hover */}
                      <span className="relative flex h-4 items-center justify-center">
                        <span
                          className={`text-sm tabular-nums transition group-hover:opacity-0 ${active ? "text-[var(--color-accent)]" : "text-[var(--color-muted)]"}`}
                          style={{ fontFamily: "var(--font-mono)" }}
                        >
                          {tr.albumOrder ?? i + 1}
                        </span>
                        <Play
                          className="absolute h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100"
                          fill="currentColor"
                        />
                      </span>

                      {/* Cover thumb + title */}
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="relative h-10 w-10 flex-none overflow-hidden rounded-md bg-[var(--color-surface-alt)]">
                          {cover ? (
                            <img
                              src={cover}
                              alt=""
                              className="h-full w-full object-cover"
                            />
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
                                    animation:
                                      "eqbar .9s ease-in-out infinite .2s",
                                  }}
                                />
                                <span
                                  className="w-[2.5px] rounded-[2px] bg-white"
                                  style={{
                                    height: "100%",
                                    transformOrigin: "bottom",
                                    animation:
                                      "eqbar 1.1s ease-in-out infinite .1s",
                                  }}
                                />
                              </span>
                            </span>
                          ) : null}
                        </span>
                        <span
                          className={`min-w-0 truncate text-sm font-semibold ${active ? "text-[var(--color-accent)]" : "text-[var(--color-text)]"}`}
                        >
                          {tr.title}
                        </span>
                      </span>

                      {/* Save */}
                      <span
                        className="opacity-0 transition group-hover:opacity-100 focus-within:opacity-100 data-[saved=true]:opacity-100"
                        data-saved={savedSet.has(tr.id)}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <SaveButton
                          trackId={tr.id}
                          saved={savedSet.has(tr.id)}
                        />
                      </span>

                      {/* Duration */}
                      <span
                        className="text-right text-xs text-[var(--color-muted)]"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        {fmt(tr.durationMs)}
                      </span>
                    </div>
                  );
                })}
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
      </section>
    </ClientLayout>
  );
}
