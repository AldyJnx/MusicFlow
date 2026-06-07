import { useEffect } from "react";
import {
  Bot,
  ChevronDown,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Sliders,
  Volume2,
  VolumeX,
} from "lucide-react";
import { usePlayerStore } from "../../stores/playStore";
import { useTrackSegments } from "../../../shared/hooks/useTrackSegments";
import TimelineWithSegments from "./TimelineWithSegments";
import EqBandIndicator from "./EqBandIndicator";

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
  const openAiPrompt = usePlayerStore((s) => s.openAiPrompt);

  const { segments } = useTrackSegments(currentTrack?.id ?? null);
  const isMuted = muted || volume === 0;

  useEffect(() => {
    if (!isExpanded) return undefined;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setExpanded(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isExpanded, setExpanded]);

  if (!currentTrack || !isExpanded) {
    return null;
  }

  return (
    <section
      className="fixed bottom-0 right-0 top-0 z-50 overflow-hidden bg-[radial-gradient(circle_at_top,#244b73_0%,#0a1626_38%,#07111c_100%)]"
      style={{ left: `${sidebarOffset}px` }}
      onClick={() => setExpanded(false)}
    >
      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-[-14%] mx-auto h-[420px] w-[420px] rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute bottom-[-10%] left-[6%] h-[320px] w-[320px] rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute right-[8%] top-[28%] h-[280px] w-[280px] rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      <div
        className="relative flex min-h-full flex-col px-8 pb-10 pt-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/8 bg-white/[0.03] text-[#9fb6df] transition hover:border-white/15 hover:text-white"
          >
            <ChevronDown className="h-5 w-5" strokeWidth={2.3} />
          </button>
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#5e91d4]">
            Expanded Player
          </p>
          <div className="w-11" />
        </div>

        {/* Main content */}
        <div className="mx-auto flex w-full max-w-[1220px] flex-1 items-center justify-center">
          <div className="grid w-full items-center gap-12 lg:grid-cols-[480px_minmax(0,1fr)]">
            {/* Cover art */}
            <div className="mx-auto w-full max-w-[480px]">
              <div className="overflow-hidden rounded-[30px] border border-white/8 bg-[#07121c] shadow-[0_28px_70px_rgba(0,0,0,0.38)]">
                {currentTrack.cover ? (
                  <img
                    src={currentTrack.cover}
                    alt={currentTrack.title}
                    className="aspect-square w-full object-cover"
                  />
                ) : (
                  <div className="aspect-square w-full bg-white/5" />
                )}
              </div>
            </div>

            {/* Controls column */}
            <div className="mx-auto flex w-full max-w-[580px] flex-col justify-center">
              {/* Title / artist */}
              <div className="text-center lg:text-left">
                <p className="text-xs font-semibold uppercase tracking-[0.36em] text-[#5ea0ff]">
                  Now Playing
                </p>
                <h1 className="mt-4 text-5xl font-semibold tracking-tight text-white">
                  {currentTrack.title}
                </h1>
                <div className="mt-4 inline-flex items-center gap-3 text-lg text-[#9fb6df]">
                  <span>{currentTrack.artist}</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-[#2f77ff]" />
                  <EqBandIndicator size={28} />
                </div>
              </div>

              {/* Seek bar with segment markers */}
              <div className="mt-10">
                <TimelineWithSegments
                  positionMs={positionMs}
                  durationMs={durationMs}
                  segments={segments}
                  onSeek={seek}
                  height={10}
                  preventBubble={false}
                />
                <div className="mt-3 flex items-center justify-between text-xs font-medium text-[#6b83a9]">
                  <span>{formatMs(positionMs)}</span>
                  <span>{formatMs(durationMs)}</span>
                </div>
              </div>

              {/* Playback controls */}
              <div className="mt-2 grid grid-cols-[40px_40px_68px_40px_40px] items-center justify-center gap-5 text-[#6fa9ff]">
                {/* Empty slot — reserved for Heart (other lane) */}
                <div className="h-9 w-9" />

                <button
                  type="button"
                  onClick={() => void previous()}
                  className="inline-flex h-10 w-10 items-center justify-center justify-self-center transition hover:text-white"
                >
                  <SkipBack className="h-5 w-5" strokeWidth={2.5} />
                </button>

                <button
                  type="button"
                  onClick={() => void togglePlay()}
                  className="inline-flex h-[68px] w-[68px] items-center justify-center justify-self-center rounded-full bg-white text-[#0f1724] shadow-[0_12px_26px_rgba(255,255,255,0.14)] transition hover:scale-[1.02]"
                >
                  {isPlaying ? (
                    <Pause className="h-7 w-7" strokeWidth={2.4} />
                  ) : (
                    <Play className="ml-0.5 h-7 w-7" strokeWidth={2.4} />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => void next()}
                  className="inline-flex h-10 w-10 items-center justify-center justify-self-center transition hover:text-white"
                >
                  <SkipForward className="h-5 w-5" strokeWidth={2.5} />
                </button>

                {/* Empty slot — reserved for Repeat (other lane) */}
                <div className="h-9 w-9" />
              </div>

              {/* Action buttons */}
              <div className="mx-auto mt-10 flex w-fit flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={openAiPrompt}
                  className="inline-flex h-11 min-w-[224px] items-center justify-center gap-2 rounded-xl bg-[linear-gradient(90deg,#386cf9_0%,#18c4e6_100%)] px-5 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(37,99,235,0.2)] transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[#14e3f7]/60"
                >
                  <Bot className="h-4 w-4" strokeWidth={2.3} />
                  Ajustar con IA
                </button>
                <button
                  type="button"
                  onClick={openEqDrawer}
                  className="inline-flex h-11 min-w-[184px] items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-5 text-sm font-semibold text-[#b4c2da] transition hover:bg-white/[0.04] focus:outline-none focus:ring-2 focus:ring-[#14e3f7]/40"
                >
                  <Sliders className="h-4 w-4" strokeWidth={2.2} />
                  Editar EQ
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Volume widget */}
        <div className="group absolute bottom-8 right-8">
          <div className="absolute bottom-14 left-1/2 -translate-x-1/2 translate-y-2 opacity-0 transition duration-200 group-hover:translate-y-0 group-hover:opacity-100">
            <div className="pointer-events-auto flex h-36 w-12 items-center justify-center rounded-2xl border border-white/10 bg-[#0f1b2c]/95 shadow-[0_14px_34px_rgba(0,0,0,0.32)] backdrop-blur">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="expanded-player-volume h-24 w-1.5 cursor-pointer appearance-none rounded-full bg-white/10"
                style={{ writingMode: "vertical-lr" }}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={toggleMute}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-[#8fa6cc] transition hover:text-white"
            aria-label={isMuted ? "Activar sonido" : "Silenciar"}
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4" strokeWidth={2.2} />
            ) : (
              <Volume2 className="h-4 w-4" strokeWidth={2.2} />
            )}
          </button>
        </div>
      </div>

      <style>{`
        .expanded-player-volume {
          transform: rotate(180deg);
        }
        .expanded-player-volume::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 9999px;
          background: #53bfff;
          border: 0;
          box-shadow: 0 0 0 3px rgba(83, 191, 255, 0.16);
        }
        .expanded-player-volume::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 9999px;
          background: #53bfff;
          border: 0;
          box-shadow: 0 0 0 3px rgba(83, 191, 255, 0.16);
        }
        .expanded-player-volume::-webkit-slider-runnable-track {
          border-radius: 9999px;
        }
        .expanded-player-volume::-moz-range-track {
          border-radius: 9999px;
        }
      `}</style>
    </section>
  );
}
