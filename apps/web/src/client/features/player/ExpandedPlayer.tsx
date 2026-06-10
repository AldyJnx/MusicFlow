import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  Image as ImageIcon,
  Mic2,
  Pause,
  Play,
  Power,
  Scissors,
  SkipBack,
  SkipForward,
  Sliders,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { usePlayerStore } from "../../stores/playStore";
import { useTrackSegments } from "../../../shared/hooks/useTrackSegments";
import { usePreferences } from "../../../shared/hooks/usePreferences";
import { useEqualizer } from "../../../shared/hooks/useEqualizer";
import { useLyrics } from "../../../shared/hooks/useLyrics";
import TimelineWithSegments from "./TimelineWithSegments";
import Wave from "./Wave";

type ExpandedPlayerProps = {
  sidebarOffset?: number;
};

type View = "cover" | "lyrics";

function formatMs(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/**
 * True when any band carries a non-trivial gain. 0.5 dB threshold avoids
 * flicker from Web Audio float-precision noise.
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
  const openAiPrompt = usePlayerStore((s) => s.openAiPrompt);
  const toggleEqBypass = usePlayerStore((s) => s.toggleEqBypass);

  const { segments } = useTrackSegments(currentTrack?.id ?? null);
  const { showWave } = usePreferences();
  const { bands, syncFromEngine } = useEqualizer();
  const isMuted = muted || volume === 0;

  const [view, setView] = useState<View>("cover");

  // Keep the local copy of bands aligned with the engine so the EQ pill
  // stays truthful no matter which path wrote to it (preset, AI, segment).
  useEffect(() => {
    if (!isExpanded) return;
    syncFromEngine();
  }, [isExpanded, segments, positionMs, syncFromEngine]);

  const eqActive = !eqBypassed && hasActiveEq(bands);
  const hasEqCurveStashed = eqBypassed;

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
      {/* ── Backdrop — cover blurred to a colored matte ───────────────── */}
      {currentTrack.cover ? (
        <div
          aria-hidden="true"
          className="absolute inset-0 scale-125"
          style={{
            backgroundImage: `url(${currentTrack.cover})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(100px) saturate(180%)",
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-[var(--color-page)]" />
      )}
      {/* Deep darkening so titles + controls stay legible on any art. */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.85) 100%)",
        }}
      />

      <div className="relative flex h-full flex-col px-6 py-5 xl:px-10">
        {/* ── Header ───────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/30 text-white/80 backdrop-blur transition hover:border-[var(--color-primary)] hover:text-white"
            aria-label={t("player.collapse")}
          >
            <ChevronDown className="h-5 w-5" strokeWidth={2.3} />
          </button>

          {/* Track title in the header — a quiet anchor so the user knows
              what they're looking at without competing with the artwork. */}
          <div className="flex min-w-0 flex-col items-center gap-1 px-4">
            <p className="truncate text-sm font-semibold text-white">
              {currentTrack.title}
            </p>
            <div className="flex items-center gap-2">
              {showWave ? <Wave active={isPlaying} size={12} /> : null}
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-accent)]" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-white/70">
                {t("player.nowPlaying")}
              </p>
            </div>
          </div>

          {/* View toggle: Cover vs Lyrics. Pill-style segmented control. */}
          <div className="inline-flex rounded-full border border-white/10 bg-black/30 p-1 backdrop-blur">
            <ViewPill
              active={view === "cover"}
              onClick={() => setView("cover")}
              icon={<ImageIcon className="h-3.5 w-3.5" strokeWidth={2.3} />}
              label={t("player.viewCover", { defaultValue: "Portada" })}
            />
            <ViewPill
              active={view === "lyrics"}
              onClick={() => setView("lyrics")}
              icon={<Mic2 className="h-3.5 w-3.5" strokeWidth={2.3} />}
              label={t("player.viewLyrics", { defaultValue: "Letra" })}
            />
          </div>
        </div>

        {/* ── Main view ─────────────────────────────────────────────── */}
        <div className="mt-6 flex min-h-0 flex-1 flex-col">
          {view === "cover" ? (
            <CoverView
              cover={currentTrack.cover}
              title={currentTrack.title}
              artist={currentTrack.artist}
              activeSegmentLabel={activeSegment?.label ?? null}
              t={t}
            />
          ) : (
            <LyricsKaraoke trackId={currentTrack.id} seek={seek} />
          )}
        </div>

        {/* ── Bottom bar: timeline + controls + sound-detail strip ──── */}
        <div className="mt-4 flex flex-col gap-3">
          <div>
            <TimelineWithSegments
              positionMs={positionMs}
              durationMs={durationMs}
              segments={segments}
              onSeek={seek}
              height={6}
              preventBubble={false}
            />
            <div className="mt-1.5 flex items-center justify-between text-[11px] font-medium tabular-nums text-white/60">
              <span>{formatMs(positionMs)}</span>
              <span>{formatMs(durationMs)}</span>
            </div>
          </div>

          {/* Transport */}
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

          {/* Sound detail strip — EQ status + bypass, EQ drawer, segments,
              AI, volume. Translucent so the cover/lyrics breathe through. */}
          <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-2.5 backdrop-blur-md">
            <button
              type="button"
              onClick={toggleEqBypass}
              disabled={!eqActive && !hasEqCurveStashed}
              title={
                eqBypassed
                  ? t("player.eqBypassResume", { defaultValue: "Reanudar EQ" })
                  : eqActive
                    ? t("player.eqBypassPause", {
                        defaultValue: "Pausar EQ (mantener curva)",
                      })
                    : t("player.eqInactive", {
                        defaultValue: "Sin EQ activo",
                      })
              }
              aria-pressed={eqActive}
              className={`group inline-flex items-center gap-2 rounded-xl border-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition ${
                eqActive
                  ? "border-[var(--color-primary)] bg-[var(--color-primary)]/15 text-[var(--color-primary)] shadow-[0_0_24px_-6px_var(--color-primary)]"
                  : hasEqCurveStashed
                    ? "border-white/30 bg-transparent text-white/70"
                    : "border-white/10 bg-transparent text-white/40"
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
              <Power className="h-3 w-3" strokeWidth={2.6} />
              {eqActive
                ? t("player.eqOn", { defaultValue: "EQ encendido" })
                : hasEqCurveStashed
                  ? t("player.eqPaused", { defaultValue: "EQ en pausa" })
                  : t("player.eqOff", { defaultValue: "Sin EQ" })}
            </button>

            <button
              type="button"
              onClick={openEqDrawer}
              title={t("player.openEq")}
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 text-[10px] font-semibold uppercase tracking-wider text-white/85 transition hover:border-[var(--color-primary)] hover:text-white"
            >
              <Sliders className="h-3.5 w-3.5" strokeWidth={2.4} />
              <span className="sr-only xl:not-sr-only">
                {t("player.openEq")}
              </span>
            </button>

            <button
              type="button"
              onClick={openSegmentsForCurrentTrack}
              title={t("player.editSegments", {
                defaultValue: "Editar segmentos del track",
              })}
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 text-[10px] font-semibold uppercase tracking-wider text-white/85 transition hover:border-[var(--color-accent)] hover:text-white"
            >
              <Scissors className="h-3.5 w-3.5" strokeWidth={2.4} />
              <span className="sr-only xl:not-sr-only">
                {t("nav.segments")}
              </span>
            </button>

            <button
              type="button"
              onClick={openAiPrompt}
              title={t("player.openAi", { defaultValue: "Pedirle a la IA" })}
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-[var(--color-accent)]/60 bg-[var(--color-accent)]/10 px-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-accent)] transition hover:bg-[var(--color-accent)]/20"
            >
              <Sparkles className="h-3.5 w-3.5" strokeWidth={2.4} />
              <span className="sr-only xl:not-sr-only">
                {t("player.askAi", { defaultValue: "Ajustar con IA" })}
              </span>
            </button>

            {/* Volume cluster */}
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

function ViewPill({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition ${
        active ? "bg-white/95 text-black" : "text-white/70 hover:text-white"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

/**
 * "Cover" view — the album art is the protagonist. Cover sits centered and
 * large, with the title + artist + active-segment chip clustered just below.
 */
function CoverView({
  cover,
  title,
  artist,
  activeSegmentLabel,
  t,
}: {
  cover: string | null | undefined;
  title: string;
  artist: string;
  activeSegmentLabel: string | null;
  t: (key: string, opts?: { defaultValue?: string }) => string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6">
      <div className="relative w-full max-w-[min(60vh,520px)]">
        <div className="relative aspect-square overflow-hidden rounded-[28px] shadow-[0_40px_120px_rgba(0,0,0,0.65)] ring-1 ring-white/10">
          {cover ? (
            <img
              src={cover}
              alt={title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-white/5 text-white/30">
              <Sliders className="h-20 w-20" strokeWidth={1.2} />
            </div>
          )}
          {activeSegmentLabel ? (
            <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-accent)] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-primary-contrast)] shadow-[0_8px_20px_rgba(0,0,0,0.4)]">
              <Scissors className="h-3 w-3" strokeWidth={2.6} />
              {activeSegmentLabel || t("player.segment")}
            </div>
          ) : null}
        </div>
      </div>
      <div className="text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-[0_2px_16px_rgba(0,0,0,0.7)]">
          {title}
        </h1>
        <p className="mt-2 text-base text-white/75">{artist}</p>
      </div>
    </div>
  );
}

/**
 * "Lyrics" view — karaoke-style. The active line is large + bright, past
 * lines fade, upcoming lines hint at what's next. Auto-scroll keeps the
 * active line centered. Click any line to seek there.
 */
function LyricsKaraoke({
  trackId,
  seek,
}: {
  trackId: string | null;
  seek: (ms: number) => void;
}) {
  const { mode, lines, plainText, currentLineIndex, isLoading } =
    useLyrics(trackId);
  const activeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (mode !== "synced" || currentLineIndex < 0) return;
    activeRef.current?.scrollIntoView({
      block: "center",
      behavior: "smooth",
    });
  }, [mode, currentLineIndex]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-white/60">
        Cargando letra…
      </div>
    );
  }

  if (mode === "none") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
        <Mic2 className="h-10 w-10 text-white/30" strokeWidth={1.5} />
        <p className="text-sm text-white/60">
          Esta canción aún no tiene letra.
        </p>
      </div>
    );
  }

  if (mode === "plain") {
    return (
      <div className="mx-auto w-full max-w-2xl overflow-y-auto px-4 text-center text-2xl font-medium leading-[1.6] text-white/80">
        <pre className="whitespace-pre-wrap font-sans">{plainText}</pre>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col overflow-y-auto px-4 py-12">
      {lines.map((line, i) => {
        const isActive = i === currentLineIndex;
        const isPast = i < currentLineIndex;
        return (
          <button
            key={`${line.timeMs}-${i}`}
            ref={isActive ? activeRef : undefined}
            type="button"
            onClick={() => seek(line.timeMs)}
            className={`w-full rounded-lg px-2 py-3 text-left transition ${
              isActive
                ? "text-4xl font-bold leading-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]"
                : isPast
                  ? "text-xl font-semibold leading-snug text-white/40 hover:text-white/70"
                  : "text-xl font-semibold leading-snug text-white/55 hover:text-white/85"
            }`}
          >
            {line.text || "♪"}
          </button>
        );
      })}
    </div>
  );
}
