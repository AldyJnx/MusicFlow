import { useQueries } from "@tanstack/react-query";

import { usePlayerStore } from "../../client/stores/playStore";
import {
  getConfigByScope,
  resolveConfig,
  type EQConfig,
  type EQScopeType,
} from "../api/equalizer";
import { listSegments } from "../api/segments";

export type CascadeScopeId = "global" | "playlist" | "track" | "segment";

export interface CascadeLevel {
  id: CascadeScopeId;
  /** True when the level's context exists (e.g. a playlist is playing). */
  available: boolean;
  /** True when a saved config/segment exists for this level in context. */
  active: boolean;
  /** The most-specific active level — the one that actually shapes playback. */
  isWinner: boolean;
}

const SCOPE_OF: Record<Exclude<CascadeScopeId, "segment">, EQScopeType> = {
  global: "GLOBAL",
  playlist: "PLAYLIST",
  track: "TRACK",
};

/**
 * Resolves the live EQ cascade (Global → Playlist → Pista → Segmento) for the
 * currently-playing context. Tells the UI which levels have a saved config and
 * which one wins — the visual contract of "lo más específico gana".
 *
 * The backend owns G/P/T resolution via `resolveConfig`; segment EQ overrides
 * on top during playback, so a track with segments wins over any G/P/T config.
 */
export function useEqCascade() {
  const trackId = usePlayerStore((s) => s.currentTrack?.id ?? null);
  const playlistId = usePlayerStore((s) => s.currentPlaylistId);

  const results = useQueries({
    queries: [
      {
        queryKey: ["eq", "config", "GLOBAL"],
        queryFn: () => getConfigByScope("GLOBAL"),
      },
      {
        queryKey: ["eq", "config", "PLAYLIST", playlistId],
        queryFn: () => getConfigByScope("PLAYLIST", playlistId ?? undefined),
        enabled: !!playlistId,
      },
      {
        queryKey: ["eq", "config", "TRACK", trackId],
        queryFn: () => getConfigByScope("TRACK", trackId ?? undefined),
        enabled: !!trackId,
      },
      {
        queryKey: ["eq", "segments", trackId],
        queryFn: () => listSegments(trackId as string),
        enabled: !!trackId,
      },
      {
        queryKey: ["eq", "resolve", trackId, playlistId],
        queryFn: () =>
          resolveConfig(trackId as string, playlistId ?? undefined),
        enabled: !!trackId,
      },
    ],
  });

  const [globalQ, playlistQ, trackQ, segmentsQ, resolveQ] = results;
  const globalCfg = globalQ.data as EQConfig | null | undefined;
  const playlistCfg = playlistQ.data as EQConfig | null | undefined;
  const trackCfg = trackQ.data as EQConfig | null | undefined;
  const segments = segmentsQ.data ?? [];
  const resolved = resolveQ.data as EQConfig | null | undefined;

  const hasPlaylist = !!playlistId;
  const hasTrack = !!trackId;

  const activeMap: Record<CascadeScopeId, boolean> = {
    global: !!globalCfg,
    playlist: hasPlaylist && !!playlistCfg,
    track: hasTrack && !!trackCfg,
    segment: hasTrack && segments.length > 0,
  };

  // Winner = most-specific active level. Segment EQ overrides G/P/T at
  // playback, so it wins when the track has segments. Otherwise trust the
  // backend's G/P/T resolution.
  let winner: CascadeScopeId | null = null;
  if (activeMap.segment) {
    winner = "segment";
  } else if (resolved) {
    const fromScope: Record<EQScopeType, CascadeScopeId> = {
      GLOBAL: "global",
      PLAYLIST: "playlist",
      TRACK: "track",
    };
    winner = fromScope[resolved.scopeType];
  } else if (activeMap.global) {
    winner = "global";
  }

  const levels: CascadeLevel[] = (
    ["global", "playlist", "track", "segment"] as CascadeScopeId[]
  ).map((id) => ({
    id,
    available: id === "global" || (id === "playlist" ? hasPlaylist : hasTrack),
    active: activeMap[id],
    isWinner: winner === id,
  }));

  return {
    levels,
    segmentCount: segments.length,
    isLoading: results.some((r) => r.isPending && r.fetchStatus !== "idle"),
    scopeType: SCOPE_OF,
    /** Raw saved configs per level — for loading into the editor. */
    configs: {
      global: globalCfg ?? null,
      playlist: playlistCfg ?? null,
      track: trackCfg ?? null,
    },
    /** Current playback context — the scopeIds for save/load. */
    context: { playlistId, trackId },
  };
}
