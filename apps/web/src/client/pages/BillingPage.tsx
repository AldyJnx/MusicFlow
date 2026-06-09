import { Crown, Loader2, Sparkles, Sliders, Upload } from "lucide-react";
import type { ReactNode } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import ClientLayout from "../layout/ClientLayout";
import { useQuotaQuery } from "../../shared/hooks/useQuota";
import {
  createCheckoutSession,
  type QuotaSlice,
} from "../../shared/api/billing";

function formatResetDate(iso: string | undefined, lang: string): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(lang, {
    day: "numeric",
    month: "long",
  });
}

function QuotaCard({
  icon,
  title,
  description,
  slice,
  resetLabel,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  slice: QuotaSlice;
  resetLabel?: string | null;
}) {
  const unlimited = slice.limit == null;
  const pct = unlimited
    ? 100
    : Math.min(100, Math.round((slice.used / (slice.limit || 1)) * 100));

  return (
    <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 text-[var(--color-primary)]">{icon}</span>
          <div>
            <h3 className="text-base font-semibold tracking-tight text-[var(--color-text)]">
              {title}
            </h3>
            <p className="mt-1 text-xs text-[var(--color-muted)]">
              {description}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-semibold tracking-tight text-[var(--color-text)]">
            {slice.used}
            {!unlimited ? (
              <span className="text-base font-normal text-[var(--color-muted)]">
                {" "}
                / {slice.limit}
              </span>
            ) : null}
          </div>
          {unlimited ? (
            <div className="text-xs text-[var(--color-primary)]">∞</div>
          ) : null}
        </div>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--color-border)]">
        <div
          className={`h-full rounded-full ${
            unlimited
              ? "bg-gradient-to-r from-[var(--color-cta-start)] to-[var(--color-cta-end)]"
              : pct >= 80
                ? "bg-amber-400"
                : "bg-[var(--color-primary)]"
          }`}
          style={{ width: `${unlimited ? 100 : pct}%` }}
        />
      </div>

      {resetLabel ? (
        <p className="mt-3 text-xs text-[var(--color-muted)]">{resetLabel}</p>
      ) : null}
    </article>
  );
}

export default function BillingPage() {
  const { data, isLoading, error } = useQuotaQuery();
  const { t, i18n } = useTranslation();

  const upgrade = useMutation({
    mutationFn: createCheckoutSession,
    onSuccess: (res) => {
      window.location.assign(res.url);
    },
  });

  return (
    <ClientLayout>
      <section className="min-h-screen w-full bg-[var(--color-page)] px-4 py-6 text-[var(--color-text)] sm:px-6 xl:px-8">
        <div className="mx-auto flex max-w-5xl flex-col gap-8 rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:p-8">
          <header className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <Crown
                className="h-5 w-5 text-[var(--color-primary)]"
                strokeWidth={2.3}
              />
              <h1 className="text-2xl font-semibold tracking-tight">
                {t("billing.title", { defaultValue: "Plan y uso" })}
              </h1>
            </div>
            <p className="text-sm text-[var(--color-muted)]">
              {t("billing.subtitle", {
                defaultValue:
                  "Mirá cuánto llevas usado este mes y qué desbloquea Premium.",
              })}
            </p>
          </header>

          {isLoading ? (
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-6 text-sm text-[var(--color-muted)]">
              {t("billing.loading", { defaultValue: "Cargando uso…" })}
            </div>
          ) : error || !data ? (
            <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-6 text-sm text-red-300">
              {t("billing.error", {
                defaultValue: "No pudimos leer tu uso. Probá refrescar.",
              })}
            </div>
          ) : (
            <>
              <div
                className={`flex items-center justify-between gap-4 rounded-2xl border p-5 ${
                  data.isPremium
                    ? "border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10"
                    : "border-[var(--color-border)] bg-[var(--color-surface-alt)]"
                }`}
              >
                <div>
                  <div className="text-xs uppercase tracking-wider text-[var(--color-muted)]">
                    {t("billing.currentPlan", {
                      defaultValue: "Plan actual",
                    })}
                  </div>
                  <div className="mt-1 text-xl font-semibold text-[var(--color-text)]">
                    {data.isPremium
                      ? t("billing.premium", { defaultValue: "Premium" })
                      : t("billing.free", { defaultValue: "Free" })}
                  </div>
                </div>
                {!data.isPremium ? (
                  <div className="flex flex-col items-end gap-1">
                    <button
                      type="button"
                      onClick={() => upgrade.mutate()}
                      disabled={upgrade.isPending}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-[var(--color-cta-start)] to-[var(--color-cta-end)] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(0,0,0,0.28)] transition hover:brightness-110 disabled:opacity-60"
                    >
                      {upgrade.isPending ? (
                        <Loader2
                          className="h-4 w-4 animate-spin"
                          strokeWidth={2.2}
                        />
                      ) : null}
                      {t("billing.upgrade", {
                        defaultValue: "Hacerme Premium",
                      })}
                    </button>
                    {upgrade.isError ? (
                      <span className="text-xs text-rose-300">
                        {t("billing.upgradeError", {
                          defaultValue:
                            "No pudimos abrir el checkout. Probá de nuevo.",
                        })}
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <QuotaCard
                  icon={<Sparkles className="h-5 w-5" strokeWidth={2.3} />}
                  title={t("billing.cards.ai.title", {
                    defaultValue: "Sugerencias IA",
                  })}
                  description={t("billing.cards.ai.description", {
                    defaultValue: "Reseteo mensual",
                  })}
                  slice={data.aiRequests}
                  resetLabel={
                    data.aiRequests.resetAt
                      ? t("billing.resetsOn", {
                          defaultValue: "Se renueva el {{date}}",
                          date: formatResetDate(
                            data.aiRequests.resetAt,
                            i18n.language,
                          ),
                        })
                      : null
                  }
                />
                <QuotaCard
                  icon={<Upload className="h-5 w-5" strokeWidth={2.3} />}
                  title={t("billing.cards.uploads.title", {
                    defaultValue: "Canciones subidas",
                  })}
                  description={t("billing.cards.uploads.description", {
                    defaultValue: "Total acumulado",
                  })}
                  slice={data.uploads}
                />
                <QuotaCard
                  icon={<Sliders className="h-5 w-5" strokeWidth={2.3} />}
                  title={t("billing.cards.presets.title", {
                    defaultValue: "Presets propios",
                  })}
                  description={t("billing.cards.presets.description", {
                    defaultValue: "EQ personalizados",
                  })}
                  slice={data.customPresets}
                />
              </div>

              {!data.isPremium ? (
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-6">
                  <h2 className="text-base font-semibold tracking-tight">
                    {t("billing.benefits.title", {
                      defaultValue: "Qué incluye Premium",
                    })}
                  </h2>
                  <ul className="mt-4 space-y-2 text-sm text-[var(--color-muted)]">
                    <li>
                      ▸{" "}
                      {t("billing.benefits.segments", {
                        defaultValue:
                          "EQ por segmento — diferentes ajustes para intro, verso y coro",
                      })}
                    </li>
                    <li>
                      ▸{" "}
                      {t("billing.benefits.ai", {
                        defaultValue: "200 sugerencias de IA por mes",
                      })}
                    </li>
                    <li>
                      ▸{" "}
                      {t("billing.benefits.uploads", {
                        defaultValue: "Uploads ilimitados",
                      })}
                    </li>
                    <li>
                      ▸{" "}
                      {t("billing.benefits.presets", {
                        defaultValue: "Presets personalizados sin límite",
                      })}
                    </li>
                  </ul>
                </div>
              ) : null}
            </>
          )}
        </div>
      </section>
    </ClientLayout>
  );
}
