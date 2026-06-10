import type { MouseEvent } from "react";
import { useMemo } from "react";
import {
  Maximize2,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Sliders,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { usePlayerStore } from "../../stores/playStore";
import { useTrackSegments } from "../../../shared/hooks/useTrackSegments";
import { usePreferences } from "../../../shared/hooks/usePreferences";
import { usePremiumGate } from "../../../shared/hooks/usePremiumGate";
import TimelineWithSegments from "./TimelineWithSegments";
import EqBandIndicator from "./EqBandIndicator";
import Wave from "./Wave";

type MiniPlayerProps = {
  sidebarOffset?: number;
};

function formatMs(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export default function MiniPlayer({ sidebarOffset = 0 }: MiniPlayerProps) {
  const { t } = useTranslation();
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isExpanded = usePlayerStore((s) => s.isExpanded);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const positionMs = usePlayerStore((s) => s.positionMs);
  const durationMs = usePlayerStore((s) => s.durationMs);
  const volume = usePlayerStore((s) => s.volume);
  const muted = usePlayerStore((s) => s.muted);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const toggleMute = usePlayerStore((s) => s.toggleMute);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const seek = usePlayerStore((s) => s.seek);
  const toggleExpanded = usePlayerStore((s) => s.toggleExpanded);
  const next = usePlayerStore((s) => s.next);
  const previous = usePlayerStore((s) => s.previous);
  const openEqDrawer = usePlayerStore((s) => s.openEqDrawer);
  const openAiPrompt = usePlayerStore((s) => s.openAiPrompt);

  const { segments } = useTrackSegments(currentTrack?.id ?? null);
  const { showWave, playerLayout } = usePreferences();
  const { guard } = usePremiumGate();

  // `auto` maps to the existing layout (expanded). `compact` shrinks padding,
  // cover, controls and hides the redundant expand button (clicking the bar
  // already expands the player).
  const isCompact = playerLayout === "compact";

  // The chip surfaces the segment under the playhead — this is one of the
  // core MusicFlow differentiators, so we keep it visible even in the
  // collapsed bar.
  const activeSegment = useMemo(
    () =>
      segments.find((s) => positionMs >= s.startMs && positionMs < s.endMs) ??
      null,
    [segments, positionMs],
  );

  function preventExpand(event: MouseEvent<HTMLElement>) {
    event.stopPropagation();
  }

  if (!currentTrack || isExpanded) {
    return null;
  }

  return (
    <div
      className="fixed bottom-4 right-0 z-40 px-6"
      style={{ left: `${sidebarOffset}px` }}
      onClick={toggleExpanded}
      role="button"
      tabIndex={0}
      aria-label={t("player.expand", { defaultValue: "Open full player" })}
    >
      <div
        className={`mx-auto grid w-[min(100%,1120px)] cursor-pointer grid-cols-[minmax(0,1.1fr)_minmax(360px,1.4fr)_minmax(220px,1fr)] items-center gap-5 rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)]/95 shadow-[0_20px_50px_rgba(0,0,0,0.32)] backdrop-blur-xl ${
          isCompact ? "px-3 py-2" : "px-5 py-3.5"
        }`}
      >
        {/* Track info + segment chip + optional wave */}
        <div className="flex min-w-0 items-center gap-3">
          {showWave ? (
            <div className="shrink-0" onClick={preventExpand}>
              <Wave active={isPlaying} size={isCompact ? 12 : 16} />
            </div>
          ) : null}
          {currentTrack.cover ? (
            <img
              src={currentTrack.cover}
              alt={currentTrack.title}
              className={`shrink-0 rounded-xl object-cover ring-1 ring-[var(--color-border)] ${
                isCompact ? "h-10 w-10" : "h-14 w-14"
              }`}
            />
          ) : (
            <div
              className={`shrink-0 rounded-xl bg-[var(--color-surface-alt)] ${
                isCompact ? "h-10 w-10" : "h-14 w-14"
              }`}
            />
          )}
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-semibold tracking-tight text-[var(--color-text)]">
              {currentTrack.title}
            </h2>
            <div className="mt-0.5 flex items-center gap-2 truncate">
              <p className="truncate text-xs text-[var(--color-muted)]">
                {currentTrack.artist}
              </p>
              {activeSegment ? (
                <span
                  className="inline-flex items-center gap-1 rounded-full border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-accent)]"
                  title={t("player.activeSegment", {
                    defaultValue: "Active segment",
                  })}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
                  {activeSegment.label ||
                    t("player.segment", { defaultValue: "Segment" })}
                </span>
              ) : null}
            </div>
          </div>
          <div onClick={preventExpand} className="shrink-0">
            <EqBandIndicator size={22} />
          </div>
        </div>

        {/* Controls + progress */}
        <div className="flex min-w-0 flex-col items-center gap-2">
          <div className="flex items-center gap-4 text-[var(--color-muted)]">
            <button
              type="button"
              onClick={(e) => {
                preventExpand(e);
                void previous();
              }}
              className="transition hover:text-[var(--color-text)]"
              aria-label={t("player.previous", { defaultValue: "Previous" })}
            >
              <SkipBack className="h-4 w-4" strokeWidth={2.4} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                preventExpand(e);
                void togglePlay();
              }}
              className={`inline-flex items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-page)] shadow-[0_8px_20px_rgba(0,0,0,0.28)] transition hover:scale-[1.05] ${
                isCompact ? "h-8 w-8" : "h-10 w-10"
              }`}
              aria-label={
                isPlaying
                  ? t("player.pause", { defaultValue: "Pause" })
                  : t("player.play", { defaultValue: "Play" })
              }
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" strokeWidth={2.6} />
              ) : (
                <Play className="ml-0.5 h-4 w-4" strokeWidth={2.6} />
              )}
            </button>
            <button
              type="button"
              onClick={(e) => {
                preventExpand(e);
                void next();
              }}
              className="transition hover:text-[var(--color-text)]"
              aria-label={t("player.next", { defaultValue: "Next" })}
            >
              <SkipForward className="h-4 w-4" strokeWidth={2.4} />
            </button>
          </div>

          <div
            className="flex w-full items-center gap-3"
            onClick={preventExpand}
          >
            <span className="w-9 text-right text-[10px] font-medium tabular-nums text-[var(--color-muted)]">
              {formatMs(positionMs)}
            </span>
            <div className="flex-1">
              <TimelineWithSegments
                positionMs={positionMs}
                durationMs={durationMs}
                segments={segments}
                onSeek={seek}
                height={5}
              />
            </div>
            <span className="w-9 text-[10px] font-medium tabular-nums text-[var(--color-muted)]">
              {formatMs(durationMs)}
            </span>
          </div>
        </div>

        {/* AI + EQ + Volume + Expand */}
        <div className="flex min-w-0 items-center justify-end gap-2 text-[var(--color-muted)]">
          <button
            type="button"
            onClick={(e) => {
              preventExpand(e);
              guard("ai", openAiPrompt);
            }}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] text-[var(--color-accent)] transition hover:border-[var(--color-accent)]"
            aria-label={t("player.openAi", { defaultValue: "Ask AI" })}
            title={t("player.openAi", { defaultValue: "Ask AI" })}
          >
            <Sparkles className="h-3.5 w-3.5" strokeWidth={2.4} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              preventExpand(e);
              openEqDrawer();
            }}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-text)]"
            aria-label={t("player.openEq", { defaultValue: "Open EQ" })}
            title={t("player.openEq", { defaultValue: "Open EQ" })}
          >
            <Sliders className="h-3.5 w-3.5" strokeWidth={2.4} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              preventExpand(e);
              toggleMute();
            }}
            className="inline-flex h-8 w-8 items-center justify-center transition hover:text-[var(--color-text)]"
            aria-label={
              muted || volume === 0
                ? t("player.unmute", { defaultValue: "Unmute" })
                : t("player.mute", { defaultValue: "Mute" })
            }
          >
            {muted || volume === 0 ? (
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
            value={muted ? 0 : volume}
            onClick={preventExpand}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="mini-player-slider h-1 w-20 cursor-pointer appearance-none rounded-full bg-[var(--color-surface-alt)]"
            aria-label={t("player.volume", { defaultValue: "Volume" })}
          />
          {!isCompact ? (
            <button
              type="button"
              onClick={(e) => {
                preventExpand(e);
                toggleExpanded();
              }}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-text)]"
              aria-label={t("player.expand", { defaultValue: "Expand" })}
              title={t("player.expand", { defaultValue: "Expand" })}
            >
              <Maximize2 className="h-3.5 w-3.5" strokeWidth={2.3} />
            </button>
          ) : null}
        </div>
      </div>

      <style>{`
        .mini-player-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 11px;
          height: 11px;
          border-radius: 9999px;
          background: var(--color-primary);
          border: 0;
          box-shadow: 0 0 0 2px var(--color-surface);
        }

        .mini-player-slider::-moz-range-thumb {
          width: 11px;
          height: 11px;
          border-radius: 9999px;
          background: var(--color-primary);
          border: 0;
          box-shadow: 0 0 0 2px var(--color-surface);
        }
      `}</style>
    </div>
  );
}
