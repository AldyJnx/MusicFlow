/**
 * Aurora background — a lightweight, CSS-only take on ReactBits' Aurora (MIT).
 * The original uses a WebGL/OGL shader; this version layers a few drifting,
 * heavily-blurred radial blobs instead, so it adds zero runtime deps and stays
 * cheap on the GPU. Render it absolutely-positioned behind content.
 */
export default function Aurora({
  className = "",
  colors = ["var(--color-primary)", "var(--color-accent)"],
  intensity = 0.5,
}: {
  className?: string;
  /** Two-or-more colours blended across the blobs. */
  colors?: string[];
  /** 0–1 overall opacity of the effect. */
  intensity?: number;
}) {
  const [a, b] = [colors[0], colors[1] ?? colors[0]];
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      style={{ opacity: intensity }}
    >
      <div
        className="absolute -left-[15%] top-[-30%] h-[70%] w-[60%] rounded-full blur-[90px]"
        style={{
          background: `radial-gradient(circle at center, ${a}, transparent 65%)`,
          animation: "rb-aurora-drift 18s ease-in-out infinite",
        }}
      />
      <div
        className="absolute right-[-10%] top-[-10%] h-[80%] w-[55%] rounded-full blur-[90px]"
        style={{
          background: `radial-gradient(circle at center, ${b}, transparent 65%)`,
          animation: "rb-aurora-drift 22s ease-in-out infinite reverse",
        }}
      />
      <div
        className="absolute bottom-[-40%] left-[25%] h-[70%] w-[50%] rounded-full blur-[100px]"
        style={{
          background: `radial-gradient(circle at center, ${a}, transparent 70%)`,
          animation: "rb-aurora-drift 26s ease-in-out infinite",
        }}
      />
    </div>
  );
}
