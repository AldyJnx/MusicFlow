import { motion, useReducedMotion } from "motion/react";

/**
 * SplitText — adapted from ReactBits (MIT). Splits text into characters and
 * animates each one up into place with a small stagger on mount (`motion`).
 * The whole word is exposed to screen readers via aria-label while the
 * per-character spans are aria-hidden. Falls back to plain text under
 * reduced-motion.
 */
export default function SplitText({
  text,
  className = "",
  stagger = 0.025,
}: {
  text: string;
  className?: string;
  stagger?: number;
}) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <span className={className}>{text}</span>;
  }

  const chars = Array.from(text);

  return (
    <span className={className} aria-label={text}>
      {chars.map((ch, i) => (
        <motion.span
          key={`${i}-${ch}`}
          aria-hidden="true"
          style={{ display: "inline-block", whiteSpace: "pre" }}
          initial={{ opacity: 0, y: "0.45em" }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: i * stagger, ease: "easeOut" }}
        >
          {ch === " " ? " " : ch}
        </motion.span>
      ))}
    </span>
  );
}
