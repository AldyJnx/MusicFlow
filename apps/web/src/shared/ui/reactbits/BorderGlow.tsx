import type { CSSProperties } from "react";

/**
 * BorderGlow — adapted from ReactBits (MIT). An animated gradient ring that
 * traces the edge of its parent. Drop it as an absolutely-positioned child of a
 * `position: relative` element with a border radius; it inherits that radius and
 * masks itself to just the border, so a rotating primary→accent glow runs along
 * the perimeter (with a soft blurred copy behind for the glow).
 *
 * Relies on the `--rb-glow-angle` @property + `rb-glow-spin` keyframe in index.css.
 */
export default function BorderGlow({
  className = "",
  thickness = 1.5,
  durationSeconds = 4,
}: {
  className?: string;
  /** Border ring thickness in px. */
  thickness?: number;
  durationSeconds?: number;
}) {
  const ring: CSSProperties = {
    padding: `${thickness}px`,
    background:
      "conic-gradient(from var(--rb-glow-angle), transparent 0%, var(--color-primary) 25%, var(--color-accent) 50%, transparent 72%)",
    WebkitMask:
      "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
    WebkitMaskComposite: "xor",
    maskComposite: "exclude",
    animation: `rb-glow-spin ${durationSeconds}s linear infinite`,
  };

  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 rounded-[inherit] ${className}`}
    >
      <span
        className="absolute inset-0 rounded-[inherit] opacity-60 blur-[3px]"
        style={ring}
      />
      <span className="absolute inset-0 rounded-[inherit]" style={ring} />
    </span>
  );
}
