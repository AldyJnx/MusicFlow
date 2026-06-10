import { useEffect, useMemo } from "react";
import {
  ChevronDown,
  Pause,
  Play,
  Power,
  Scissors,
  SkipBack,
  SkipForward,
  Sliders,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { usePlayerStore } from "../../stores/playStore";
import { useTrackSegments } from "../../../shared/hooks/useTrackSegments";
import { usePreferences } from "../../../shared/hooks/usePreferences";
import { useEqualizer } from "../../../shared/hooks/useEqualizer";
import TimelineWithSegments from "./TimelineWithSegments";
import LyricsPanel from "./LyricsPanel";
import AIDock from "./AIDock";
import Wave from "./Wave";

type ExpandedPlayerProps = {
  sidebarOffset?: number;
};

function formatMs(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/**
 * True when any band carries a non-trivial gain. We use 0.5 dB instead of 0
 * exact so the indicator doesn't flicker on float-precision noise from the
 * Web Audio engine.
 */
function hasActiveEq(bands: number[]): boolean {
  return bands.some((b) => Math.abs(b) > 0.5);
}

export default function ExpandedPlayer({
  sidebarOffset = 0,
}: ExpandedPlayerProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isExpanded = usePlayerStore((s) => s.isExpanded);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const positionMs = usePlayerStore((s) => s.positionMs);
  const durationMs = usePlayerStore((s) => s.durationMs);
  const volume = usePlayerStore((s) => s.volume);
  const muted = usePlayerStore((s) => s.muted);
  const eqBypassed = usePlayerStore((s) => s.eqBypassed);
  const setExpanded = usePlayerStore((s) => s.setExpanded);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const toggleMute = usePlayerStore((s) => s.toggleMute);
  const seek = usePlayerStore((s) => s.seek);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const next = usePlayerStore((s) => s.next);
  const previous = usePlayerStore((s) => s.previous);
  const openEqDrawer = usePlayerStore((s) => s.openEqDrawer);
  const toggleEqBypass = usePlayerStore((s) => s.toggleEqBypass);

  const { segments } = useTrackSegments(currentTrack?.id ?? null);
  const { showWave } = usePreferences();
  const { bands, syncFromEngine } = useEqualizer();
  const isMuted = muted || volume === 0;

  // Keep the local hook copy in sync with the engine so the "EQ encendido"
  // indicator reflects reality whether the curve came from a preset, an
  // AI accept, a segment, or manual sliders.
  useEffect(() => {
    if (!isExpanded) return;
    syncFromEngine();
    // Re-pull when entering a segment in case its EQ overrides the track one.
  }, [isExpanded, segments, positionMs, syncFromEngine]);

  const eqActive = !eqBypassed && hasActiveEq(bands);
  const hasEqCurveStashed = eqBypassed; // curve held in store stash

  const activeSegment = useMemo(
    () =>
      segments.find((s) => positionMs >= s.startMs && positionMs < s.endMs) ??
      null,
    [segments, positionMs],
  );

  useEffect(() => {
    if (!isExpanded) return undefined;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setExpanded(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isExpanded, setExpanded]);

  if (!currentTrack || !isExpanded) return null;

  function openSegmentsForCurrentTrack() {
    if (!currentTrack) return;
    setExpanded(false);
    navigate(`/segments?track=${encodeURIComponent(currentTrack.id)}`);
  }

  return (
    <section
      className="fixed bottom-0 right-0 top-0 z-50 overflow-hidden"
      style={{ left: `${sidebarOffset}px` }}
    >
      {/* ── Backdrop: blurred cover stretched edge-to-edge ──────────────── */}
      {currentTrack.cover ? (
        <div
          aria-hidden="true"
          className="absolute inset-0 scale-110"
          style={{
            backgroundImage: `url(${currentTrack.cover})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(48px) saturate(140%)",
            opacity: 0.55,
          }}
        />
      ) : null}
      {/* Two-layer gradient: keeps text legible regardless of cover color. */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.85) 100%)",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(80% 60% at 50% 110%, var(--color-page) 0%, transparent 70%)",
        }}
      />

      <div className="relative flex h-full flex-col px-6 pb-6 pt-5 xl:px-10">
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/30 text-white/80 backdrop-blur transition hover:border-[var(--color-primary)] hover:text-white"
            aria-label={t("player.collapse")}
          >
            <ChevronDown className="h-5 w-5" strokeWidth={2.3} />
          </button>
          <div className="flex items-center gap-3">
            {showWave ? <Wave active={isPlaying} size={16} /> : null}
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-accent)]" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-white/70">
              {t("player.nowPlaying")}
            </p>
          </div>
          <div className="w-10" />
        </div>

        {/* ── Main 3-panel grid ───────────────────────────────────────── */}
        <div className="mt-5 grid min-h-0 flex-1 grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_minmax(300px,360px)]">
          {/* LEFT: Cover protagonist + meta + controls + timeline */}
          <div className="flex min-h-0 flex-col gap-5">
            {/* Cover — large, sharp, centered. Drops a glow that picks up
                the dominant color via box-shadow. */}
            <div className="mx-auto w-full max-w-[420px]">
              <div className="relative aspect-square overflow-hidden rounded-[28px] shadow-[0_40px_80px_rgba(0,0,0,0.5)] ring-1 ring-white/10">
                {currentTrack.cover ? (
                  <img
                    src={currentTrack.cover}
                    alt={currentTrack.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[var(--color-surface-alt)] text-white/30">
                    <Sliders className="h-16 w-16" strokeWidth={1.5} />
                  </div>
                )}
                {/* Active-segment ribbon over the cover so the user sees in
                    one glance that this part of the track has a custom EQ. */}
                {activeSegment ? (
                  <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-accent)] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-primary-contrast)] shadow-[0_8px_20px_rgba(0,0,0,0.4)]">
                    <Scissors className="h-3 w-3" strokeWidth={2.6} />
                    {activeSegment.label || t("player.segment")}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="text-center">
              <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]">
                {currentTrack.title}
              </h1>
              <p className="mt-1 text-sm text-white/70">
                {currentTrack.artist}
              </p>
            </div>

            {/* Timeline with segment markers */}
            <div>
              <TimelineWithSegments
                positionMs={positionMs}
                durationMs={durationMs}
                segments={segments}
                onSeek={seek}
                height={9}
                preventBubble={false}
              />
              <div className="mt-2 flex items-center justify-between text-[11px] font-medium tabular-nums text-white/60">
                <span>{formatMs(positionMs)}</span>
                <span>{formatMs(durationMs)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-6 text-white/80">
              <button
                type="button"
                onClick={() => void previous()}
                className="inline-flex h-10 w-10 items-center justify-center transition hover:text-white"
                aria-label={t("player.previous")}
              >
                <SkipBack className="h-5 w-5" strokeWidth={2.4} />
              </button>
              <button
                type="button"
                onClick={() => void togglePlay()}
                className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-primary-contrast)] shadow-[0_14px_30px_rgba(0,0,0,0.4)] transition hover:scale-[1.05]"
                aria-label={isPlaying ? t("player.pause") : t("player.play")}
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6" strokeWidth={2.6} />
                ) : (
                  <Play className="ml-0.5 h-6 w-6" strokeWidth={2.6} />
                )}
              </button>
              <button
                type="button"
                onClick={() => void next()}
                className="inline-flex h-10 w-10 items-center justify-center transition hover:text-white"
                aria-label={t("player.next")}
              >
                <SkipForward className="h-5 w-5" strokeWidth={2.4} />
              </button>
            </div>

            {/* ── Sound details strip ──────────────────────────────────
                EQ status pill (with bypass toggle), Segments shortcut,
                Open EQ, Mute + Volume. Sits at the very bottom and is
                semi-transparent so the cover still feels protagonist. */}
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/30 p-3 backdrop-blur-md">
              {/* EQ status + bypass */}
              <button
                type="button"
                onClick={toggleEqBypass}
                disabled={!eqActive && !hasEqCurveStashed}
                title={
                  eqBypassed
                    ? t("player.eqBypassResume", {
                        defaultValue: "Reanudar EQ",
                      })
                    : eqActive
                      ? t("player.eqBypassPause", {
                          defaultValue: "Pausar EQ (mantener curva)",
                        })
                      : t("player.eqInactive", {
                          defaultValue: "Sin EQ activo",
                        })
                }
                aria-pressed={eqActive}
                className={`group inline-flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-xs font-bold uppercase tracking-wider transition ${
                  eqActive
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)]/15 text-[var(--color-primary)] shadow-[0_0_24px_-6px_var(--color-primary)]"
                    : hasEqCurveStashed
                      ? "border-white/30 bg-transparent text-white/60"
                      : "border-white/10 bg-transparent text-white/30"
                }`}
              >
                <span
                  className={`relative inline-flex h-2 w-2 rounded-full ${
                    eqActive ? "bg-[var(--color-primary)]" : "bg-white/40"
                  }`}
                >
                  {eqActive ? (
                    <span className="absolute inset-0 animate-ping rounded-full bg-[var(--color-primary)]/60" />
                  ) : null}
                </span>
                <Power className="h-3.5 w-3.5" strokeWidth={2.6} />
                {eqActive
                  ? t("player.eqOn", { defaultValue: "EQ encendido" })
                  : hasEqCurveStashed
                    ? t("player.eqPaused", { defaultValue: "EQ en pausa" })
                    : t("player.eqOff", { defaultValue: "Sin EQ" })}
              </button>

              {/* Open EQ drawer */}
              <button
                type="button"
                onClick={openEqDrawer}
                title={t("player.openEq")}
                className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 text-[10px] font-semibold uppercase tracking-wider text-white/85 transition hover:border-[var(--color-primary)] hover:text-white"
              >
                <Sliders className="h-3.5 w-3.5" strokeWidth={2.4} />
                <span className="sr-only xl:not-sr-only">
                  {t("player.openEq")}
                </span>
              </button>

              {/* Segments for THIS track */}
              <button
                type="button"
                onClick={openSegmentsForCurrentTrack}
                title={t("player.editSegments", {
                  defaultValue: "Editar segmentos del track",
                })}
                className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 text-[10px] font-semibold uppercase tracking-wider text-white/85 transition hover:border-[var(--color-accent)] hover:text-white"
              >
                <Scissors className="h-3.5 w-3.5" strokeWidth={2.4} />
                <span className="sr-only xl:not-sr-only">
                  {t("nav.segments")}
                </span>
              </button>

              {/* Volume */}
              <div className="flex items-center gap-2 text-white/80">
                <button
                  type="button"
                  onClick={toggleMute}
                  className="inline-flex h-8 w-8 items-center justify-center transition hover:text-white"
                  aria-label={isMuted ? t("player.unmute") : t("player.mute")}
                >
                  {isMuted ? (
                    <VolumeX className="h-4 w-4" strokeWidth={2.2} />
                  ) : (
                    <Volume2 className="h-4 w-4" strokeWidth={2.2} />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="expanded-player-slider h-1 w-24 cursor-pointer appearance-none rounded-full bg-white/10"
                  aria-label={t("player.volume")}
                />
              </div>
            </div>
          </div>

          {/* CENTER: Lyrics */}
          <div className="min-h-0">
            <LyricsPanel trackId={currentTrack.id} />
          </div>

          {/* RIGHT: AI Dock */}
          <div className="min-h-0">
            <AIDock trackId={currentTrack.id} />
          </div>
        </div>
      </div>

      <style>{`
        .expanded-player-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 9999px;
          background: var(--color-primary);
          border: 0;
          box-shadow: 0 0 0 2px rgba(0,0,0,0.55);
        }
        .expanded-player-slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 9999px;
          background: var(--color-primary);
          border: 0;
          box-shadow: 0 0 0 2px rgba(0,0,0,0.55);
        }
      `}</style>
    </section>
  );
}
