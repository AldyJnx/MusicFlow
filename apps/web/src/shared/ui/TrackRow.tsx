import { Music4, Play } from "lucide-react";
import { memo, useRef } from "react";
import { animate } from "animejs";

import SaveButton from "./SaveButton";
import GradientText from "./reactbits/GradientText";
import BorderGlow from "./reactbits/BorderGlow";
import { formatDuration } from "../utils/duration";

const MINI_VINYL_BG =
  "repeating-radial-gradient(circle at center, #0c0c0f 0 1px, #1b1b20 1px 2.5px), #0a0a0d";

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Three animated EQ bars; pauses when not playing. */
function EqBars({ playing }: { playing: boolean }) {
  return (
    <span className="flex h-3.5 items-end gap-[2px]">
      {[".7s", ".9s .2s", "1.1s .1s"].map((a, i) => (
        <span
          key={i}
          className="w-[2.5px] rounded-[2px] bg-white"
          style={{
            height: "100%",
            transformOrigin: "bottom",
            animation: `eqbar ${a} ease-in-out infinite`,
            animationPlayState: playing ? "running" : "paused",
          }}
        />
      ))}
    </span>
  );
}

export interface TrackRowProps {
  number: number | string;
  title: string;
  /** Optional secondary line (album name, etc.). */
  subtitle?: string | null;
  cover?: string | null;
  durationMs: number;
  active: boolean;
  playing: boolean;
  saved: boolean;
  trackId: string;
  /** Render the album-style mini vinyl that slides out behind the cover. */
  vinyl?: boolean;
  onPlay: () => void;
  /** When set, the subtitle becomes a button (e.g. open the album). */
  onSubtitleClick?: () => void;
}

/**
 * The single track row used across the catalog (Album + Artist pages). On
 * hover the index swaps for a ▶ and — when `vinyl` is on — a small spinning
 * record (anime.js) slides out from behind the cover. The active track shows
 * EQ bars over its cover and its title gets the animated GradientText
 * (react-bits) treatment so "now playing" reads at a glance.
 */
function TrackRow({
  number,
  title,
  subtitle,
  cover,
  durationMs,
  active,
  playing,
  saved,
  trackId,
  vinyl = false,
  onPlay,
  onSubtitleClick,
}: TrackRowProps) {
  const discRef = useRef<HTMLDivElement>(null);

  function reveal() {
    const el = discRef.current;
    if (!el || prefersReducedMotion()) return;
    animate(el, {
      translateX: [0, 18],
      opacity: [0, 1],
      duration: 520,
      ease: "outBack",
    });
  }
  function hide() {
    const el = discRef.current;
    if (!el || prefersReducedMotion()) return;
    animate(el, { translateX: 0, opacity: 0, duration: 240, ease: "outQuad" });
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onPlay}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onPlay();
        }
      }}
      onMouseEnter={vinyl ? reveal : undefined}
      onMouseLeave={vinyl ? hide : undefined}
      onFocus={vinyl ? reveal : undefined}
      onBlur={vinyl ? hide : undefined}
      className={`group relative grid cursor-pointer grid-cols-[28px_1fr_auto_56px] items-center gap-4 rounded-xl border px-3 py-2.5 text-left transition ${
        active
          ? "border-[var(--color-primary)]/40 bg-[var(--color-glass)]"
          : "border-[var(--color-line)]/60 bg-[var(--color-surface)]/80 hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-glass)]"
      }`}
    >
      {/* Animated glow border traces the active (now-playing) row */}
      {active ? <BorderGlow /> : null}

      {/* Index → play on hover */}
      <span className="relative flex h-4 items-center justify-center">
        <span
          className={`text-sm tabular-nums transition group-hover:opacity-0 ${
            active ? "text-[var(--color-accent)]" : "text-[var(--color-muted)]"
          }`}
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {number}
        </span>
        <Play
          className="absolute h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100"
          fill="currentColor"
        />
      </span>

      {/* Cover (mini vinyl slides out behind it) + title */}
      <span className="flex min-w-0 items-center gap-3">
        <span className="relative h-10 w-10 flex-none">
          {vinyl ? (
            <div
              ref={discRef}
              aria-hidden="true"
              className="pointer-events-none absolute left-0 top-0 h-10 w-10 opacity-0"
              style={{ willChange: "transform, opacity" }}
            >
              <div
                className="h-full w-full rounded-full shadow-[0_4px_14px_-3px_rgba(0,0,0,.9)] ring-1 ring-black/50 animate-[spin_2.5s_linear_infinite] [animation-play-state:paused] group-hover:[animation-play-state:running]"
                style={{ background: MINI_VINYL_BG }}
              >
                <span
                  className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full ring-1 ring-black/40"
                  style={
                    cover
                      ? { background: `center/cover no-repeat url(${cover})` }
                      : {
                          background:
                            "linear-gradient(135deg,var(--color-primary),var(--color-accent))",
                        }
                  }
                />
              </div>
            </div>
          ) : null}

          <span className="relative z-10 block h-10 w-10 overflow-hidden rounded-md bg-[var(--color-surface-alt)]">
            {cover ? (
              <img src={cover} alt="" className="h-full w-full object-cover" />
            ) : (
              <Music4 className="absolute inset-0 m-auto h-4 w-4 text-[var(--color-muted)]" />
            )}
            {active ? (
              <span className="absolute inset-0 flex items-center justify-center bg-black/40">
                <EqBars playing={playing} />
              </span>
            ) : null}
          </span>
        </span>

        <span className="min-w-0">
          <span
            className={`block truncate text-sm font-semibold transition-transform duration-500 ease-out group-hover:translate-x-2.5 ${
              active ? "" : "text-[var(--color-text)]"
            }`}
          >
            {active ? <GradientText>{title}</GradientText> : title}
          </span>
          {subtitle != null ? (
            <span className="block truncate text-xs text-[var(--color-muted)]">
              {onSubtitleClick ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSubtitleClick();
                  }}
                  className="transition hover:text-[var(--color-text)] hover:underline"
                >
                  {subtitle}
                </button>
              ) : (
                subtitle
              )}
            </span>
          ) : null}
        </span>
      </span>

      {/* Save (hover-gated, persistent when saved) */}
      <span
        className="opacity-0 transition group-hover:opacity-100 focus-within:opacity-100 data-[saved=true]:opacity-100"
        data-saved={saved}
        onClick={(e) => e.stopPropagation()}
      >
        <SaveButton trackId={trackId} saved={saved} />
      </span>

      {/* Duration */}
      <span
        className="text-right text-xs text-[var(--color-muted)]"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {formatDuration(durationMs)}
      </span>
    </div>
  );
}

// Memoised on the data props only: the play/subtitle callbacks are recreated
// every parent render but always do the same thing for a given row, so we
// intentionally ignore their identity. This keeps a track change (or any page
// re-render) from re-rendering every row in a long list — only the rows whose
// active/playing/saved state actually changed re-render.
export default memo(
  TrackRow,
  (prev, next) =>
    prev.trackId === next.trackId &&
    prev.number === next.number &&
    prev.title === next.title &&
    prev.subtitle === next.subtitle &&
    prev.cover === next.cover &&
    prev.durationMs === next.durationMs &&
    prev.active === next.active &&
    prev.playing === next.playing &&
    prev.saved === next.saved &&
    prev.vinyl === next.vinyl,
);
