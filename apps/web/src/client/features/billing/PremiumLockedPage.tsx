import { Crown, Sparkles, Scissors } from "lucide-react";
import { useEffect } from "react";

import {
  usePremiumGate,
  type PremiumFeature,
} from "../../../shared/hooks/usePremiumGate";

const COPY: Record<
  PremiumFeature,
  { eyebrow: string; title: string; body: string; Icon: typeof Sparkles }
> = {
  ai: {
    eyebrow: "Premium",
    title: "El asistente IA es solo para Premium",
    body: "Pedile a Claude que ajuste el sonido de cualquier canción con lenguaje natural. Sin límites mensuales, sin esperas.",
    Icon: Sparkles,
  },
  segments: {
    eyebrow: "Premium",
    title: "Los segmentos son solo para Premium",
    body: "Definí un EQ distinto para cada parte de la canción — intro, verso, coro, outro. La feature firma de MusicFlow.",
    Icon: Scissors,
  },
};

/**
 * Renders when a free user lands on a premium-only page by URL. Auto-opens
 * the upgrade modal on mount so the user goes straight from "locked" to
 * "checkout" without an extra click, but also keeps a clear, branded fallback
 * card behind so the route never feels broken.
 */
export default function PremiumLockedPage({
  feature,
}: {
  feature: PremiumFeature;
}) {
  const { openUpgrade } = usePremiumGate();
  const copy = COPY[feature];
  const Icon = copy.Icon;

  useEffect(() => {
    openUpgrade(feature);
  }, [openUpgrade, feature]);

  return (
    <section className="flex min-h-screen items-center justify-center bg-[var(--color-page)] px-6 text-center text-[var(--color-text)]">
      <div className="relative max-w-md overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-[0_24px_60px_rgba(0,0,0,0.32)]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-12 -top-16 h-40 w-40 rounded-full opacity-30 blur-3xl"
          style={{ backgroundColor: "var(--color-primary)" }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-20 blur-3xl"
          style={{ backgroundColor: "var(--color-accent)" }}
        />

        <div className="relative flex flex-col items-center gap-4">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-300">
            <Icon className="h-7 w-7" strokeWidth={2.2} />
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-300">
            <Crown className="h-3 w-3" strokeWidth={2.6} />
            {copy.eyebrow}
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{copy.title}</h1>
          <p className="max-w-sm text-sm leading-relaxed text-[var(--color-muted)]">
            {copy.body}
          </p>
          <button
            type="button"
            onClick={() => openUpgrade(feature)}
            className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 py-3 text-sm font-bold uppercase tracking-wider text-[var(--color-primary-contrast)] shadow-[0_14px_30px_rgba(0,0,0,0.32)] transition hover:scale-[1.02]"
          >
            <Crown className="h-4 w-4" strokeWidth={2.4} />
            Hacerme Premium
          </button>
        </div>
      </div>
    </section>
  );
}
