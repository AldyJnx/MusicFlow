import { useEffect, useMemo } from "react";
import {
  ChevronDown,
  Pause,
  Play,
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
import TimelineWithSegments from "./TimelineWithSegments";
import EqBandIndicator from "./EqBandIndicator";
import LyricsPanel from "./LyricsPanel";
import AIDock from "./AIDock";

type ExpandedPlayerProps = {
  sidebarOffset?: number;
};

function formatMs(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
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
  const setExpanded = usePlayerStore((s) => s.setExpanded);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const toggleMute = usePlayerStore((s) => s.toggleMute);
  const seek = usePlayerStore((s) => s.seek);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const next = usePlayerStore((s) => s.next);
  const previous = usePlayerStore((s) => s.previous);
  const openEqDrawer = usePlayerStore((s) => s.openEqDrawer);

  const { segments } = useTrackSegments(currentTrack?.id ?? null);
  const isMuted = muted || volume === 0;

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

  return (
    <section
      className="fixed bottom-0 right-0 top-0 z-50 overflow-hidden"
      style={{
        left: `${sidebarOffset}px`,
        background:
          "radial-gradient(120% 80% at 0% 0%, var(--color-surface-alt) 0%, var(--color-page) 60%, var(--color-page) 100%)",
      }}
    >
      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-[-14%] mx-auto h-[420px] w-[420px] rounded-full bg-[var(--color-primary)]/10 blur-3xl" />
        <div className="absolute bottom-[-10%] left-[6%] h-[320px] w-[320px] rounded-full bg-[var(--color-accent)]/10 blur-3xl" />
        <div className="absolute right-[8%] top-[28%] h-[280px] w-[280px] rounded-full bg-[var(--color-cta-end)]/10 blur-3xl" />
      </div>

      <div className="relative flex h-full flex-col px-6 pb-6 pt-5 xl:px-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-text)]"
            aria-label={t("player.collapse")}
          >
            <ChevronDown className="h-5 w-5" strokeWidth={2.3} />
          </button>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-accent)]" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[var(--color-muted)]">
              {t("player.nowPlaying")}
            </p>
          </div>
          <div className="w-10" />
        </div>

        {/* Main 3-panel grid */}
        <div className="mt-5 grid min-h-0 flex-1 grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_minmax(300px,360px)]">
          {/* LEFT: Cover + meta + controls + timeline */}
          <div className="flex min-h-0 flex-col rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)]/70 p-6 backdrop-blur-xl">
            <div className="mx-auto w-full max-w-sm">
              <div className="relative aspect-square overflow-hidden rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface-alt)] shadow-[0_28px_70px_rgba(0,0,0,0.38)]">
                {currentTrack.cover ? (
                  <img
                    src={currentTrack.cover}
                    alt={currentTrack.title}
                    className="h-full w-full object-cover"
                  />
                ) : null}
                {/* Vinyl-ish glow ring */}
                <div className="absolute inset-0 rounded-[28px] ring-1 ring-inset ring-white/5" />
              </div>
            </div>

            <div className="mt-6 text-center">
              <h1 className="text-3xl font-semibold tracking-tight text-[var(--color-text)]">
                {currentTrack.title}
              </h1>
              <div className="mt-2 flex items-center justify-center gap-2 text-sm text-[var(--color-muted)]">
                <span>{currentTrack.artist}</span>
                <span className="h-1 w-1 rounded-full bg-[var(--color-muted)]" />
                <EqBandIndicator size={22} />
              </div>
              {activeSegment ? (
                <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-accent)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
                  {t("player.activeSegment")}:{" "}
                  {activeSegment.label || t("player.segment")}
                </span>
              ) : null}
            </div>

            {/* Timeline with segment markers */}
            <div className="mt-6">
              <TimelineWithSegments
                positionMs={positionMs}
                durationMs={durationMs}
                segments={segments}
                onSeek={seek}
                height={9}
                preventBubble={false}
              />
              <div className="mt-2 flex items-center justify-between text-[11px] font-medium tabular-nums text-[var(--color-muted)]">
                <span>{formatMs(positionMs)}</span>
                <span>{formatMs(durationMs)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="mt-5 flex items-center justify-center gap-6 text-[var(--color-muted)]">
              <button
                type="button"
                onClick={() => void previous()}
                className="inline-flex h-10 w-10 items-center justify-center transition hover:text-[var(--color-text)]"
                aria-label={t("player.previous")}
              >
                <SkipBack className="h-5 w-5" strokeWidth={2.4} />
              </button>
              <button
                type="button"
                onClick={() => void togglePlay()}
                className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-page)] shadow-[0_14px_30px_rgba(0,0,0,0.32)] transition hover:scale-[1.05]"
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
                className="inline-flex h-10 w-10 items-center justify-center transition hover:text-[var(--color-text)]"
                aria-label={t("player.next")}
              >
                <SkipForward className="h-5 w-5" strokeWidth={2.4} />
              </button>
            </div>

            {/* Secondary actions */}
            <div className="mt-5 flex items-center justify-between gap-3 text-[var(--color-muted)]">
              <button
                type="button"
                onClick={openEqDrawer}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 text-xs font-semibold text-[var(--color-text)] transition hover:border-[var(--color-primary)]"
              >
                <Sliders className="h-3.5 w-3.5" strokeWidth={2.3} />
                {t("player.openEq")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setExpanded(false);
                  navigate("/segments");
                }}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 text-xs font-semibold text-[var(--color-text)] transition hover:border-[var(--color-accent)]"
              >
                <Scissors className="h-3.5 w-3.5" strokeWidth={2.3} />
                {t("nav.segments")}
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleMute}
                  className="inline-flex h-8 w-8 items-center justify-center transition hover:text-[var(--color-text)]"
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
                  className="expanded-player-slider h-1 w-24 cursor-pointer appearance-none rounded-full bg-[var(--color-surface-alt)]"
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
          box-shadow: 0 0 0 2px var(--color-surface);
        }
        .expanded-player-slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 9999px;
          background: var(--color-primary);
          border: 0;
          box-shadow: 0 0 0 2px var(--color-surface);
        }
      `}</style>
    </section>
  );
}
