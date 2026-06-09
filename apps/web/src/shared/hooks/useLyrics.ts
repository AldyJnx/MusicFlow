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
  currentLineIndex: number;
  isLoading: boolean;
  isError: boolean;
};

/**
 * Fetches the lyrics for a track and, when the LRC has timestamps, returns
 * the index of the line currently being sung based on the audio playhead.
 *
 * Re-renders every time the player's `positionMs` ticks, but the parsing of
 * the raw LRC happens once per track (memoized on the payload).
 */
export function useLyrics(trackId: string | null): UseLyricsResult {
  const positionMs = usePlayerStore((s) => s.positionMs);

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

  const currentLineIndex = useMemo(() => {
    if (parsed.mode !== "synced") return -1;
    return findCurrentLineIndex(parsed.lines, positionMs);
  }, [parsed.mode, parsed.lines, positionMs]);

  return {
    mode: parsed.mode,
    lines: parsed.lines,
    plainText: parsed.plainText,
    currentLineIndex,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
