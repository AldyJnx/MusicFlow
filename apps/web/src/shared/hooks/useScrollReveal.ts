import { useEffect, type RefObject } from "react";
import { animate } from "animejs";

/**
 * Scroll-reveal with anime.js. Observes every `[data-reveal]` descendant of
 * `containerRef` and fades + lifts it into place the first time it enters the
 * viewport. Honors `prefers-reduced-motion` (elements just appear).
 *
 * Usage:
 *   const ref = useRef<HTMLDivElement>(null);
 *   useScrollReveal(ref);
 *   return <div ref={ref}><section data-reveal>…</section></div>;
 *
 * Optional `data-reveal-delay` (ms) staggers an element.
 */
export function useScrollReveal(
  containerRef: RefObject<HTMLElement | null>,
  deps: unknown[] = [],
) {
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const els = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (els.length === 0) return;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce) {
      els.forEach((el) => (el.style.opacity = "1"));
      return;
    }

    // Hide until revealed (inline so there's no FOUC flash of the final state).
    els.forEach((el) => {
      el.style.opacity = "0";
      el.style.willChange = "transform, opacity";
    });

    const io = new IntersectionObserver(
      (entries, obs) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          const delay = Number(el.dataset.revealDelay ?? 0);
          animate(el, {
            opacity: [0, 1],
            translateY: [20, 0],
            duration: 640,
            delay,
            ease: "outCubic",
          });
          obs.unobserve(el);
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -6% 0px" },
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
