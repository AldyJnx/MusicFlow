import type { MouseEvent } from "react";
import {
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import { usePlayerStore } from "../../stores/playStore";
import { useTrackSegments } from "../../../shared/hooks/useTrackSegments";
import TimelineWithSegments from "./TimelineWithSegments";
import EqBandIndicator from "./EqBandIndicator";

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

  const { segments } = useTrackSegments(currentTrack?.id ?? null);

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
    >
      <div className="mx-auto grid w-[min(100%,1040px)] cursor-pointer grid-cols-[minmax(0,1fr)_minmax(360px,1.2fr)_minmax(180px,1fr)] items-center gap-4 rounded-[24px] border border-white/6 bg-[#12202d] px-5 py-4 shadow-[0_20px_50px_rgba(0,0,0,0.32)] backdrop-blur">
        {/* Track info */}
        <div className="flex min-w-0 items-center gap-3">
          {currentTrack.cover ? (
            <img
              src={currentTrack.cover}
              alt={currentTrack.title}
              className="h-14 w-14 rounded-xl object-cover"
            />
          ) : (
            <div className="h-14 w-14 rounded-xl bg-white/10" />
          )}
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-xl font-semibold tracking-tight text-white">
              {currentTrack.title}
            </h2>
            <p className="truncate text-sm text-[#5ea0ff]">
              {currentTrack.artist}
            </p>
          </div>
          <div onClick={preventExpand} className="shrink-0">
            <EqBandIndicator size={22} />
          </div>
        </div>

        {/* Controls + progress */}
        <div className="flex min-w-0 flex-col items-center gap-2.5">
          <div className="flex items-center gap-5 text-slate-400">
            <button
              type="button"
              onClick={(e) => {
                preventExpand(e);
                void previous();
              }}
              className="transition hover:text-white"
            >
              <SkipBack className="h-4 w-4" strokeWidth={2.4} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                preventExpand(e);
                void togglePlay();
              }}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#111827] shadow-[0_8px_20px_rgba(255,255,255,0.14)] transition hover:scale-[1.02]"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" strokeWidth={2.5} />
              ) : (
                <Play className="ml-0.5 h-5 w-5" strokeWidth={2.5} />
              )}
            </button>
            <button
              type="button"
              onClick={(e) => {
                preventExpand(e);
                void next();
              }}
              className="transition hover:text-white"
            >
              <SkipForward className="h-4 w-4" strokeWidth={2.4} />
            </button>
          </div>

          <div
            className="flex w-full items-center gap-3"
            onClick={preventExpand}
          >
            <span className="w-9 text-right text-xs font-medium text-slate-500">
              {formatMs(positionMs)}
            </span>
            <div className="flex-1">
              <TimelineWithSegments
                positionMs={positionMs}
                durationMs={durationMs}
                segments={segments}
                onSeek={seek}
                height={6}
              />
            </div>
            <span className="w-9 text-xs font-medium text-slate-500">
              {formatMs(durationMs)}
            </span>
          </div>
        </div>

        {/* Volume */}
        <div className="flex min-w-0 items-center justify-end gap-3 text-slate-400">
          <button
            type="button"
            onClick={(e) => {
              preventExpand(e);
              toggleMute();
            }}
            className="inline-flex h-8 w-8 items-center justify-center self-center transition hover:text-white"
          >
            {muted || volume === 0 ? (
              <VolumeX className="h-4 w-4" strokeWidth={2.2} />
            ) : (
              <Volume2 className="h-4 w-4" strokeWidth={2.2} />
            )}
          </button>
          <div className="flex h-8 items-center">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={muted ? 0 : volume}
              onClick={preventExpand}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="mini-player-slider h-1 w-24 cursor-pointer appearance-none rounded-full bg-white/10 align-middle"
            />
          </div>
        </div>
      </div>

      <style>{`
        .mini-player-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 9999px;
          background: #6da8ff;
          border: 0;
          box-shadow: 0 0 0 2px rgba(109, 168, 255, 0.15);
        }

        .mini-player-slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 9999px;
          background: #6da8ff;
          border: 0;
          box-shadow: 0 0 0 2px rgba(109, 168, 255, 0.15);
        }
      `}</style>
    </div>
  );
}
