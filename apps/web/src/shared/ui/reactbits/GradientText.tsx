import type { CSSProperties, ReactNode } from "react";

/**
 * Animated gradient text — adapted from ReactBits (MIT). The gradient slides
 * horizontally across the glyphs via `background-clip: text` + the
 * `rb-gradient-x` keyframe (defined in index.css).
 *
 * Defaults pull the app's brand colours so it matches the cyan/violet fusion
 * language instead of ReactBits' stock palette.
 */
export default function GradientText({
  children,
  className = "",
  colors = [
    "var(--color-primary)",
    "var(--color-accent)",
    "var(--color-primary)",
  ],
  animationSpeed = 7,
}: {
  children: ReactNode;
  className?: string;
  colors?: string[];
  /** Seconds for one full sweep. */
  animationSpeed?: number;
}) {
  const style: CSSProperties = {
    backgroundImage: `linear-gradient(90deg, ${colors.join(", ")})`,
    backgroundSize: "200% auto",
    animation: `rb-gradient-x ${animationSpeed}s linear infinite`,
  };

  return (
    <span
      className={`bg-clip-text text-transparent ${className}`}
      style={style}
    >
      {children}
    </span>
  );
}
