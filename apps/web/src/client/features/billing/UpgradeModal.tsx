import { useEffect, useMemo, useState } from "react";
import {
  Check,
  CreditCard,
  Crown,
  Loader2,
  Lock,
  ShieldCheck,
  Sparkles,
  Scissors,
  X,
} from "lucide-react";

import { simulateUpgrade } from "../../../shared/api/billing";
import { useAuthStore } from "../../../shared/stores/authStore";
import {
  usePremiumGate,
  type PremiumFeature,
} from "../../../shared/hooks/usePremiumGate";

/**
 * Why-each-feature copy. Tied to the entry point so the headline can speak
 * to what the user just tried to do ("you tried IA → here's what Premium
 * unlocks").
 */
const COPY: Record<
  PremiumFeature,
  { eyebrow: string; title: string; pitch: string }
> = {
  ai: {
    eyebrow: "Asistente IA",
    title: "Hazte Premium para pedirle a la IA",
    pitch:
      "Describe cómo quieres que suene una canción y la IA propone una curva — ilimitado en Premium.",
  },
  segments: {
    eyebrow: "Segmentos temporales",
    title: "Hazte Premium para crear segmentos",
    pitch:
      "EQ distinto en cada parte de tu canción (intro, verso, coro). La feature firma de MusicFlow.",
  },
};

/** Formats "4242424242424242" as "4242 4242 4242 4242" while typing. */
function formatCardNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export default function UpgradeModal() {
  const { isModalOpen, activeFeature, closeUpgrade } = usePremiumGate();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [holder, setHolder] = useState("");
  const [card, setCard] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when the modal closes so the next opening is clean.
  useEffect(() => {
    if (!isModalOpen) {
      setProcessing(false);
      setSuccess(false);
      setError(null);
      setHolder("");
      setCard("");
      setExpiry("");
      setCvv("");
    }
  }, [isModalOpen]);

  useEffect(() => {
    if (!isModalOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !processing) closeUpgrade();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isModalOpen, processing, closeUpgrade]);

  const copy = useMemo(
    () => (activeFeature ? COPY[activeFeature] : null),
    [activeFeature],
  );

  // Form validity. Loose on purpose — this is a simulator, not Stripe.
  const cardDigits = card.replace(/\D/g, "");
  const expiryDigits = expiry.replace(/\D/g, "");
  const cvvDigits = cvv.replace(/\D/g, "");
  const canSubmit =
    holder.trim().length >= 2 &&
    cardDigits.length === 16 &&
    expiryDigits.length === 4 &&
    cvvDigits.length >= 3 &&
    cvvDigits.length <= 4;

  if (!isModalOpen || !copy) return null;

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (processing || !canSubmit) return;
    setProcessing(true);
    setError(null);
    try {
      // Honest fake latency so the loader actually says something.
      await new Promise((r) => setTimeout(r, 1200));
      const { isPremium } = await simulateUpgrade();
      if (user && isPremium) {
        setUser({ ...user, isPremium: true });
      }
      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No pudimos procesar el pago. Probá de nuevo.",
      );
    } finally {
      setProcessing(false);
    }
  }

  return (
    <>
      <div
        aria-hidden="true"
        onClick={() => !processing && closeUpgrade()}
        className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-md"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="upgrade-modal-title"
        className="fixed left-1/2 top-1/2 z-[81] w-[min(96vw,560px)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl border border-white/10 bg-[var(--color-surface)] text-[var(--color-text)] shadow-[0_30px_80px_rgba(0,0,0,0.55)]"
      >
        {/* Header with tinted glow */}
        <div className="relative overflow-hidden border-b border-[var(--color-border)] px-7 py-6">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-12 -top-16 h-48 w-48 rounded-full opacity-30 blur-3xl"
            style={{ backgroundColor: "var(--color-primary)" }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-20 blur-3xl"
            style={{ backgroundColor: "var(--color-accent)" }}
          />
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
              <div className="inline-flex items-center gap-1.5 self-start rounded-full border border-amber-400/40 bg-amber-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                <Crown className="h-3 w-3" strokeWidth={2.6} />
                {copy.eyebrow}
              </div>
              <h2
                id="upgrade-modal-title"
                className="text-xl font-bold tracking-tight"
              >
                {copy.title}
              </h2>
              <p className="text-sm text-[var(--color-muted)]">{copy.pitch}</p>
            </div>
            {!processing && !success ? (
              <button
                type="button"
                onClick={closeUpgrade}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--color-muted)] transition hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)]"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" strokeWidth={2.3} />
              </button>
            ) : null}
          </div>
        </div>

        {/* Body */}
        {success ? (
          <SuccessPanel onClose={closeUpgrade} />
        ) : (
          <form
            onSubmit={handlePay}
            className="flex flex-col gap-5 px-7 py-6"
            autoComplete="off"
          >
            {/* Premium perks bullet list */}
            <ul className="flex flex-col gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4 text-sm">
              <li className="flex items-center gap-2">
                <Sparkles
                  className="h-4 w-4 text-[var(--color-accent)]"
                  strokeWidth={2.3}
                />
                Pedidos a la IA ilimitados cada mes
              </li>
              <li className="flex items-center gap-2">
                <Scissors
                  className="h-4 w-4 text-[var(--color-accent)]"
                  strokeWidth={2.3}
                />
                Segmentos temporales por canción
              </li>
              <li className="flex items-center gap-2">
                <Check
                  className="h-4 w-4 text-[var(--color-primary)]"
                  strokeWidth={2.3}
                />
                Más espacio, más presets, sin marcas de agua
              </li>
            </ul>

            {/* Simulated card form */}
            <div className="rounded-2xl border border-dashed border-amber-400/30 bg-amber-400/5 px-3 py-2 text-[11px] text-amber-200">
              <span className="font-semibold uppercase tracking-wider">
                Demo
              </span>{" "}
              · Esta pasarela es una simulación. No se realiza ningún cargo
              real.
            </div>

            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1.5 text-xs font-semibold text-[var(--color-muted)]">
                Titular de la tarjeta
                <input
                  type="text"
                  value={holder}
                  onChange={(e) => setHolder(e.target.value)}
                  placeholder="Nombre tal cual aparece en la tarjeta"
                  className="h-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-page)] px-3 text-sm font-normal text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
                  disabled={processing}
                  autoFocus
                />
              </label>
              <label className="flex flex-col gap-1.5 text-xs font-semibold text-[var(--color-muted)]">
                Número de tarjeta
                <div className="relative">
                  <CreditCard
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]"
                    strokeWidth={2.2}
                  />
                  <input
                    type="text"
                    inputMode="numeric"
                    value={card}
                    onChange={(e) => setCard(formatCardNumber(e.target.value))}
                    placeholder="4242 4242 4242 4242"
                    className="h-10 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-page)] pl-9 pr-3 text-sm font-normal tracking-wider text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
                    disabled={processing}
                  />
                </div>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5 text-xs font-semibold text-[var(--color-muted)]">
                  MM/AA
                  <input
                    type="text"
                    inputMode="numeric"
                    value={expiry}
                    onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                    placeholder="12/29"
                    className="h-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-page)] px-3 text-sm font-normal text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
                    disabled={processing}
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-xs font-semibold text-[var(--color-muted)]">
                  CVV
                  <div className="relative">
                    <Lock
                      className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-muted)]"
                      strokeWidth={2.2}
                    />
                    <input
                      type="text"
                      inputMode="numeric"
                      value={cvv}
                      onChange={(e) =>
                        setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))
                      }
                      placeholder="123"
                      className="h-10 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-page)] pl-9 pr-3 text-sm font-normal text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
                      disabled={processing}
                    />
                  </div>
                </label>
              </div>
            </div>

            {error ? (
              <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                {error}
              </p>
            ) : null}

            <div className="flex items-center justify-between gap-3">
              <p className="flex items-center gap-1.5 text-[11px] text-[var(--color-muted)]">
                <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2.3} />
                Cifrado simulado · cancela cuando quieras
              </p>
              <div className="text-right">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                  Total
                </p>
                <p className="text-lg font-bold text-[var(--color-text)]">
                  $9,99
                  <span className="ml-1 text-xs font-normal text-[var(--color-muted)]">
                    / mes
                  </span>
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={!canSubmit || processing}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] text-sm font-bold uppercase tracking-wider text-[var(--color-primary-contrast)] shadow-[0_14px_30px_rgba(0,0,0,0.32)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.4} />
                  Procesando pago…
                </>
              ) : (
                <>
                  <Crown className="h-4 w-4" strokeWidth={2.4} />
                  Hacerme Premium · $9,99/mes
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </>
  );
}

function SuccessPanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 px-7 py-10 text-center">
      <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
        <Check className="h-8 w-8" strokeWidth={2.8} />
      </div>
      <h3 className="text-xl font-bold tracking-tight">
        ¡Bienvenido a Premium!
      </h3>
      <p className="max-w-sm text-sm text-[var(--color-muted)]">
        Ya podés pedirle a la IA, crear segmentos por canción y aprovechar todo
        lo que hace única a MusicFlow.
      </p>
      <button
        type="button"
        onClick={onClose}
        className="mt-2 inline-flex h-11 items-center justify-center rounded-xl bg-[var(--color-primary)] px-6 text-sm font-bold uppercase tracking-wider text-[var(--color-primary-contrast)] shadow-[0_10px_24px_rgba(0,0,0,0.32)] transition hover:scale-[1.02]"
      >
        Empezar
      </button>
    </div>
  );
}
