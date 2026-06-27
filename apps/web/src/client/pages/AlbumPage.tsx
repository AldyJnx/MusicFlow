import { ArrowLeft, Disc3, Play } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";

import ClientLayout from "../layout/ClientLayout";
import {
  getCatalogAlbum,
  type CatalogTrackCard,
} from "../../shared/api/catalog";
import { usePlayerStore, type PlayerTrack } from "../stores/playStore";

function fmt(ms: number): string {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
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
              Volver
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
                  Álbum
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
                  {album ? ` · ${album.tracks.length} canciones` : ""}
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
                Reproducir
              </button>
            </div>
          </div>
        </header>

        {/* Tracklist */}
        <div className="mx-auto max-w-4xl px-8 pb-12">
          {albumQ.isLoading ? (
            <p className="text-sm text-[var(--color-muted)]">Cargando…</p>
          ) : album && album.tracks.length ? (
            <div className="flex flex-col">
              {album.tracks.map((tr, i) => {
                const active = currentTrackId === tr.id;
                return (
                  <button
                    key={tr.id}
                    type="button"
                    onClick={() => playFrom(i)}
                    className="group grid grid-cols-[28px_1fr_56px] items-center gap-4 rounded-lg px-3 py-2.5 text-left transition hover:bg-[var(--color-glass)]"
                  >
                    <span
                      className={`text-sm tabular-nums ${active ? "text-[var(--color-accent)]" : "text-[var(--color-muted)]"}`}
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {tr.albumOrder ?? i + 1}
                    </span>
                    <span
                      className={`min-w-0 truncate text-sm font-semibold ${active ? "text-[var(--color-accent)]" : "text-[var(--color-text)]"}`}
                    >
                      {tr.title}
                    </span>
                    <span
                      className="text-right text-xs text-[var(--color-muted)]"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {fmt(tr.durationMs)}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-[var(--color-muted)]">
              Este álbum aún no tiene canciones asignadas.
            </p>
          )}
        </div>
      </section>
    </ClientLayout>
  );
}
