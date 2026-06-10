import { useCallback, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getMostPlayed,
  getRecentlyPlayed,
  getStats,
  recordPlay,
  type StatsPeriod,
} from "../api/analytics";
import { usePlayerStore } from "../../client/stores/playStore";

export const analyticsKeys = {
  all: ["analytics"] as const,
  recently: (limit: number) => ["analytics", "recently", limit] as const,
  most: (limit: number) => ["analytics", "most", limit] as const,
  stats: (period: StatsPeriod) => ["analytics", "stats", period] as const,
};

/** A track listened for at least 90% of its length counts as "completed". */
const COMPLETION_RATIO = 0.9;

/**
 * Records a play event when the user LEAVES a track (it changes or playback
 * stops), capturing how far they actually got so listening-time stats are
 * real rather than zero. Mount ONCE at the layout level.
 *
 * A store subscription tracks the live position of the active track; when the
 * track changes, the outgoing track is flushed with its last known position as
 * `durationListenedMs` and a completed/skipped verdict. Best-effort — failures
 * never disrupt playback.
 */
export function useRecordPlays() {
  const currentId = usePlayerStore((s) => s.currentTrack?.id ?? null);
  const qc = useQueryClient();
  // The track currently being timed, plus its latest position/duration.
  const active = useRef<{
    id: string | null;
    lastPositionMs: number;
    durationMs: number;
  }>({ id: null, lastPositionMs: 0, durationMs: 0 });

  // Keep the active track's position fresh via a direct store subscription
  // (not React state) so we never re-render on every audio frame. The id guard
  // stops a just-changed track from overwriting the outgoing position with 0.
  useEffect(() => {
    const unsub = usePlayerStore.subscribe((state) => {
      const id = state.currentTrack?.id ?? null;
      if (id && id === active.current.id) {
        active.current.lastPositionMs = state.positionMs;
        // Use the track's metadata duration (always known) rather than the
        // audio engine's, which may be 0 until the file finishes decoding.
        active.current.durationMs = state.currentTrack?.durationMs ?? 0;
      }
    });
    return unsub;
  }, []);

  const flush = useCallback(
    (entry: { id: string; lastPositionMs: number; durationMs: number }) => {
      if (!entry.id || entry.durationMs <= 0) return;
      const listened = Math.min(
        Math.max(0, Math.round(entry.lastPositionMs)),
        entry.durationMs,
      );
      const completed = listened >= entry.durationMs * COMPLETION_RATIO;
      recordPlay({
        trackId: entry.id,
        durationListenedMs: listened,
        completed,
        skipped: !completed,
        device: "WEB",
      })
        .then(() => {
          void qc.invalidateQueries({ queryKey: analyticsKeys.all });
        })
        .catch(() => {
          // Analytics is non-critical — swallow errors silently.
        });
    },
    [qc],
  );

  // On every track change, flush the previous track and start timing the new
  // one. The latest `active` ref always holds the freshest position thanks to
  // the subscription above.
  useEffect(() => {
    const prev = active.current;
    if (prev.id && prev.id !== currentId) {
      flush({ ...prev });
    }
    if (prev.id !== currentId) {
      active.current = {
        id: currentId,
        lastPositionMs: 0,
        durationMs: usePlayerStore.getState().currentTrack?.durationMs ?? 0,
      };
    }
  }, [currentId, flush]);

  // Flush the in-progress track when the player tree unmounts (e.g. logout).
  useEffect(() => {
    return () => {
      if (active.current.id) flush({ ...active.current });
    };
  }, [flush]);
}

export function useRecentlyPlayedQuery(limit = 12) {
  return useQuery({
    queryKey: analyticsKeys.recently(limit),
    queryFn: () => getRecentlyPlayed(limit),
    staleTime: 30_000,
  });
}

export function useMostPlayedQuery(limit = 12) {
  return useQuery({
    queryKey: analyticsKeys.most(limit),
    queryFn: () => getMostPlayed(limit),
    staleTime: 30_000,
  });
}

export function useListeningStatsQuery(period: StatsPeriod = "ALL_TIME") {
  return useQuery({
    queryKey: analyticsKeys.stats(period),
    queryFn: () => getStats(period),
    staleTime: 30_000,
  });
}
