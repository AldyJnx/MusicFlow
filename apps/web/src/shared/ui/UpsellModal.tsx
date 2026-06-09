import { Crown, Sparkles, X } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  useUpsellStore,
  type UpsellPayload,
  type UpsellReason,
} from "../stores/upsellStore";

interface CopyBundle {
  title: string;
  description: string;
}

type Translator = ReturnType<typeof useTranslation>["t"];

function getCopy(reason: UpsellReason, t: Translator): CopyBundle {
  switch (reason) {
    case "PREMIUM_REQUIRED":
      return {
        title: t("upsell.premiumRequired.title", {
          defaultValue: "Esta función es Premium",
        }),
        description: t("upsell.premiumRequired.description", {
          defaultValue:
            "El ecualizador por segmento — diferentes EQs para intro, verso y coro — está incluido en Premium.",
        }),
      };
    case "QUOTA_AI_EXCEEDED":
      return {
        title: t("upsell.aiExceeded.title", {
          defaultValue: "Agotaste las sugerencias de IA del mes",
        }),
        description: t("upsell.aiExceeded.description", {
          defaultValue:
            "Premium incluye 200 sugerencias por mes para que ajustes el sonido cuando quieras.",
        }),
      };
    case "QUOTA_UPLOADS_EXCEEDED":
      return {
        title: t("upsell.uploadsExceeded.title", {
          defaultValue: "Llegaste al límite de canciones",
        }),
        description: t("upsell.uploadsExceeded.description", {
          defaultValue:
            "Premium te permite subir canciones sin límite y descargarlas para escuchar offline.",
        }),
      };
    case "QUOTA_PRESETS_EXCEEDED":
      return {
        title: t("upsell.presetsExceeded.title", {
          defaultValue: "Llegaste al límite de presets personalizados",
        }),
        description: t("upsell.presetsExceeded.description", {
          defaultValue:
            "Premium te deja crear presets sin límite para cada estilo o estado de ánimo.",
        }),
      };
  }
}

function UsageBar({ payload }: { payload: UpsellPayload }) {
  if (!payload.quota || payload.quota.limit == null) return null;
  const pct = Math.min(
    100,
    Math.round((payload.quota.used / payload.quota.limit) * 100),
  );
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-[var(--color-muted)]">
        <span>
          {payload.quota.used} / {payload.quota.limit}
        </span>
        {payload.quota.resetAt ? (
          <span>
            {new Date(payload.quota.resetAt).toLocaleDateString(undefined, {
              day: "numeric",
              month: "short",
            })}
          </span>
        ) : null}
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[var(--color-border)]">
        <div
          className="h-full bg-gradient-to-r from-[var(--color-cta-start)] to-[var(--color-cta-end)]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function UpsellModal() {
  const { open, payload, close } = useUpsellStore();
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  if (!open || !payload) return null;

  const copy = getCopy(payload.reason, t);
  const isPremiumGate = payload.reason === "PREMIUM_REQUIRED";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="upsell-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      <button
        type="button"
        aria-label={t("upsell.dismiss", { defaultValue: "Cerrar" })}
        onClick={close}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_24px_80px_rgba(0,0,0,0.5)]">
        <button
          type="button"
          onClick={close}
          aria-label={t("upsell.dismiss", { defaultValue: "Cerrar" })}
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-muted)] transition hover:bg-white/[0.06] hover:text-[var(--color-text)]"
        >
          <X className="h-4 w-4" strokeWidth={2.2} />
        </button>

        <div className="relative h-32 overflow-hidden bg-gradient-to-br from-[var(--color-cta-start)] to-[var(--color-cta-end)]">
          <div className="absolute inset-0 flex items-center justify-center">
            {isPremiumGate ? (
              <Crown className="h-16 w-16 text-white/90" strokeWidth={1.5} />
            ) : (
              <Sparkles className="h-16 w-16 text-white/90" strokeWidth={1.5} />
            )}
          </div>
        </div>

        <div className="space-y-5 p-6">
          <div className="space-y-2">
            <h2
              id="upsell-title"
              className="text-xl font-semibold tracking-tight text-[var(--color-text)]"
            >
              {copy.title}
            </h2>
            <p className="text-sm leading-relaxed text-[var(--color-muted)]">
              {copy.description}
            </p>
          </div>

          <UsageBar payload={payload} />

          <div className="flex flex-col gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                close();
                navigate("/settings/billing");
              }}
              className="w-full rounded-xl bg-gradient-to-b from-[var(--color-cta-start)] to-[var(--color-cta-end)] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(0,0,0,0.28)] transition hover:brightness-110"
            >
              {t("upsell.cta", { defaultValue: "Ver Premium" })}
            </button>
            <button
              type="button"
              onClick={close}
              className="w-full rounded-xl border border-[var(--color-border)] bg-transparent px-5 py-3 text-sm font-medium text-[var(--color-muted)] transition hover:bg-white/[0.04] hover:text-[var(--color-text)]"
            >
              {t("upsell.later", { defaultValue: "Quizás más tarde" })}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
