import { Crown, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useQuotaQuery } from "../hooks/useQuota";

/**
 * Compact pill in the navbar. Shows the AI-request usage for free users
 * (the most actively consumed quota) and a "Premium" badge otherwise.
 * Clicking navigates to the billing settings page.
 */
export default function QuotaBadge() {
  const { data, isLoading } = useQuotaQuery();
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (isLoading || !data) return null;

  if (data.isPremium) {
    return (
      <button
        type="button"
        onClick={() => navigate("/settings/billing")}
        className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 px-3 py-1.5 text-xs font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary)]/20"
        aria-label={t("billing.premiumBadge", { defaultValue: "Premium" })}
      >
        <Crown className="h-3.5 w-3.5" strokeWidth={2.3} />
        <span>{t("billing.premium", { defaultValue: "Premium" })}</span>
      </button>
    );
  }

  const { used, limit } = data.aiRequests;
  if (limit == null) return null;

  const lowOnQuota = (data.aiRequests.remaining ?? 0) <= 2;

  return (
    <button
      type="button"
      onClick={() => navigate("/settings/billing")}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
        lowOnQuota
          ? "border-amber-400/50 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20"
          : "border-[var(--color-border)] bg-[var(--color-page)]/60 text-[var(--color-muted)] hover:text-[var(--color-text)]"
      }`}
      aria-label={t("billing.aiQuotaBadge", {
        defaultValue: "{{used}} de {{limit}} solicitudes de IA usadas este mes",
        used,
        limit,
      })}
    >
      <Sparkles className="h-3.5 w-3.5" strokeWidth={2.3} />
      <span>
        {used}/{limit}
      </span>
    </button>
  );
}
