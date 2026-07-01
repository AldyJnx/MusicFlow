import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import { listSegments, type EQSegment } from "../api/segments";
import { getAudioEngine } from "../../audio/engine";
import type { EQSegment as EngineSegment } from "../../audio/segments";

/**
 * Pure data hook — fetches segments for a track. Safe to call from multiple
 * components: TanStack Query deduplicates the request.
 *
 * Does NOT push to the audio engine. For that, mount `useSegmentEngineSync`
 * exactly ONCE at the layout level (e.g. ClientLayout) to avoid races
 * between multiple components pushing/clearing segments concurrently.
 */
export function useTrackSegments(trackId: string | null | undefined) {
  const query = useQuery<EQSegment[]>({
    queryKey: ["track-segments", trackId],
    queryFn: () => {
      if (!trackId) return Promise.resolve<EQSegment[]>([]);
      return listSegments(trackId);
    },
    enabled: !!trackId,
    staleTime: 60_000,
  });

  return {
    segments: query.data ?? [],
    isLoading: query.isPending,
    isError: query.isError,
    refetch: query.refetch,
  };
}

/**
 * Side-effect hook — keeps the audio engine's SegmentScheduler in sync with
 * the segments fetched for the current track. Mount ONCE at the layout level.
 *
 * Pushes [] to the engine when there is no active track, so a previous
 * track's segments cannot leak into a new track's playback.
 */
export function useSegmentEngineSync(trackId: string | null | undefined) {
  const { segments } = useTrackSegments(trackId);

  useEffect(() => {
    const engineSegments: EngineSegment[] = trackId
      ? segments.map((s) => ({
          id: s.id,
          label: s.label,
          startMs: s.startMs,
          endMs: s.endMs,
          transitionMs: s.transitionMs,
          bands: s.eqConfig.bands,
          // Carry the segment's effects too, so per-segment reverb / bass boost
          // actually apply during playback (not just the 10 bands).
          effects: {
            bassBoost: s.eqConfig.bassBoost,
            virtualizer: s.eqConfig.virtualizer,
            loudness: s.eqConfig.loudness,
            reverbPreset: s.eqConfig.reverbPreset,
            reverbAmount: s.eqConfig.reverbAmount,
          },
        }))
      : [];

    getAudioEngine().segments.setSegments(engineSegments);
  }, [segments, trackId]);
}
