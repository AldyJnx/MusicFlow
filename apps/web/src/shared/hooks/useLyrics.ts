import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { getTrackLyrics } from "../api/tracks";
import { findCurrentLineIndex, parseLrc, type LyricsLine } from "../utils/lrc";
import { usePlayerStore } from "../../client/stores/playStore";

export type LyricsMode = "synced" | "plain" | "none";

export type UseLyricsResult = {
  mode: LyricsMode;
  lines: LyricsLine[];
  /** Plain text fallback. Always present when mode === 'plain'. */
  plainText: string | null;
  isLoading: boolean;
  isError: boolean;
};

/**
 * Fetches and parses the lyrics once per track. Consumers that need the
 * active line should use `useCurrentLyricsLineIndex`, whose selector only
 * changes when the line changes rather than at every audio position tick.
 */
export function useLyrics(trackId: string | null): UseLyricsResult {
  const query = useQuery({
    queryKey: ["track-lyrics", trackId],
    enabled: Boolean(trackId),
    staleTime: 5 * 60_000,
    queryFn: () => getTrackLyrics(trackId as string),
  });

  const parsed = useMemo<{
    mode: LyricsMode;
    lines: LyricsLine[];
    plainText: string | null;
  }>(() => {
    const data = query.data;
    if (!data || !data.hasLyrics) {
      return { mode: "none", lines: [], plainText: null };
    }
    if (data.lrc) {
      const lines = parseLrc(data.lrc);
      if (lines.length > 0) {
        return { mode: "synced", lines, plainText: data.text ?? null };
      }
    }
    return {
      mode: "plain",
      lines: [],
      plainText: data.text ?? data.lrc ?? null,
    };
  }, [query.data]);

  return {
    mode: parsed.mode,
    lines: parsed.lines,
    plainText: parsed.plainText,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

/** Re-renders only when playback crosses into a different timed LRC line. */
export function useCurrentLyricsLineIndex(lines: LyricsLine[]): number {
  return usePlayerStore((state) =>
    findCurrentLineIndex(lines, state.positionMs),
  );
}
