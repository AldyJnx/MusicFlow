import { useEffect, useRef } from "react";

/**
 * Reactive constellation background — ported from the `pretesis` design's
 * canvas (constellation mode). Renders drifting particles linked by faint
 * lines over a slow mesh-gradient of color orbs, plus a subtle grid.
 *
 * - Orb/link colors are read from the live theme tokens (`--color-primary`,
 *   `--color-accent`) so it re-tints automatically when the theme changes.
 * - Honors `prefers-reduced-motion`: motion is damped (not frozen) so the
 *   scene stays alive without vestibular strain.
 * - `pointer-events: none` and `z-0` — it sits behind all app content.
 *
 * Mounted once in ClientLayout. Self-contained: a single rAF loop that pauses
 * when the document is hidden.
 */

type Particle = { x: number; y: number; vx: number; vy: number };

const MAX_PARTICLES = 120;
const PARTICLE_COUNT = 60; // "density: 2" from the design (medium)

/** Converts "#7c5ce8" → "124,92,232" for use in rgba() strings. */
function hexToRgb(hex: string): string {
  const v = hex.trim().replace("#", "");
  const e =
    v.length === 3
      ? v
          .split("")
          .map((c) => c + c)
          .join("")
      : v;
  if (e.length !== 6) return "124,92,232";
  const r = parseInt(e.slice(0, 2), 16);
  const g = parseInt(e.slice(2, 4), 16);
  const b = parseInt(e.slice(4, 6), 16);
  return `${r},${g},${b}`;
}

function readOrbColors(): string[] {
  const root = getComputedStyle(document.documentElement);
  const primary = hexToRgb(
    root.getPropertyValue("--color-primary") || "#7c5ce8",
  );
  const accent = hexToRgb(root.getPropertyValue("--color-accent") || "#e85cc0");
  // Third orb: a cool green, matching the design's `gn` accent.
  return [primary, accent, "76,241,160"];
}

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const rm = reduceMotion ? 0.25 : 1;
    const glow = 0.6; // design default

    let orbCols = readOrbColors();
    // Re-read palette when the theme changes (applyTheme mutates the root vars).
    const themeObserver = new MutationObserver(() => {
      orbCols = readOrbColors();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "style"],
    });

    const pts: Particle[] = Array.from({ length: MAX_PARTICLES }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.22,
    }));
    const orbPos = [
      { x: 0.24, y: 0.32, r: 300, ph: 0 },
      { x: 0.76, y: 0.62, r: 340, ph: 2.1 },
      { x: 0.56, y: 0.16, r: 230, ph: 4.2 },
    ];

    const mouse = { x: -999, y: -999 };
    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    window.addEventListener("mousemove", onMove);

    let raf = 0;
    let W = 0;
    let H = 0;

    const draw = (t: number) => {
      W = canvas.clientWidth || window.innerWidth;
      H = canvas.clientHeight || window.innerHeight;
      if (!W || !H) {
        raf = requestAnimationFrame(draw);
        return;
      }
      if (
        canvas.width !== Math.round(W * dpr) ||
        canvas.height !== Math.round(H * dpr)
      ) {
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const tt = t * rm;
      ctx.clearRect(0, 0, W, H);

      // ---- ORBS (mesh-gradient base) ----
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < 3; i++) {
        const o = orbPos[i];
        const col = orbCols[i % orbCols.length];
        const ox = o.x * W + Math.sin(tt / 6500 + o.ph) * 70;
        const oy = o.y * H + Math.cos(tt / 7500 + o.ph) * 70 * 0.8;
        const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, o.r);
        g.addColorStop(0, `rgba(${col},${(0.13 * glow + 0.06) * 0.55})`);
        g.addColorStop(1, `rgba(${col},0)`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }
      ctx.globalCompositeOperation = "source-over";

      // ---- faint grid ----
      ctx.strokeStyle = "rgba(150,160,220,0.025)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      const gs = 48;
      for (let x = gs; x < W; x += gs) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
      }
      for (let y = gs; y < H; y += gs) {
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
      }
      ctx.stroke();

      // ---- particles: move + cursor repulsion ----
      const n = Math.min(PARTICLE_COUNT, pts.length);
      for (let i = 0; i < n; i++) {
        const p = pts[i];
        p.x += p.vx * rm;
        p.y += p.vy * rm;
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const d = Math.hypot(dx, dy);
        if (d < 150 && d > 0.1) {
          p.x -= (dx / d) * 0.7;
          p.y -= (dy / d) * 0.7;
        }
      }

      // ---- links ----
      const linkC = orbCols[1];
      for (let i = 0; i < n; i++) {
        const a = pts[i];
        const dmx = Math.hypot(mouse.x - a.x, mouse.y - a.y);
        if (dmx < 150) {
          const al = (1 - dmx / 150) * 0.5;
          ctx.strokeStyle = `rgba(${linkC},${al})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
        for (let j = i + 1; j < n; j++) {
          const b = pts[j];
          const ddx = a.x - b.x;
          const ddy = a.y - b.y;
          const d2 = ddx * ddx + ddy * ddy;
          if (d2 < 130 * 130) {
            const al = (1 - d2 / (130 * 130)) * 0.2;
            ctx.strokeStyle = `rgba(150,160,235,${al})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // ---- dots ----
      for (let i = 0; i < n; i++) {
        const p = pts[i];
        const near = Math.hypot(mouse.x - p.x, mouse.y - p.y) < 150;
        ctx.fillStyle = near ? `rgba(${linkC},.85)` : "rgba(190,200,255,.5)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, near ? 2.2 : 1.4, 0, 7);
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
      } else {
        raf = requestAnimationFrame(draw);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      themeObserver.disconnect();
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
    />
  );
}
