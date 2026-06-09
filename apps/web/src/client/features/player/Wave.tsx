type WaveProps = {
  active: boolean;
  /** Optional size override. Bars scale from this height (default 14px). */
  size?: number;
};

/**
 * Triple-bar wave animation, ported from the mock's `.master_play .wave`.
 * Bars are static when `active` is false (shows "ready" state) and animate
 * with offset delays when `active` is true. Uses `--color-primary` so it
 * follows the user's accent override.
 */
export default function Wave({ active, size = 14 }: WaveProps) {
  return (
    <div
      className="musicflow-wave"
      data-active={active ? "1" : "0"}
      aria-hidden="true"
      style={{ height: size }}
    >
      <span />
      <span />
      <span />
      <style>{`
        .musicflow-wave {
          display: inline-flex;
          align-items: flex-end;
          gap: 3px;
          width: max-content;
        }
        .musicflow-wave span {
          display: block;
          width: 3px;
          height: 60%;
          background: var(--color-primary);
          border-radius: 4px 4px 0 0;
        }
        .musicflow-wave span:nth-child(2) { height: 85%; }
        .musicflow-wave span:nth-child(3) { height: 50%; }

        .musicflow-wave[data-active="1"] span {
          animation: musicflow-wave-bar 0.6s ease-in-out infinite;
        }
        .musicflow-wave[data-active="1"] span:nth-child(2) {
          animation-delay: 0.15s;
        }
        .musicflow-wave[data-active="1"] span:nth-child(3) {
          animation-delay: 0.3s;
        }

        @keyframes musicflow-wave-bar {
          0%, 100% { transform: scaleY(0.45); }
          50% { transform: scaleY(1); }
        }

        @media (prefers-reduced-motion: reduce) {
          .musicflow-wave[data-active="1"] span {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
