import { Children, isValidElement, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

/**
 * AnimatedList — adapted from ReactBits (MIT). Wraps each child so it fades and
 * lifts into place the first time it scrolls into view (`motion` whileInView).
 * A small grouped stagger keeps the first screenful lively without making rows
 * deep in a long list wait. Honours reduced-motion.
 */
export default function AnimatedList({
  children,
  className = "",
  stagger = 0.04,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
}) {
  const reduce = useReducedMotion();
  const items = Children.toArray(children);

  return (
    <div className={className}>
      {items.map((child, i) => (
        <motion.div
          key={isValidElement(child) && child.key != null ? child.key : i}
          initial={reduce ? false : { opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{
            duration: 0.4,
            delay: (i % 8) * stagger,
            ease: "easeOut",
          }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
}
