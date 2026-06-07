import type { MouseEvent } from "react";
import { useMemo, useRef } from "react";

import type { EQSegment } from "../../../shared/api/segments";

interface TimelineWithSegmentsProps {
  positionMs: number;
  durationMs: number;
  segments: EQSegment[];
  onSeek: (positionMs: number) => void;
  /** Visual height in px. Defaults to 6 (mini), use 10+ for expanded view. */
  height?: number;
  /** Stops parent click/expand handlers when the user interacts with the bar. */
  preventBubble?: boolean;
}

// Stable, audio-y palette. Cycled by segment index so adjacent segments differ.
const SEGMENT_COLORS = [
  "rgba(94, 160, 255, 0.55)", // blue
  "rgba(186, 130, 255, 0.55)", // purple
  "rgba(20, 227, 247, 0.55)", // cyan
  "rgba(255, 196, 87, 0.55)", // amber
  "rgba(255, 122, 188, 0.55)", // pink
];

function colorForSegment(index: number, label?: string | null): string {
  if (label) {
    // Hash the label so segments with the same name share a color.
    let hash = 0;
    for (let i = 0; i < label.length; i++)
      hash = (hash * 31 + label.charCodeAt(i)) | 0;
    return SEGMENT_COLORS[Math.abs(hash) % SEGMENT_COLORS.length];
  }
  return SEGMENT_COLORS[index % SEGMENT_COLORS.length];
}

/**
 * Progress bar with overlaid colored regions for EQ segments.
 * Click anywhere on the bar to seek.
 */
export default function TimelineWithSegments({
  positionMs,
  durationMs,
  segments,
  onSeek,
  height = 6,
  preventBubble = true,
}: TimelineWithSegmentsProps) {
  const barRef = useRef<HTMLDivElement>(null);

  const progressPct = useMemo(() => {
    if (durationMs <= 0) return 0;
    return Math.min(100, Math.max(0, (positionMs / durationMs) * 100));
  }, [positionMs, durationMs]);

  const segmentBlocks = useMemo(() => {
    if (durationMs <= 0 || segments.length === 0) return [];
    return segments.map((s, index) => {
      const left = Math.max(0, (s.startMs / durationMs) * 100);
      const right = Math.min(100, (s.endMs / durationMs) * 100);
      const width = Math.max(0.4, right - left);
      return {
        id: s.id,
        label: s.label ?? "Segmento",
        left,
        width,
        color: colorForSegment(index, s.label),
      };
    });
  }, [segments, durationMs]);

  function handleSeek(event: MouseEvent<HTMLDivElement>) {
    if (preventBubble) event.stopPropagation();
    const bar = barRef.current;
    if (!bar || durationMs <= 0) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.min(
      1,
      Math.max(0, (event.clientX - rect.left) / rect.width),
    );
    onSeek(ratio * durationMs);
  }

  return (
    <div
      ref={barRef}
      role="slider"
      aria-label="Posición de reproducción con segmentos de ecualización"
      aria-valuemin={0}
      aria-valuemax={Math.max(1, durationMs)}
      aria-valuenow={Math.round(positionMs)}
      onClick={handleSeek}
      className="relative w-full cursor-pointer overflow-hidden rounded-full bg-white/10"
      style={{ height }}
    >
      {/* Segment blocks (under the progress fill so they tint the future region) */}
      {segmentBlocks.map((b) => (
        <div
          key={b.id}
          title={b.label}
          aria-hidden="true"
          className="absolute top-0 h-full"
          style={{
            left: `${b.left}%`,
            width: `${b.width}%`,
            background: b.color,
          }}
        />
      ))}

      {/* Played progress fill */}
      <div
        className="absolute left-0 top-0 h-full rounded-full bg-[linear-gradient(90deg,#2f77ff_0%,#57a6ff_100%)]"
        style={{ width: `${progressPct}%` }}
      />

      {/* Segment tick lines for clearer boundaries */}
      {segmentBlocks.map((b) => (
        <div
          key={`tick-${b.id}`}
          aria-hidden="true"
          className="absolute top-0 h-full w-px bg-white/30"
          style={{ left: `${b.left}%` }}
        />
      ))}
    </div>
  );
}
