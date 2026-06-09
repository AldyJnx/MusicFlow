import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useTrackSegments } from "../../../shared/hooks/useTrackSegments";

type SegmentPreviewProps = {
  trackId: string | null;
  durationMs: number;
  /** Height of the strip in px. */
  height?: number;
};

/**
 * Maps a segment label to a deterministic hue so the strip is visually
 * varied (intro/verso/coro look different) without committing to a fixed
 * vocabulary. Falls back to a neutral hue when there's no label.
 */
function hueForLabel(label: string | null): number {
  if (!label) return 200;
  let h = 0;
  for (let i = 0; i < label.length; i++) {
    h = (h * 31 + label.charCodeAt(i)) % 360;
  }
  return h;
}

/**
 * Compact horizontal strip showing a track's segments coloured by label.
 * Designed for the home hero — shows MusicFlow's segmented-EQ signature
 * even before the user starts playback.
 *
 * Renders nothing when the track has no segments yet, so it never shows an
 * empty bar that the user can't explain.
 */
export default function SegmentPreview({
  trackId,
  durationMs,
  height = 14,
}: SegmentPreviewProps) {
  const { t } = useTranslation();
  const { segments, isLoading } = useTrackSegments(trackId);

  const total = durationMs > 0 ? durationMs : 1;

  const pieces = useMemo(() => {
    if (segments.length === 0) return [];
    return segments
      .filter((s) => s.endMs > s.startMs)
      .map((s) => {
        const start = Math.max(0, Math.min(1, s.startMs / total));
        const end = Math.max(0, Math.min(1, s.endMs / total));
        const widthPct = Math.max(0, (end - start) * 100);
        const hue = hueForLabel(s.label);
        return {
          id: s.id,
          label:
            s.label ?? t("home.segmentUnnamed", { defaultValue: "Segmento" }),
          leftPct: start * 100,
          widthPct,
          color: `hsl(${hue} 75% 55%)`,
        };
      });
  }, [segments, total, t]);

  if (isLoading || !trackId) return null;
  if (pieces.length === 0) return null;

  return (
    <div
      className="relative w-full max-w-md overflow-hidden rounded-full bg-[var(--color-surface-alt)]"
      style={{ height }}
      role="img"
      aria-label={t("home.segmentMapAria", {
        defaultValue: "Mapa de segmentos del track",
      })}
    >
      {pieces.map((p) => (
        <span
          key={p.id}
          title={p.label}
          className="absolute top-0 h-full transition-opacity hover:opacity-90"
          style={{
            left: `${p.leftPct}%`,
            width: `${p.widthPct}%`,
            backgroundColor: p.color,
          }}
        />
      ))}
    </div>
  );
}
