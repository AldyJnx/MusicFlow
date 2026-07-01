import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ListMusic,
  ListPlus,
  Mic2,
  Pause,
  Play,
  Power,
  Repeat,
  Repeat1,
  Scissors,
  Shuffle,
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
import { usePremiumGate } from "../../../shared/hooks/usePremiumGate";
import TimelineWithSegments from "./TimelineWithSegments";
import Wave from "./Wave";
import AddToPlaylistModal from "../playlists/AddToPlaylistModal";
import ElasticSlider from "../../../shared/ui/reactbits/ElasticSlider";

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
  const shuffle = usePlayerStore((s) => s.shuffle);
  const repeatMode = usePlayerStore((s) => s.repeatMode);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const cycleRepeat = usePlayerStore((s) => s.cycleRepeat);
  const openEqDrawer = usePlayerStore((s) => s.openEqDrawer);
  const openAiPrompt = usePlayerStore((s) => s.openAiPrompt);
  const openQueueDrawer = usePlayerStore((s) => s.openQueueDrawer);
  const toggleEqBypass = usePlayerStore((s) => s.toggleEqBypass);
  const queueLength = usePlayerStore((s) => s.queue.length);
  const queueIndex = usePlayerStore((s) => s.queueIndex);
  const upcomingCount = Math.max(0, queueLength - queueIndex - 1);

  const { segments } = useTrackSegments(currentTrack?.id ?? null);
  const { showWave } = usePreferences();
  const { bands, syncFromEngine } = useEqualizer();
  const { guard } = usePremiumGate();
  const isMuted = muted || volume === 0;

  const [view, setView] = useState<View>("cover");
  const [addToPlaylistOpen, setAddToPlaylistOpen] = useState(false);
  const [volumeOpen, setVolumeOpen] = useState(false);

  const activeSegment = useMemo(
    () =>
      segments.find((s) => positionMs >= s.startMs && positionMs < s.endMs) ??
      null,
    [segments, positionMs],
  );

  // Keep the local copy of bands aligned with the engine so the EQ pill
  // stays truthful no matter which path wrote to it (preset, AI, segment).
  // We deliberately depend on `activeSegment?.id` instead of `positionMs`
  // so we only re-sync when the *logical* state changes — depending on
  // positionMs would re-run every audio frame and re-render forever.
  const activeSegmentId = activeSegment?.id ?? null;
  useEffect(() => {
    if (!isExpanded) return;
    syncFromEngine();
  }, [isExpanded, activeSegmentId, syncFromEngine]);

  const eqActive = !eqBypassed && hasActiveEq(bands);
  const hasEqCurveStashed = eqBypassed;

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
    guard("segments", () => {
      setExpanded(false);
      navigate(`/segments?track=${encodeURIComponent(currentTrack.id)}`);
    });
  }

  function tryOpenAi() {
    guard("ai", openAiPrompt);
  }

  return (
    <section
      className="fixed bottom-0 right-0 top-0 z-50 overflow-hidden"
      style={{ left: `${sidebarOffset}px` }}
    >
      {/* ── Backdrop stack ──────────────────────────────────────────────
          Three opaque layers so nothing of the underlying page can leak
          through, even under translucent UI elements above:
          1) solid page background (defeat all transparency)
          2) colored matte from the cover (blurred + saturated)
          3) dark gradient for text legibility                            */}
      <div className="absolute inset-0 bg-[var(--color-page)]" />
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
      ) : null}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.65) 50%, rgba(0,0,0,0.92) 100%)",
        }}
      />

      <div className="relative flex h-full flex-col px-6 py-5 xl:px-12">
        {/* ── Header: collapse chevron + centered title ─────────────── */}
        <div className="relative flex items-center">
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-white/15 bg-black/30 pl-2 pr-4 text-xs font-semibold uppercase tracking-wider text-white/85 backdrop-blur transition hover:border-[var(--color-primary)] hover:text-white"
            aria-label={t("player.back", { defaultValue: "Atrás" })}
            title={t("player.back", { defaultValue: "Atrás" })}
          >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/10">
              <ChevronDown className="h-4 w-4" strokeWidth={2.4} />
            </span>
            {t("player.back", { defaultValue: "Atrás" })}
          </button>

          <p className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-[11px] font-semibold uppercase tracking-[0.42em] text-white/55">
            {t("player.expandedTitle", { defaultValue: "Reproductor" })}
          </p>
        </div>

        {/* ── Main: cover on the left, details + controls on the right.
            Constrained + centered so the two columns read as one unit (no
            dead space) and the timeline never slides under the queue rail. ── */}
        <div className="mx-auto grid min-h-0 w-full max-w-5xl flex-1 grid-cols-1 items-center gap-8 py-4 lg:grid-cols-2 lg:gap-12 xl:gap-16">
          {/* Left column — cover or, when toggled, the karaoke lyrics. */}
          <div className="flex min-h-0 items-center justify-center">
            {view === "cover" ? (
              <CoverArt
                cover={currentTrack.cover}
                title={currentTrack.title}
                activeSegmentLabel={activeSegment?.label ?? null}
                t={t}
              />
            ) : (
              <LyricsKaraoke trackId={currentTrack.id} seek={seek} />
            )}
          </div>

          {/* Right column — now-playing meta, timeline, transport, CTAs. */}
          <div className="flex min-w-0 flex-col">
            <div className="flex items-center gap-2">
              {showWave ? <Wave active={isPlaying} size={12} /> : null}
              <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[var(--color-primary)]">
                {t("player.nowPlaying")}
              </p>
            </div>

            <h1 className="mt-2 truncate text-4xl font-extrabold tracking-tight text-white drop-shadow-[0_2px_16px_rgba(0,0,0,0.7)] xl:text-5xl">
              {currentTrack.title}
            </h1>
            <p className="mt-2 flex items-center gap-2 text-base text-white/75">
              <span className="truncate">{currentTrack.artist}</span>
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-accent)]" />
            </p>

            {/* Timeline */}
            <div className="mt-8">
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

            {/* Transport — heart, prev, play, next, repeat */}
            <div className="mt-6 flex items-center justify-center gap-5 text-white/80 sm:gap-6">
              <button
                type="button"
                onClick={() => setAddToPlaylistOpen(true)}
                title={t("player.addToPlaylist", {
                  defaultValue: "Guardar en una playlist",
                })}
                aria-label={t("player.addToPlaylist", {
                  defaultValue: "Guardar en una playlist",
                })}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70 transition hover:border-[var(--color-accent)] hover:text-white"
              >
                <ListPlus className="h-[18px] w-[18px]" strokeWidth={2.2} />
              </button>
              <button
                type="button"
                onClick={() => void previous()}
                className="inline-flex h-11 w-11 items-center justify-center transition hover:text-white"
                aria-label={t("player.previous")}
              >
                <SkipBack className="h-6 w-6" strokeWidth={2.4} />
              </button>
              <button
                type="button"
                onClick={() => void togglePlay()}
                className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white text-black shadow-[0_14px_34px_rgba(0,0,0,0.5)] transition hover:scale-[1.05]"
                aria-label={isPlaying ? t("player.pause") : t("player.play")}
              >
                {isPlaying ? (
                  <Pause className="h-7 w-7" strokeWidth={2.6} />
                ) : (
                  <Play className="ml-0.5 h-7 w-7" strokeWidth={2.6} />
                )}
              </button>
              <button
                type="button"
                onClick={() => void next()}
                className="inline-flex h-11 w-11 items-center justify-center transition hover:text-white"
                aria-label={t("player.next")}
              >
                <SkipForward className="h-6 w-6" strokeWidth={2.4} />
              </button>
              <button
                type="button"
                onClick={cycleRepeat}
                aria-pressed={repeatMode !== "off"}
                title={
                  repeatMode === "one"
                    ? t("player.repeatOne", { defaultValue: "Repetir canción" })
                    : repeatMode === "all"
                      ? t("player.repeatAll", { defaultValue: "Repetir cola" })
                      : t("player.repeatOff", { defaultValue: "Repetir" })
                }
                aria-label={t("player.repeat", { defaultValue: "Repetir" })}
                className={`inline-flex h-11 w-11 items-center justify-center transition ${
                  repeatMode !== "off"
                    ? "text-[var(--color-primary)]"
                    : "text-white/60 hover:text-white"
                }`}
              >
                {repeatMode === "one" ? (
                  <Repeat1 className="h-5 w-5" strokeWidth={2.4} />
                ) : (
                  <Repeat className="h-5 w-5" strokeWidth={2.4} />
                )}
              </button>
            </div>

            {/* Primary CTAs — AI adjust + lyrics toggle */}
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={tryOpenAi}
                className="inline-flex h-12 items-center gap-2.5 rounded-2xl bg-[var(--color-primary)] px-6 text-sm font-semibold text-[var(--color-primary-contrast)] shadow-[0_12px_30px_-8px_var(--color-primary)] transition hover:brightness-110"
              >
                <Sparkles className="h-4 w-4" strokeWidth={2.4} />
                {t("player.askAi", { defaultValue: "Ajustar con IA" })}
              </button>
              <button
                type="button"
                onClick={() =>
                  setView((v) => (v === "lyrics" ? "cover" : "lyrics"))
                }
                aria-pressed={view === "lyrics"}
                className={`inline-flex h-12 items-center gap-2.5 rounded-2xl border px-6 text-sm font-semibold transition ${
                  view === "lyrics"
                    ? "border-white/70 bg-white/10 text-white"
                    : "border-white/20 bg-white/5 text-white/85 hover:border-white/40 hover:text-white"
                }`}
              >
                <Mic2 className="h-4 w-4" strokeWidth={2.4} />
                {t("player.viewLyrics", { defaultValue: "Letra" })}
              </button>
            </div>

            {/* Discreet sound-detail strip — EQ status + bypass, EQ drawer,
                segments, shuffle, queue. Quieter than the primary CTAs so
                the cover and transport stay the protagonists. */}
            <div className="mx-auto mt-7 flex flex-wrap items-center justify-center gap-2.5 rounded-2xl border border-white/10 bg-black/25 px-3 py-2.5 backdrop-blur-md">
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
                          defaultValue: "Pausar EQ sin perder los ajustes",
                        })
                      : t("player.eqInactive", {
                          defaultValue: "Sin EQ activo",
                        })
                }
                aria-pressed={eqActive}
                className={`inline-flex items-center gap-2 rounded-xl border-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition ${
                  eqActive
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)]/15 text-[var(--color-primary)] shadow-[0_0_24px_-6px_var(--color-primary)]"
                    : hasEqCurveStashed
                      ? "border-white/30 bg-transparent text-white/70"
                      : "border-white/15 bg-transparent text-white/55"
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
                  ? t("player.eqOn", { defaultValue: "EQ activo" })
                  : hasEqCurveStashed
                    ? t("player.eqPaused", { defaultValue: "EQ en pausa" })
                    : t("player.eqOff", { defaultValue: "Sin EQ" })}
              </button>

              <StripButton
                onClick={openEqDrawer}
                title={t("player.openEq")}
                hoverColor="primary"
              >
                <Sliders className="h-4 w-4" strokeWidth={2.4} />
              </StripButton>

              <StripButton
                onClick={openSegmentsForCurrentTrack}
                title={t("player.editSegments", {
                  defaultValue: "Editar segmentos del track",
                })}
                hoverColor="accent"
              >
                <Scissors className="h-4 w-4" strokeWidth={2.4} />
              </StripButton>

              <StripButton
                onClick={toggleShuffle}
                title={t("player.shuffle", { defaultValue: "Aleatorio" })}
                active={shuffle}
                hoverColor="primary"
              >
                <Shuffle className="h-4 w-4" strokeWidth={2.4} />
              </StripButton>

              <StripButton
                onClick={openQueueDrawer}
                title={t("queue.open", {
                  defaultValue: "Cola de reproducción",
                })}
                hoverColor="primary"
                badge={upcomingCount > 0 ? upcomingCount : undefined}
              >
                <ListMusic className="h-4 w-4" strokeWidth={2.4} />
              </StripButton>
            </div>
          </div>
        </div>
      </div>

      {/* ── Floating volume control (bottom-right) ─────────────────────── */}
      <div className="absolute bottom-6 right-6 flex flex-col items-center gap-3">
        {volumeOpen ? (
          <div className="flex items-center rounded-full border border-white/10 bg-black/40 px-4 py-2.5 backdrop-blur-md">
            <ElasticSlider
              className="w-28"
              value={isMuted ? 0 : volume}
              onChange={setVolume}
            />
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => {
            if (volumeOpen) toggleMute();
            setVolumeOpen((o) => !o);
          }}
          className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white/85 backdrop-blur transition hover:border-[var(--color-primary)] hover:text-white"
          aria-label={isMuted ? t("player.unmute") : t("player.mute")}
          title={t("player.volume")}
        >
          {isMuted ? (
            <VolumeX className="h-5 w-5" strokeWidth={2.2} />
          ) : (
            <Volume2 className="h-5 w-5" strokeWidth={2.2} />
          )}
        </button>
      </div>

      <AddToPlaylistModal
        open={addToPlaylistOpen}
        onClose={() => setAddToPlaylistOpen(false)}
        trackId={currentTrack.id}
        trackTitle={currentTrack.title}
      />
    </section>
  );
}

/**
 * A compact icon button for the discreet sound-detail strip. Optionally
 * shows an "active" tint and a small count badge (used by the queue).
 */
function StripButton({
  onClick,
  title,
  children,
  active = false,
  badge,
  hoverColor = "primary",
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  active?: boolean;
  badge?: number;
  hoverColor?: "primary" | "accent";
}) {
  const hover =
    hoverColor === "accent"
      ? "hover:border-[var(--color-accent)]"
      : "hover:border-[var(--color-primary)]";
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      aria-pressed={active}
      className={`relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/5 transition hover:text-white ${hover} ${
        active ? "text-[var(--color-primary)]" : "text-white/85"
      }`}
    >
      {children}
      {badge !== undefined ? (
        <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-primary)] px-1 text-[9px] font-bold text-[var(--color-primary-contrast)]">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

/**
 * The album art — the protagonist of the left column. Square, rounded, with
 * a soft floor shadow and the active-segment chip overlaid top-left.
 */
function CoverArt({
  cover,
  title,
  activeSegmentLabel,
  t,
}: {
  cover: string | null | undefined;
  title: string;
  activeSegmentLabel: string | null;
  t: (key: string, opts?: { defaultValue?: string }) => string;
}) {
  return (
    <div className="relative w-full max-w-[min(58vh,460px)]">
      <div className="relative aspect-square overflow-hidden rounded-[28px] shadow-[0_40px_120px_rgba(0,0,0,0.65)] ring-1 ring-white/10">
        {cover ? (
          <img src={cover} alt={title} className="h-full w-full object-cover" />
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
  const { t } = useTranslation();
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
      <div className="flex h-full max-h-[60vh] w-full items-center justify-center text-sm text-white/60">
        {t("player.lyrics.loading", { defaultValue: "Cargando letra…" })}
      </div>
    );
  }

  if (mode === "none") {
    return (
      <div className="flex h-full max-h-[60vh] w-full flex-col items-center justify-center gap-2 text-center">
        <Mic2 className="h-10 w-10 text-white/30" strokeWidth={1.5} />
        <p className="text-sm text-white/60">
          {t("player.lyrics.empty", {
            defaultValue: "Esta canción aún no tiene letra.",
          })}
        </p>
      </div>
    );
  }

  if (mode === "plain") {
    return (
      <div className="mx-auto max-h-[60vh] w-full overflow-y-auto px-4 text-center text-2xl font-medium leading-[1.6] text-white/80">
        <pre className="whitespace-pre-wrap font-sans">{plainText}</pre>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-h-[60vh] w-full flex-col overflow-y-auto px-4 py-8">
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
                ? "text-3xl font-bold leading-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]"
                : isPast
                  ? "text-lg font-semibold leading-snug text-white/40 hover:text-white/70"
                  : "text-lg font-semibold leading-snug text-white/55 hover:text-white/85"
            }`}
          >
            {line.text || "♪"}
          </button>
        );
      })}
    </div>
  );
}
