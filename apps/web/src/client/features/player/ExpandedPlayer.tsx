import { memo, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  Heart,
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
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { usePlayerStore } from "../../stores/playStore";
import { useTrackSegments } from "../../../shared/hooks/useTrackSegments";
import { usePreferences } from "../../../shared/hooks/usePreferences";
import { usePremiumGate } from "../../../shared/hooks/usePremiumGate";
import { useEqualizer } from "../../../shared/hooks/useEqualizer";
import {
  useCurrentLyricsLineIndex,
  useLyrics,
} from "../../../shared/hooks/useLyrics";
import type { LyricsLine } from "../../../shared/utils/lrc";
import {
  useSavedCheckQuery,
  useToggleSave,
} from "../../../shared/hooks/useLibrarySaves";
import { getAudioEngine } from "../../../audio/engine";
import TimelineWithSegments from "./TimelineWithSegments";
import Wave from "./Wave";
import AddToPlaylistModal from "../playlists/AddToPlaylistModal";
import ArtistCredits from "./ArtistCredits";

type ExpandedPlayerProps = {
  sidebarOffset?: number;
  rightPanelOffset?: number;
};

type View = "cover" | "lyrics";
type LyricsStyle = "classic" | "glow";

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
  rightPanelOffset = 0,
}: ExpandedPlayerProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();

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
  const savedCheck = useSavedCheckQuery(currentTrack ? [currentTrack.id] : []);
  const toggleSave = useToggleSave();

  const { segments } = useTrackSegments(currentTrack?.id ?? null);
  const { showWave, lyricsScale } = usePreferences();
  const { isPremium, guard } = usePremiumGate();
  const { bands, syncFromEngine } = useEqualizer();
  const isMuted = muted || volume === 0;

  const [view, setView] = useState<View>("cover");
  const [lyricsStyle, setLyricsStyle] = useState<LyricsStyle>("glow");
  const [addToPlaylistOpen, setAddToPlaylistOpen] = useState(false);
  const [volumeOpen, setVolumeOpen] = useState(false);
  const volumeControlRef = useRef<HTMLDivElement | null>(null);

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

  // The expanded player is a route overlay. Close it on navigation so the new
  // destination (for example, Descubrir) is immediately visible.
  const expandedPathRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isExpanded) {
      expandedPathRef.current = pathname;
      return;
    }
    if (expandedPathRef.current && expandedPathRef.current !== pathname) {
      setExpanded(false);
    }
    expandedPathRef.current = pathname;
  }, [isExpanded, pathname, setExpanded]);

  useEffect(() => {
    if (!isExpanded) return undefined;

    // The expanded player owns the viewport. Without this lock, wheel events
    // at either edge of the lyrics panel can scroll the route behind it.
    const { body, documentElement } = document;
    const previousBodyOverflow = body.style.overflow;
    const previousHtmlOverflow = documentElement.style.overflow;
    body.style.overflow = "hidden";
    documentElement.style.overflow = "hidden";

    return () => {
      body.style.overflow = previousBodyOverflow;
      documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [isExpanded]);

  useEffect(() => {
    if (!volumeOpen) return undefined;

    const closeOnOutsidePointerDown = (event: PointerEvent) => {
      if (!volumeControlRef.current?.contains(event.target as Node)) {
        setVolumeOpen(false);
      }
    };
    window.addEventListener("pointerdown", closeOnOutsidePointerDown, true);
    return () =>
      window.removeEventListener(
        "pointerdown",
        closeOnOutsidePointerDown,
        true,
      );
  }, [volumeOpen]);

  if (!currentTrack || !isExpanded) return null;

  function openSegmentsForCurrentTrack() {
    if (!currentTrack) return;
    setExpanded(false);
    navigate(`/segments?track=${encodeURIComponent(currentTrack.id)}`);
  }

  function tryOpenAi() {
    guard("ai", openAiPrompt);
  }

  function toggleFavorite() {
    if (!currentTrack) return;
    toggleSave.mutate({
      trackId: currentTrack.id,
      saved: savedCheck.data?.includes(currentTrack.id) ?? false,
    });
  }

  const isSaved = currentTrack
    ? (savedCheck.data?.includes(currentTrack.id) ?? false)
    : false;

  return (
    <section
      className="electron-viewport-player fixed bottom-0 top-0 z-50 overflow-hidden overscroll-none"
      style={{ left: `${sidebarOffset}px`, right: `${rightPanelOffset}px` }}
      role="dialog"
      aria-label={t("player.expandedTitle", { defaultValue: "Reproductor" })}
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
        <div className="mx-auto grid h-full min-h-0 w-full max-w-5xl flex-1 grid-cols-1 items-center gap-8 py-4 lg:grid-cols-2 lg:gap-12 xl:gap-16">
          {/* Left column — cover or, when toggled, the karaoke lyrics. */}
          <div className="flex h-full min-h-0 items-center justify-center overflow-hidden">
            {view === "cover" ? (
              <CoverArt
                cover={currentTrack.cover}
                title={currentTrack.title}
                activeSegmentLabel={activeSegment?.label ?? null}
                t={t}
              />
            ) : (
              <LyricsKaraoke
                trackId={currentTrack.id}
                seek={seek}
                style={lyricsStyle}
                scale={lyricsScale}
              />
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
            <div className="mt-2 flex max-w-full items-center gap-2 text-left text-base text-white/75">
              <ArtistCredits track={currentTrack} className="min-w-0" />
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-accent)]" />
            </div>

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
              {isPremium ? (
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
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border transition disabled:cursor-wait disabled:opacity-60 ${
                    isSaved
                      ? "border-rose-400/50 bg-rose-500/15 text-rose-400"
                      : "border-white/10 bg-white/5 text-white/70 hover:border-rose-400/50 hover:text-rose-400"
                  }`}
                >
                  <Heart
                    className="h-[19px] w-[19px]"
                    fill={isSaved ? "currentColor" : "none"}
                    strokeWidth={2.2}
                  />
                </button>
              ) : null}
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
              {isPremium ? (
                <button
                  type="button"
                  onClick={tryOpenAi}
                  className="inline-flex h-12 items-center gap-2.5 rounded-2xl bg-[var(--color-primary)] px-6 text-sm font-semibold text-[var(--color-primary-contrast)] shadow-[0_12px_30px_-8px_var(--color-primary)] transition hover:brightness-110"
                >
                  <Sparkles className="h-4 w-4" strokeWidth={2.4} />
                  {t("player.askAi", { defaultValue: "Ajustar con IA" })}
                </button>
              ) : null}
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
              {view === "lyrics" ? (
                <button
                  type="button"
                  onClick={() =>
                    setLyricsStyle((style) =>
                      style === "glow" ? "classic" : "glow",
                    )
                  }
                  aria-pressed={lyricsStyle === "glow"}
                  title={
                    lyricsStyle === "glow"
                      ? "Usar letra clásica"
                      : "Usar letra con brillo progresivo"
                  }
                  className="inline-flex h-12 items-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-4 text-sm font-semibold text-white/85 transition hover:border-[var(--color-primary)] hover:text-white"
                >
                  <Sparkles className="h-4 w-4" strokeWidth={2.4} />
                  {lyricsStyle === "glow" ? "Brillo" : "Clásica"}
                </button>
              ) : null}
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
      <div
        ref={volumeControlRef}
        data-testid="expanded-volume-control"
        className="absolute bottom-6 right-6 z-20 flex flex-col items-center gap-3"
        onPointerLeave={() => setVolumeOpen(false)}
        onFocusCapture={() => setVolumeOpen(true)}
      >
        {volumeOpen ? (
          <div className="rounded-xl border border-white/10 bg-black/50 px-2 py-2.5 shadow-2xl backdrop-blur-md">
            <VerticalVolumeSlider
              value={isMuted ? 0 : volume}
              onChange={setVolume}
            />
          </div>
        ) : null}
        <button
          type="button"
          onClick={toggleMute}
          onPointerEnter={() => setVolumeOpen(true)}
          onFocus={() => setVolumeOpen(true)}
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
 * lines fade, upcoming lines hint at what's next. It keeps a static context
 * window around the active line, avoiding an inner scrollbar or auto-scroll.
 * Click any visible synced line to seek there.
 */
const LyricsKaraoke = memo(function LyricsKaraoke({
  trackId,
  seek,
  style,
  scale,
}: {
  trackId: string | null;
  seek: (ms: number) => void;
  style: LyricsStyle;
  scale: number;
}) {
  const { t } = useTranslation();
  const { mode, lines, plainText, isLoading } = useLyrics(trackId);
  const currentLineIndex = useCurrentLyricsLineIndex(lines);
  const visibleLines = useMemo(() => {
    const windowSize = 7;
    if (lines.length <= windowSize) {
      return lines.map((line, index) => ({ line, index }));
    }
    const focusIndex = Math.max(0, currentLineIndex);
    const start = Math.min(
      Math.max(0, focusIndex - Math.floor(windowSize / 2)),
      lines.length - windowSize,
    );
    return lines
      .slice(start, start + windowSize)
      .map((line, offset) => ({ line, index: start + offset }));
  }, [currentLineIndex, lines]);

  if (isLoading) {
    return (
      <div className="flex h-full min-h-0 w-full items-center justify-center text-sm text-white/60">
        {t("player.lyrics.loading", { defaultValue: "Cargando letra…" })}
      </div>
    );
  }

  if (mode === "none") {
    return (
      <div className="flex h-full min-h-0 w-full flex-col items-center justify-center gap-2 text-center">
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
      <div
        className="mx-auto max-h-[58vh] w-full max-w-[460px] overflow-hidden px-4 text-center font-medium leading-[1.6] text-white/80"
        style={{ fontSize: `${1.5 * scale}rem` }}
      >
        <pre className="whitespace-pre-wrap font-sans">{plainText}</pre>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-[460px] flex-col justify-center overflow-hidden px-4 py-8">
      {visibleLines.map(({ line, index }) => {
        const isActive = index === currentLineIndex;
        const isPast = index < currentLineIndex;
        return (
          <button
            key={`${line.timeMs}-${index}`}
            type="button"
            onClick={() => seek(line.timeMs)}
            className={`w-full rounded-lg px-2 py-3 text-left transition ${
              isActive
                ? "font-bold leading-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]"
                : isPast
                  ? "font-semibold leading-snug text-white/40 [text-shadow:0_0_16px_rgba(255,255,255,0.08)] hover:text-white/70"
                  : "font-semibold leading-snug text-white/30 [filter:blur(0.25px)] [text-shadow:0_0_18px_rgba(255,255,255,0.12)] hover:text-white/70"
            }`}
            style={{ fontSize: `${(isActive ? 1.875 : 1.125) * scale}rem` }}
          >
            {style === "glow" && isActive ? (
              <GlowLyricsLine line={line} nextLine={lines[index + 1]} />
            ) : (
              line.text || "♪"
            )}
          </button>
        );
      })}
    </div>
  );
});

function GlowLyricsLine({
  line,
  nextLine,
}: {
  line: LyricsLine;
  nextLine: LyricsLine | undefined;
}) {
  const words = useMemo(
    () => line.text.trim().split(/\s+/).filter(Boolean),
    [line.text],
  );
  const wordRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const durationMs = Math.max(
    1_200,
    (nextLine?.timeMs ?? line.timeMs + 4_000) - line.timeMs,
  );

  useEffect(() => {
    let frame = 0;
    const updateWordProgress = () => {
      const state = usePlayerStore.getState();
      // The store intentionally updates at a modest rate for the rest of the
      // UI. The active lyric alone reads the media clock each frame, keeping
      // karaoke smooth without making the whole player render at 60 FPS.
      const positionMs =
        state.playbackTarget === "cast"
          ? state.positionMs
          : getAudioEngine().getStatus().positionMs;
      const wordCursor =
        Math.max(0, Math.min(1, (positionMs - line.timeMs) / durationMs)) *
        words.length;

      wordRefs.current.forEach((wordElement, index) => {
        if (!wordElement) return;
        const progress = Math.max(0, Math.min(1, wordCursor - index));
        wordElement.style.backgroundPosition = `${100 - progress * 100}% 0`;
      });
      frame = requestAnimationFrame(updateWordProgress);
    };

    updateWordProgress();
    return () => cancelAnimationFrame(frame);
  }, [durationMs, line.timeMs, words.length]);

  if (words.length === 0) return <>♪</>;

  return (
    <span
      className="flex flex-wrap gap-x-2 gap-y-1"
      data-testid="lyrics-glow-line"
    >
      {words.map((word, index) => {
        return (
          <span
            key={`${word}-${index}`}
            ref={(element) => {
              wordRefs.current[index] = element;
            }}
            className="inline-block bg-clip-text text-transparent [background-size:200%_100%]"
            style={{
              backgroundImage:
                "linear-gradient(90deg, #ffffff 0%, #ffffff 50%, rgba(255,255,255,0.28) 50%, rgba(255,255,255,0.36) 100%)",
              backgroundPosition: "100% 0",
              WebkitBackgroundClip: "text",
              textShadow: "0 0 14px rgba(255,255,255,0.16)",
            }}
          >
            {word}
          </span>
        );
      })}
    </span>
  );
}

function VerticalVolumeSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const percentage = Math.round(Math.max(0, Math.min(1, value)) * 100);

  function updateFromPointer(clientY: number) {
    const track = trackRef.current;
    if (!track) return;
    const { top, height } = track.getBoundingClientRect();
    onChange(Math.max(0, Math.min(1, 1 - (clientY - top) / height)));
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <span className="text-[10px] font-semibold tabular-nums text-white/65">
        {percentage}%
      </span>
      <div
        ref={trackRef}
        data-testid="expanded-volume-slider"
        role="slider"
        tabIndex={0}
        aria-label="Volumen"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percentage}
        onKeyDown={(event) => {
          if (event.key === "ArrowUp" || event.key === "ArrowRight") {
            event.preventDefault();
            onChange(Math.min(1, value + 0.05));
          }
          if (event.key === "ArrowDown" || event.key === "ArrowLeft") {
            event.preventDefault();
            onChange(Math.max(0, value - 0.05));
          }
        }}
        onPointerDown={(event) => {
          setDragging(true);
          event.currentTarget.setPointerCapture(event.pointerId);
          updateFromPointer(event.clientY);
        }}
        onPointerMove={(event) => {
          if (dragging) updateFromPointer(event.clientY);
        }}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
        className="relative h-28 w-1.5 cursor-pointer touch-none rounded-full bg-white/15 outline-none ring-[var(--color-primary)] focus-visible:ring-2"
      >
        <span
          className="absolute bottom-0 left-0 w-full rounded-full bg-[var(--color-primary)]"
          style={{ height: `${percentage}%` }}
        />
        <span
          className="absolute left-1/2 h-3.5 w-3.5 -translate-x-1/2 rounded-full border-2 border-white bg-[var(--color-primary)] shadow-[0_2px_10px_rgba(0,0,0,0.45)]"
          style={{ bottom: `calc(${percentage}% - 7px)` }}
        />
      </div>
    </div>
  );
}
