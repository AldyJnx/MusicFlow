import { Music4, Play } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useSavedTracksQuery } from "../../../shared/hooks/useLibrarySaves";
import { usePreferences } from "../../../shared/hooks/usePreferences";
import { usePlayerStore, type PlayerTrack } from "../../stores/playStore";
import type { Track } from "../../../shared/api/tracks";

type NumberedTrackListProps = {
  /** How many rows to show. The mock uses ~7, defaults match. */
  limit?: number;
};

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
 * Compact numbered list of the user's saved tracks, styled like the mock's
 * `.menu_song` block. Hidden when collapsed (the LikedSongsItem above
 * already represents the user's saves in icon-only mode).
 */
export default function NumberedTrackList({
  limit = 7,
}: NumberedTrackListProps) {
  const { t } = useTranslation();
  const savedQ = useSavedTracksQuery({ take: limit });
  const playTrackList = usePlayerStore((s) => s.playTrackList);
  const { density } = usePreferences();
  const tracks = savedQ.data?.tracks ?? [];

  // Compact density tightens padding, cover, and font sizes by ~15%. We use
  // class swaps (not transform scale) so hit targets remain accessible and
  // the surrounding sidebar doesn't render dead whitespace.
  const isCompact = density === "compact";
  const rowPad = isCompact ? "p-1" : "p-1.5";
  const cover = isCompact ? "h-7 w-7" : "h-8 w-8";
  const titleText = isCompact ? "text-[10px]" : "text-[11px]";
  const subText = isCompact ? "text-[8px]" : "text-[9px]";
  const idxText = isCompact ? "text-[9px]" : "text-[10px]";

  // Play within the saved-tracks list so prev/next can move through it.
  function play(track: Track) {
    const playable = tracks
      .map(toPlayerTrack)
      .filter((p): p is PlayerTrack => p !== null);
    if (playable.length === 0) return;
    const idx = playable.findIndex((p) => p.id === track.id);
    void playTrackList(playable, Math.max(0, idx));
  }

  if (savedQ.isLoading) {
    return (
      <div className="flex flex-col gap-1.5 px-2 pt-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2 rounded-md p-1.5">
            <div className="h-3 w-4 animate-pulse rounded bg-[var(--color-surface-alt)]" />
            <div className="h-8 w-8 animate-pulse rounded bg-[var(--color-surface-alt)]" />
            <div className="h-3 flex-1 animate-pulse rounded bg-[var(--color-surface-alt)]" />
          </div>
        ))}
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="mx-2 mt-1 rounded-lg border border-dashed border-[var(--color-border)] p-3 text-center">
        <Music4
          className="mx-auto mb-1 h-4 w-4 text-[var(--color-muted)]"
          strokeWidth={1.6}
        />
        <p className="text-[11px] text-[var(--color-muted)]">
          {t("sidebar.numbered.empty", {
            defaultValue: "Aún no guardaste canciones",
          })}
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-0.5 px-2 pt-1">
      {tracks.map((track, idx) => (
        <li key={track.id}>
          <button
            type="button"
            onClick={() => play(track)}
            className={`group flex w-full items-center gap-2 rounded-md text-left transition hover:bg-[var(--color-surface-alt)] ${rowPad}`}
            title={`${track.title} — ${track.artist}`}
          >
            <span
              className={`w-5 shrink-0 text-center font-bold text-[var(--color-muted)] ${idxText}`}
            >
              {String(idx + 1).padStart(2, "0")}
            </span>
            <div
              className={`relative shrink-0 overflow-hidden rounded bg-[var(--color-surface-alt)] ${cover}`}
            >
              {track.coverArt ? (
                <img
                  src={track.coverArt}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <Music4
                  className="absolute inset-0 m-auto h-4 w-4 text-[var(--color-muted)]"
                  strokeWidth={1.6}
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p
                className={`truncate font-semibold leading-tight text-[var(--color-text)] ${titleText}`}
              >
                {track.title}
              </p>
              <p
                className={`truncate leading-tight text-[var(--color-muted)] ${subText}`}
              >
                {track.artist}
              </p>
            </div>
            <Play
              className="h-3.5 w-3.5 shrink-0 text-[var(--color-primary)] opacity-0 transition group-hover:opacity-100"
              strokeWidth={2.4}
              fill="currentColor"
            />
          </button>
        </li>
      ))}
    </ul>
  );
}
