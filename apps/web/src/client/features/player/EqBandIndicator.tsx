import { useEffect, useState } from "react";

import { getAudioEngine } from "../../../audio/engine";
import type { EQSegment as EngineSegment } from "../../../audio/segments";

// Show 5 of the 10 bands (bass, low-mid, mid, high-mid, treble).
// Indexes correspond to 62Hz, 250Hz, 1kHz, 4kHz, 8kHz.
const BAND_INDEXES = [1, 3, 5, 7, 8];

// EQ band values are in dB, typically -15..+15. Map to 0..1 for bar height.
function dbToHeight(db: number): number {
  const clamped = Math.max(-15, Math.min(15, db));
  return (clamped + 15) / 30;
}

interface EqBandIndicatorProps {
  /** Visual height in px for the tallest bar. Defaults to 22. */
  size?: number;
  /** Show segment label tooltip on hover. */
  showLabel?: boolean;
}

/**
 * Tiny 5-band visualizer that reflects the EQ currently applied by the
 * SegmentScheduler. Subscribes to onSegmentChange — when no segment is active
 * the bars sit at neutral (flat).
 *
 * Lightweight: no audio analysis, just reads the bands of the active segment.
 */
export default function EqBandIndicator({
  size = 22,
  showLabel = true,
}: EqBandIndicatorProps) {
  const [activeSegment, setActiveSegment] = useState<EngineSegment | null>(
    null,
  );

  useEffect(() => {
    const engine = getAudioEngine();
    const unsubscribe = engine.segments.onSegmentChange(setActiveSegment);
    return unsubscribe;
  }, []);

  const bands = activeSegment?.bands ?? new Array(10).fill(0);
  const isActive = !!activeSegment;
  const barColor = isActive ? "#14e3f7" : "#5e91d4";
  const trackColor = "rgba(255, 255, 255, 0.08)";

  return (
    <div
      title={
        showLabel
          ? activeSegment
            ? `EQ activo: ${activeSegment.label ?? "Segmento"}`
            : "EQ por defecto"
          : undefined
      }
      aria-label={
        activeSegment
          ? `Ecualizador activo: ${activeSegment.label ?? "Segmento"}`
          : "Ecualizador en valores neutros"
      }
      className="inline-flex items-end gap-[3px]"
      style={{ height: size }}
    >
      {BAND_INDEXES.map((idx) => {
        const ratio = dbToHeight(bands[idx] ?? 0);
        // Always render a small base so the indicator doesn't disappear at 0dB
        const h = Math.max(3, ratio * size);
        return (
          <div
            key={idx}
            className="w-[3px] rounded-full transition-[height,background] duration-300 ease-out"
            style={{
              height: h,
              background: ratio === 0.5 ? trackColor : barColor,
            }}
          />
        );
      })}
    </div>
  );
}
