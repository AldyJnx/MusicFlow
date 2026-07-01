import { useRef, useState, type ReactNode } from "react";
import { animate, motion, useMotionValue, useTransform } from "motion/react";

const MAX_OVERFLOW = 40;

/**
 * ElasticSlider — adapted from ReactBits (MIT). A 0–1 slider that stretches
 * elastically when you drag past either end and whose track thickens while
 * active, driven by `motion`. Optional icons sit at the ends (the left one is
 * clickable, e.g. mute). Used for the player volume.
 */
export default function ElasticSlider({
  value,
  onChange,
  leftIcon,
  rightIcon,
  onLeftIconClick,
  leftIconLabel,
  className = "",
}: {
  value: number;
  onChange: (v: number) => void;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  onLeftIconClick?: () => void;
  leftIconLabel?: string;
  className?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered] = useState(false);
  const overflow = useMotionValue(0);
  const scaleX = useTransform(overflow, [0, MAX_OVERFLOW], [1, 1.06]);

  function apply(clientX: number) {
    const el = trackRef.current;
    if (!el) return;
    const { left, right, width } = el.getBoundingClientRect();
    if (clientX < left) overflow.set(Math.min(left - clientX, MAX_OVERFLOW));
    else if (clientX > right)
      overflow.set(Math.min(clientX - right, MAX_OVERFLOW));
    else overflow.set(0);
    onChange(Math.max(0, Math.min(1, (clientX - left) / width)));
  }

  function release() {
    setDragging(false);
    animate(overflow, 0, { type: "spring", stiffness: 320, damping: 18 });
  }

  return (
    <div
      className={`flex items-center gap-2.5 ${className}`}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      {leftIcon ? (
        <button
          type="button"
          onClick={onLeftIconClick}
          aria-label={leftIconLabel}
          className="flex-none text-[var(--color-muted)] transition hover:text-[var(--color-text)]"
        >
          {leftIcon}
        </button>
      ) : null}

      <motion.div
        ref={trackRef}
        role="slider"
        aria-valuenow={Math.round(value * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") onChange(Math.max(0, value - 0.05));
          else if (e.key === "ArrowRight") onChange(Math.min(1, value + 0.05));
        }}
        onPointerDown={(e) => {
          setDragging(true);
          e.currentTarget.setPointerCapture?.(e.pointerId);
          apply(e.clientX);
        }}
        onPointerMove={(e) => {
          if (dragging) apply(e.clientX);
        }}
        onPointerUp={release}
        onPointerCancel={release}
        style={{ scaleX }}
        className="relative flex flex-1 cursor-pointer touch-none items-center py-2"
      >
        <motion.div
          className="w-full overflow-hidden rounded-full bg-white/[0.14]"
          animate={{ height: hovered || dragging ? 6 : 4 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.max(0, Math.min(1, value)) * 100}%`,
              background:
                "linear-gradient(90deg,var(--color-primary),var(--color-accent))",
            }}
          />
        </motion.div>
      </motion.div>

      {rightIcon ? (
        <span className="flex-none text-[var(--color-muted)]">{rightIcon}</span>
      ) : null}
    </div>
  );
}
