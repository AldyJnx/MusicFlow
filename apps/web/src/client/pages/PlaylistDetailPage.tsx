import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ListMusic,
  Loader2,
  Play,
  Sliders,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";

import ClientLayout from "../layout/ClientLayout";
import {
  getPlaylist,
  removeTrackFromPlaylist,
  reorderPlaylistTracks,
} from "../../shared/api/playlists";
import { usePremiumGate } from "../../shared/hooks/usePremiumGate";
import { usePlayerStore, type PlayerTrack } from "../stores/playStore";
import type { Track } from "../../shared/api/tracks";
import PlaylistEQModal from "../features/equalizer/PlaylistEQModal";

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

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/** "1 h 23 min" / "12 min" from a total millisecond duration. */
function formatTotal(ms: number): string {
  const totalMin = Math.round(ms / 60000);
  if (totalMin < 60) return `${totalMin} min`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

/**
 * Single-playlist view: hero (cover + name + description + CTAs) and the
 * ordered track list. Lets the user play the whole list or any track, remove
 * tracks, reorder them, and open the playlist-scoped EQ. Mirrors ArtistPage's
 * layout and CTA hierarchy.
 */
export default function PlaylistDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { id = "" } = useParams<{ id: string }>();

  const playTrackList = usePlayerStore((s) => s.playTrackList);
  const openAiPrompt = usePlayerStore((s) => s.openAiPrompt);
  const { guard } = usePremiumGate();

  const [eqOpen, setEqOpen] = useState(false);

  const playlistQ = useQuery({
    queryKey: ["playlists", id],
    queryFn: () => getPlaylist(id),
    enabled: Boolean(id),
  });

  const entries = useMemo(
    () => playlistQ.data?.tracks ?? [],
    [playlistQ.data?.tracks],
  );
  const orderedIds = useMemo(() => entries.map((e) => e.track.id), [entries]);

  const totalMs = useMemo(
    () => entries.reduce((sum, e) => sum + (e.track.durationMs ?? 0), 0),
    [entries],
  );

  const remove = useMutation({
    mutationFn: (trackId: string) => removeTrackFromPlaylist(id, trackId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["playlists", id] });
      void qc.invalidateQueries({ queryKey: ["playlists"] });
    },
  });

  const reorder = useMutation({
    mutationFn: (trackIds: string[]) => reorderPlaylistTracks(id, trackIds),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["playlists", id] });
    },
  });

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= orderedIds.length) return;
    const next = [...orderedIds];
    [next[index], next[target]] = [next[target], next[index]];
    reorder.mutate(next);
  }

  function playAll(startIndex = 0) {
    const playable = entries
      .map((e) => toPlayerTrack(e.track))
      .filter((p): p is PlayerTrack => p !== null);
    if (playable.length > 0) void playTrackList(playable, startIndex);
  }

  function playFrom(trackId: string) {
    const playable = entries
      .map((e) => toPlayerTrack(e.track))
      .filter((p): p is PlayerTrack => p !== null);
    const idx = playable.findIndex((p) => p.id === trackId);
    if (playable.length > 0) void playTrackList(playable, Math.max(0, idx));
  }

  const playlist = playlistQ.data;
  const heroCover =
    playlist?.coverArt ??
    entries.find((e) => e.track.coverArt)?.track.coverArt ??
    null;

  return (
    <ClientLayout>
      <section className="min-h-screen w-full text-[var(--color-text)]">
        {/* Hero */}
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
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-cta-start)] via-[var(--color-page)] to-[var(--color-page)]" />
          )}

          <div className="relative flex h-full flex-col justify-end gap-4 px-8 pb-8 pt-16">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[var(--color-surface)]/70 px-3 py-1.5 text-xs font-semibold text-[var(--color-muted)] backdrop-blur transition hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
            >
              <ArrowLeft className="h-3 w-3" strokeWidth={2.4} />
              {t("common.back", { defaultValue: "Volver" })}
            </button>

            <div className="flex items-end gap-5">
              <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[var(--color-surface-alt)] shadow-[0_14px_30px_rgba(0,0,0,0.4)]">
                {heroCover ? (
                  <img
                    src={heroCover}
                    alt={playlist?.name ?? ""}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ListMusic
                    className="h-12 w-12 text-[var(--color-muted)]"
                    strokeWidth={1.4}
                  />
                )}
              </div>
              <div className="flex min-w-0 flex-col gap-1">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-primary)]">
                  {t("playlistDetail.eyebrow", { defaultValue: "Playlist" })}
                </p>
                <h1 className="truncate text-5xl font-extrabold leading-tight tracking-tight text-[var(--color-text)] sm:text-6xl">
                  {playlist?.name ??
                    (playlistQ.isLoading
                      ? "…"
                      : t("playlistDetail.fallback", {
                          defaultValue: "Playlist",
                        }))}
                </h1>
                {playlist?.description ? (
                  <p className="line-clamp-1 text-sm text-[var(--color-muted)]">
                    {playlist.description}
                  </p>
                ) : null}
                <p className="text-sm text-[var(--color-muted)]">
                  {t("playlistDetail.trackCount", {
                    defaultValue: "{{count}} canciones",
                    count: entries.length,
                  })}
                  {totalMs > 0 ? ` · ${formatTotal(totalMs)}` : ""}
                </p>
              </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => playAll(0)}
                disabled={entries.length === 0}
                className="inline-flex items-center gap-2.5 rounded-full bg-[var(--color-primary)] px-8 py-3.5 text-base font-bold uppercase tracking-wider text-[var(--color-primary-contrast)] shadow-[0_10px_24px_rgba(0,0,0,0.35)] transition hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Play
                  className="h-5 w-5"
                  strokeWidth={2.4}
                  fill="currentColor"
                />
                {t("playlistDetail.playAll", {
                  defaultValue: "Reproducir todo",
                })}
              </button>
              <button
                type="button"
                onClick={() => setEqOpen(true)}
                className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--color-primary)] bg-transparent px-5 py-3 text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] transition hover:bg-[var(--color-primary)]/10"
              >
                <Sliders className="h-3.5 w-3.5" strokeWidth={2.5} />
                {t("playlistDetail.editEq", {
                  defaultValue: "EQ de la playlist",
                })}
              </button>
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

        {/* Track list */}
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-8 py-10">
          <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--color-muted)]">
            {t("playlistDetail.songs", { defaultValue: "Canciones" })}
          </h2>

          {playlistQ.isLoading ? (
            <ul className="flex flex-col gap-1">
              {Array.from({ length: 6 }).map((_, i) => (
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
          ) : playlistQ.isError ? (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-[var(--color-border)] p-10 text-center">
              <p className="text-sm text-[var(--color-muted)]">
                {t("playlistDetail.loadError", {
                  defaultValue: "No se pudo cargar la playlist.",
                })}
              </p>
              <button
                type="button"
                onClick={() => playlistQ.refetch()}
                className="rounded-xl border border-[var(--color-primary)] px-5 py-2 text-sm font-medium text-[var(--color-primary)] transition hover:bg-[var(--color-secondary)]"
              >
                {t("common.retry", { defaultValue: "Reintentar" })}
              </button>
            </div>
          ) : entries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-10 text-center">
              <ListMusic
                className="mx-auto mb-2 h-8 w-8 text-[var(--color-muted)]"
                strokeWidth={1.4}
              />
              <p className="text-sm text-[var(--color-muted)]">
                {t("playlistDetail.empty", {
                  defaultValue:
                    "Esta playlist está vacía. Agregá canciones desde tu biblioteca.",
                })}
              </p>
              <button
                type="button"
                onClick={() => navigate("/library")}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--color-primary-contrast)] transition hover:scale-[1.02]"
              >
                {t("playlistDetail.browseLibrary", {
                  defaultValue: "Ir a la biblioteca",
                })}
              </button>
            </div>
          ) : (
            <ul className="flex flex-col gap-1">
              {entries.map((entry, idx) => {
                const track = entry.track;
                return (
                  <li
                    key={track.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => playFrom(track.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        playFrom(track.id);
                      }
                    }}
                    className="group flex w-full cursor-pointer items-center gap-4 rounded-lg p-3 text-left transition hover:bg-[var(--color-surface)]"
                  >
                    <span className="w-6 shrink-0 text-center text-xs font-bold text-[var(--color-muted)] group-hover:text-[var(--color-primary)]">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded bg-[var(--color-surface-alt)]">
                      {track.coverArt ? (
                        <img
                          src={track.coverArt}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <ListMusic
                          className="absolute inset-0 m-auto h-4 w-4 text-[var(--color-muted)]"
                          strokeWidth={1.6}
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[var(--color-text)]">
                        {track.title}
                      </p>
                      <p className="truncate text-xs text-[var(--color-muted)]">
                        {track.artist}
                      </p>
                    </div>
                    <span className="hidden text-xs tabular-nums text-[var(--color-muted)] sm:inline">
                      {formatDuration(track.durationMs)}
                    </span>

                    {/* Row actions — reveal on hover. */}
                    <div
                      className="flex items-center gap-0.5 opacity-0 transition group-hover:opacity-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => move(idx, -1)}
                        disabled={idx === 0 || reorder.isPending}
                        title={t("playlistDetail.moveUp", {
                          defaultValue: "Subir",
                        })}
                        className="inline-flex h-7 w-7 items-center justify-center rounded text-[var(--color-muted)] transition hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)] disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <ChevronUp className="h-4 w-4" strokeWidth={2.4} />
                      </button>
                      <button
                        type="button"
                        onClick={() => move(idx, 1)}
                        disabled={
                          idx === entries.length - 1 || reorder.isPending
                        }
                        title={t("playlistDetail.moveDown", {
                          defaultValue: "Bajar",
                        })}
                        className="inline-flex h-7 w-7 items-center justify-center rounded text-[var(--color-muted)] transition hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)] disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <ChevronDown className="h-4 w-4" strokeWidth={2.4} />
                      </button>
                      <button
                        type="button"
                        onClick={() => remove.mutate(track.id)}
                        disabled={remove.isPending}
                        title={t("playlistDetail.remove", {
                          defaultValue: "Quitar de la playlist",
                        })}
                        className="inline-flex h-7 w-7 items-center justify-center rounded text-[var(--color-muted)] transition hover:bg-rose-500/15 hover:text-rose-300 disabled:opacity-40"
                      >
                        {remove.isPending && remove.variables === track.id ? (
                          <Loader2
                            className="h-3.5 w-3.5 animate-spin"
                            strokeWidth={2.4}
                          />
                        ) : (
                          <Trash2 className="h-4 w-4" strokeWidth={2.2} />
                        )}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {playlist ? (
        <PlaylistEQModal
          open={eqOpen}
          onClose={() => setEqOpen(false)}
          playlistId={playlist.id}
          playlistName={playlist.name}
        />
      ) : null}
    </ClientLayout>
  );
}
