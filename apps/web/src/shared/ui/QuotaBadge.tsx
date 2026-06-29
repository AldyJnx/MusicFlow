import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useQuotaQuery } from "../hooks/useQuota";

/**
 * Compact pill in the navbar showing the AI-request usage for free users
 * (the most actively consumed quota). Premium users have unlimited AI and
 * already carry the "Premium" TierBadge, so we render nothing for them to
 * avoid a duplicate tier indicator. Clicking navigates to billing settings.
 */
export default function QuotaBadge() {
  const { data, isLoading } = useQuotaQuery();
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (isLoading || !data) return null;

  // Premium/admin: tier is already shown by TierBadge — no quota meter needed.
  if (data.isPremium) return null;

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
