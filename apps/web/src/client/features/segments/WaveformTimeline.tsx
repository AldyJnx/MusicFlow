import { useCallback, useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import type { EQSegment } from "../../../shared/api/segments";

const SEGMENT_COLORS = [
  "rgba(59, 130, 246, 0.55)", // blue
  "rgba(139, 92, 246, 0.55)", // violet
  "rgba(16, 185, 129, 0.55)", // emerald
  "rgba(245, 158, 11, 0.55)", // amber
] as const;

interface Props {
  /** Public URL to the audio file (track.fileUrlRemote). */
  audioUrl: string | null;
  /**
   * Pre-computed normalized peaks (-1..1). When provided, wavesurfer renders
   * directly from peaks without downloading or decoding the audio — orders of
   * magnitude lighter for long WAVs.
   */
  precomputedPeaks?: number[] | null;
  /** Track duration in ms — used as fallback while waveform is loading. */
  durationMs: number;
  segments: EQSegment[];
  addingMode: boolean;
  onSegmentClick: (seg: EQSegment) => void;
  onDragComplete: (startMs: number, endMs: number) => void;
}

interface DragState {
  startX: number;
  currentX: number;
}

/**
 * WaveSurfer-backed timeline. Audio waveform decoded in the browser; segment
 * overlays drawn on top as absolute-positioned divs. The drag-to-create flow
 * lives on the same overlay layer.
 *
 * The WaveSurfer instance is decoupled from the playback engine on purpose —
 * we don't want to fight the SegmentScheduler over who's driving the audio.
 * This is preview-only audio for marking sections.
 */
export default function WaveformTimeline({
  audioUrl,
  precomputedPeaks,
  durationMs,
  segments,
  addingMode,
  onSegmentClick,
  onDragComplete,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WaveSurfer | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  );

  // (Re)create WaveSurfer when audio URL or peaks change.
  useEffect(() => {
    if (!containerRef.current) {
      setStatus("idle");
      return;
    }
    if (!audioUrl && (!precomputedPeaks || precomputedPeaks.length === 0)) {
      setStatus("idle");
      return;
    }

    setStatus("loading");
    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "rgba(148, 163, 184, 0.45)",
      progressColor: "rgba(59, 130, 246, 0.85)",
      cursorColor: "rgba(20, 227, 247, 0.9)",
      cursorWidth: 1,
      barWidth: 2,
      barGap: 1,
      barRadius: 1,
      height: 96,
      normalize: true,
      // We render our own cursor sync from the audio engine; disable
      // wavesurfer's own interactions so we own the timeline UX.
      interact: false,
    });
    wsRef.current = ws;

    // Ignore the error event AbortError emitted by `ws.destroy()` during the
    // cleanup of the previous effect (React StrictMode double-mounts effects
    // in dev). Without this guard the stale handler would set status="error"
    // on the new wavesurfer instance after it had already become ready.
    let alive = true;
    const isAbort = (err: unknown) => {
      if (!err) return false;
      const name = (err as { name?: string }).name;
      const msg = String((err as Error)?.message ?? err);
      return name === "AbortError" || /aborted/i.test(msg);
    };

    ws.on("ready", () => {
      if (alive) setStatus("ready");
    });
    ws.on("error", (err) => {
      if (!alive || isAbort(err)) return;
      console.warn("[WaveformTimeline] wavesurfer error", err);
      setStatus("error");
    });

    if (precomputedPeaks && precomputedPeaks.length > 0) {
      // Fast path: render directly from peaks, no audio download.
      // wavesurfer v7 accepts (url, peaks, duration); pass an empty string for
      // url so it doesn't try to fetch — duration comes from the track.
      const durationSec = durationMs / 1000;
      ws.load("", [precomputedPeaks], durationSec).catch((err) => {
        if (!alive || isAbort(err)) return;
        console.warn("[WaveformTimeline] peaks render failed", err);
        setStatus("error");
      });
    } else if (audioUrl) {
      // Slow path: download and decode.
      ws.load(audioUrl).catch((err) => {
        if (!alive || isAbort(err)) return;
        console.warn("[WaveformTimeline] load failed", err);
        setStatus("error");
      });
    }

    return () => {
      alive = false;
      ws.destroy();
      wsRef.current = null;
    };
  }, [audioUrl, precomputedPeaks, durationMs]);

  // ── Drag-to-create ────────────────────────────────────────────────────────
  const toMs = useCallback(
    (clientX: number): number => {
      if (!railRef.current) return 0;
      const rect = railRef.current.getBoundingClientRect();
      const ratio = Math.max(
        0,
        Math.min(1, (clientX - rect.left) / rect.width),
      );
      return Math.round(ratio * durationMs);
    },
    [durationMs],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!addingMode || !railRef.current) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      const rect = railRef.current.getBoundingClientRect();
      setDrag({
        startX: e.clientX - rect.left,
        currentX: e.clientX - rect.left,
      });
    },
    [addingMode],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!drag || !railRef.current) return;
      const rect = railRef.current.getBoundingClientRect();
      setDrag((prev) =>
        prev ? { ...prev, currentX: e.clientX - rect.left } : prev,
      );
    },
    [drag],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!drag || !railRef.current) return;
      e.currentTarget.releasePointerCapture(e.pointerId);
      const rect = railRef.current.getBoundingClientRect();
      const startMs = Math.round((drag.startX / rect.width) * durationMs);
      const endMs = toMs(e.clientX);
      setDrag(null);
      const [lo, hi] = startMs < endMs ? [startMs, endMs] : [endMs, startMs];
      if (hi - lo > 500) onDragComplete(lo, hi);
    },
    [drag, toMs, durationMs, onDragComplete],
  );

  const railWidth = railRef.current?.getBoundingClientRect().width ?? 0;
  const dragLeftPct =
    drag && railWidth > 0
      ? `${(Math.min(drag.startX, drag.currentX) / railWidth) * 100}%`
      : "0%";
  const dragWidthPct =
    drag && railWidth > 0
      ? `${(Math.abs(drag.currentX - drag.startX) / railWidth) * 100}%`
      : "0%";

  return (
    <div className="relative">
      {/* Waveform background. wavesurfer mounts its own <canvas> inside. */}
      <div
        ref={containerRef}
        className="pointer-events-none w-full rounded-xl bg-[var(--color-surface-alt)]"
        style={{ minHeight: 96 }}
      />

      {/* No audio URL → friendly hint */}
      {!audioUrl && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl border border-dashed border-[var(--color-border)] text-xs text-[var(--color-muted)]">
          Esta canción no tiene URL de audio sincronizada todavía.
        </div>
      )}

      {/* Loading / error overlays */}
      {audioUrl && status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-[var(--color-muted)]">
          Decodificando waveform…
        </div>
      )}
      {audioUrl && status === "error" && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-rose-300">
          No se pudo cargar el audio.
        </div>
      )}

      {/* Interaction rail layered on top of the waveform. We give it the same
          height so the segment overlays align pixel-perfectly. */}
      <div
        ref={railRef}
        className={`absolute inset-x-0 top-0 h-24 select-none ${
          addingMode ? "cursor-crosshair" : "cursor-default"
        }`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {/* Segment overlays */}
        {segments.map((seg, i) => {
          const left = (seg.startMs / durationMs) * 100;
          const width = ((seg.endMs - seg.startMs) / durationMs) * 100;
          const fill = SEGMENT_COLORS[i % SEGMENT_COLORS.length];
          const isHovered = hoveredId === seg.id;
          return (
            <div
              key={seg.id}
              className="absolute inset-y-0 flex cursor-pointer items-end justify-center rounded-md border border-white/20 transition hover:brightness-110"
              style={{
                left: `${left}%`,
                width: `${width}%`,
                backgroundColor: fill,
              }}
              onClick={(e) => {
                e.stopPropagation();
                onSegmentClick(seg);
              }}
              onMouseEnter={() => setHoveredId(seg.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <span className="mb-1 truncate px-1 text-[10px] font-bold text-white drop-shadow">
                {seg.label || ""}
              </span>

              {isHovered && (
                <div className="absolute bottom-full left-1/2 z-50 mb-1 -translate-x-1/2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs shadow-xl">
                  <p className="font-semibold text-[var(--color-text)]">
                    {seg.label || "(sin nombre)"}
                  </p>
                  <p className="text-[var(--color-muted)]">
                    {formatTime(seg.startMs)} → {formatTime(seg.endMs)}
                  </p>
                </div>
              )}
            </div>
          );
        })}

        {/* Drag overlay (preview while user holds pointer) */}
        {drag && (
          <div
            className="pointer-events-none absolute inset-y-0 rounded-md bg-cyan-400/30 ring-1 ring-cyan-300/60"
            style={{ left: dragLeftPct, width: dragWidthPct }}
          />
        )}
      </div>
    </div>
  );
}

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}
