import {
  Heart,
  Maximize2,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
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
import {
  useSavedCheckQuery,
  useToggleSave,
} from "../../../shared/hooks/useLibrarySaves";
import ElasticSlider from "../../../shared/ui/reactbits/ElasticSlider";
import TimelineWithSegments from "./TimelineWithSegments";
import ArtistCredits from "./ArtistCredits";

type MiniPlayerProps = {
  /** Kept for API compatibility; the bar now docks in-flow. */
  sidebarOffset?: number;
};

function formatMs(ms: number): string {
  const total = Math.floor(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

const GRADS = [
  "linear-gradient(135deg,#7c5ce8,#e85cc0)",
  "linear-gradient(135deg,#4cf1a0,#3aa0ff)",
  "linear-gradient(135deg,#e85cc0,#ff8a5c)",
  "linear-gradient(135deg,#5c8cff,#7c5ce8)",
];
function gradOf(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 100000;
  return GRADS[h % GRADS.length];
}

export default function MiniPlayer(_: MiniPlayerProps) {
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
  const shuffle = usePlayerStore((s) => s.shuffle);
  const repeatMode = usePlayerStore((s) => s.repeatMode);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const cycleRepeat = usePlayerStore((s) => s.cycleRepeat);
  const openEqDrawer = usePlayerStore((s) => s.openEqDrawer);
  const openAiPrompt = usePlayerStore((s) => s.openAiPrompt);
  const savedCheck = useSavedCheckQuery(currentTrack ? [currentTrack.id] : []);
  const toggleSave = useToggleSave();

  const { segments } = useTrackSegments(currentTrack?.id ?? null);
  if (!currentTrack || isExpanded) return null;

  const vol = muted ? 0 : volume;
  const isSaved = savedCheck.data?.includes(currentTrack.id) ?? false;

  function toggleFavorite() {
    toggleSave.mutate({ trackId: currentTrack!.id, saved: isSaved });
  }

  return (
    <div className="sticky bottom-0 z-40 flex h-[78px] flex-none items-center gap-[18px] border-t border-[var(--color-line)] bg-[rgba(8,8,16,.62)] px-[22px] shadow-[0_-10px_40px_-20px_rgba(0,0,0,.8)] backdrop-blur-[34px]">
      {/* LEFT — cover + title + like */}
      <div className="flex w-[300px] min-w-0 flex-none items-center gap-3">
        <button
          type="button"
          onClick={toggleExpanded}
          title={t("player.expand", { defaultValue: "Abrir reproductor" })}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <span
            className="h-12 w-12 flex-none overflow-hidden rounded-xl shadow-[0_6px_18px_-6px_rgba(0,0,0,.7)] transition hover:scale-105"
            style={{ background: gradOf(currentTrack.id) }}
          >
            {currentTrack.cover ? (
              <img
                src={currentTrack.cover}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : null}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13.5px] font-bold text-[var(--color-text)]">
              {currentTrack.title}
            </span>
          </span>
        </button>
        <ArtistCredits
          track={currentTrack}
          compact
          className="min-w-0 flex-1 overflow-hidden text-[11.5px] font-medium text-[var(--color-muted)]"
        />
        <button
          type="button"
          onClick={toggleFavorite}
          disabled={toggleSave.isPending || savedCheck.isLoading}
          aria-pressed={isSaved}
          title={
            isSaved
              ? t("player.removeFavorite", {
                  defaultValue: "Quitar de favoritos",
                })
              : t("player.addFavorite", {
                  defaultValue: "Guardar en favoritos",
                })
          }
          className={`flex h-9 w-9 flex-none items-center justify-center rounded-full transition disabled:cursor-wait disabled:opacity-60 ${
            isSaved
              ? "bg-rose-500/15 text-rose-400"
              : "text-[var(--color-muted)] hover:bg-white/5 hover:text-rose-400"
          }`}
        >
          <Heart
            className="h-[18px] w-[18px]"
            fill={isSaved ? "currentColor" : "none"}
            strokeWidth={2.2}
          />
        </button>
      </div>

      {/* CENTER — transport + wave */}
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div className="flex flex-none items-center gap-3.5 text-[var(--color-muted)]">
          <button
            type="button"
            onClick={toggleShuffle}
            aria-pressed={shuffle}
            title={t("player.shuffle", { defaultValue: "Aleatorio" })}
            className={`transition ${shuffle ? "text-[var(--color-primary)]" : "hover:text-[var(--color-text)]"}`}
          >
            <Shuffle className="h-[17px] w-[17px]" strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={() => void previous()}
            title={t("player.previous", { defaultValue: "Anterior" })}
            className="text-[var(--color-text)] transition hover:opacity-80"
          >
            <SkipBack className="h-5 w-5" fill="currentColor" strokeWidth={0} />
          </button>
          <button
            type="button"
            onClick={() => void togglePlay()}
            className="flex h-[42px] w-[42px] items-center justify-center rounded-full text-white shadow-[0_8px_22px_-6px_var(--color-primary)] transition hover:scale-[1.08] active:scale-90"
            style={{
              background:
                "linear-gradient(135deg,var(--color-primary),var(--color-accent))",
            }}
            aria-label={
              isPlaying
                ? t("player.pause", { defaultValue: "Pausa" })
                : t("player.play", { defaultValue: "Play" })
            }
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" fill="currentColor" strokeWidth={0} />
            ) : (
              <Play
                className="ml-0.5 h-5 w-5"
                fill="currentColor"
                strokeWidth={0}
              />
            )}
          </button>
          <button
            type="button"
            onClick={() => void next()}
            title={t("player.next", { defaultValue: "Siguiente" })}
            className="text-[var(--color-text)] transition hover:opacity-80"
          >
            <SkipForward
              className="h-5 w-5"
              fill="currentColor"
              strokeWidth={0}
            />
          </button>
          <button
            type="button"
            onClick={cycleRepeat}
            aria-pressed={repeatMode !== "off"}
            title={t("player.repeat", { defaultValue: "Repetir" })}
            className={`transition ${repeatMode !== "off" ? "text-[var(--color-primary)]" : "hover:text-[var(--color-text)]"}`}
          >
            {repeatMode === "one" ? (
              <Repeat1 className="h-[17px] w-[17px]" strokeWidth={2} />
            ) : (
              <Repeat className="h-[17px] w-[17px]" strokeWidth={2} />
            )}
          </button>
        </div>

        <span
          className="w-[34px] flex-none text-right text-[var(--color-muted)]"
          style={{ font: "600 11px var(--font-mono)" }}
        >
          {formatMs(positionMs)}
        </span>
        <div className="min-w-0 flex-1">
          <TimelineWithSegments
            positionMs={positionMs}
            durationMs={durationMs}
            segments={segments}
            onSeek={seek}
            height={5}
          />
        </div>
        <span
          className="w-[34px] flex-none text-[var(--color-muted)]"
          style={{ font: "600 11px var(--font-mono)" }}
        >
          {formatMs(durationMs)}
        </span>
      </div>

      {/* RIGHT — download + EQ + AI + volume + expand */}
      <div className="flex w-[340px] flex-none items-center justify-end gap-3.5">
        <button
          type="button"
          onClick={openAiPrompt}
          title={t("player.openAi", { defaultValue: "Asistente IA" })}
          className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] border border-[var(--color-line)] bg-white/[0.03] text-[var(--color-accent)] transition hover:scale-105 hover:border-[color-mix(in_srgb,var(--color-accent)_50%,transparent)]"
        >
          <Sparkles className="h-4 w-4" strokeWidth={2.2} />
        </button>
        <button
          type="button"
          onClick={openEqDrawer}
          title={t("player.openEq", { defaultValue: "Ecualizar esta canción" })}
          className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] border border-[color-mix(in_srgb,var(--color-primary)_45%,transparent)] bg-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] text-[var(--color-primary)] transition hover:scale-105"
        >
          <Sliders className="h-4 w-4" strokeWidth={2.2} />
        </button>

        <ElasticSlider
          className="w-[130px]"
          value={vol}
          onChange={setVolume}
          onLeftIconClick={toggleMute}
          leftIconLabel={
            muted || vol === 0
              ? t("player.unmute", { defaultValue: "Activar sonido" })
              : t("player.mute", { defaultValue: "Silenciar" })
          }
          leftIcon={
            muted || vol === 0 ? (
              <VolumeX className="h-[17px] w-[17px]" strokeWidth={2} />
            ) : (
              <Volume2 className="h-[17px] w-[17px]" strokeWidth={2} />
            )
          }
        />

        <button
          type="button"
          onClick={toggleExpanded}
          title={t("player.expand", { defaultValue: "Expandir" })}
          className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] border border-[var(--color-line)] bg-white/[0.03] text-[var(--color-muted)] transition hover:text-[var(--color-text)]"
        >
          <Maximize2 className="h-4 w-4" strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}
