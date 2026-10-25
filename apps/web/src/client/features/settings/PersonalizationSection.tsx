import { CheckCircle2, RotateCcw, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

import { usePreferences } from "../../../shared/hooks/usePreferences";

function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-3 text-[var(--color-text)]">
        <span className="text-[var(--color-primary)]">
          <Sparkles className="h-4 w-4" strokeWidth={2.3} />
        </span>
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      </div>
      <p className="pl-7 text-xs text-[var(--color-muted)]">{subtitle}</p>
    </div>
  );
}

function FieldHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h3 className="text-sm font-semibold tracking-tight text-[var(--color-text)]">
        {title}
      </h3>
      <p className="mt-0.5 text-xs text-[var(--color-muted)]">{subtitle}</p>
    </div>
  );
}

const SUGGESTED_ACCENTS = [
  "#36e2ec",
  "#22e58a",
  "#fb923c",
  "#a78bfa",
  "#ec4899",
  "#3b82f6",
];

export default function PersonalizationSection() {
  const { t } = useTranslation();
  const { accentOverride, setAccentOverride, resetPersonalization } =
    usePreferences();

  return (
    <div className="flex flex-col gap-5">
      <SectionTitle
        title={t("settings.personalization.title")}
        subtitle={t("settings.personalization.subtitle")}
      />

      <div className="grid grid-cols-1 gap-5 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 xl:grid-cols-2">
        {/* Accent override */}
        <div className="flex flex-col gap-3 border-b border-[var(--color-border)] pb-5 xl:border-b-0 xl:border-r xl:pb-0 xl:pr-5">
          <FieldHeader
            title={t("settings.personalization.accent.title")}
            subtitle={t("settings.personalization.accent.subtitle")}
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setAccentOverride(null)}
              className={`flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-semibold transition ${
                accentOverride === null
                  ? "border-[var(--color-primary)] bg-[var(--color-surface-alt)] text-[var(--color-text)]"
                  : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              {accentOverride === null ? (
                <CheckCircle2
                  className="h-3.5 w-3.5 text-[var(--color-primary)]"
                  strokeWidth={2.5}
                />
              ) : null}
              {t("settings.personalization.accent.useTheme")}
            </button>
            {SUGGESTED_ACCENTS.map((hex) => {
              const active =
                accentOverride?.toLowerCase() === hex.toLowerCase();
              return (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setAccentOverride(hex)}
                  className={`h-9 w-9 rounded-lg border-2 transition ${
                    active
                      ? "border-white shadow-[0_0_0_2px_var(--color-primary)]"
                      : "border-transparent hover:border-[var(--color-border)]"
                  }`}
                  style={{ backgroundColor: hex }}
                  aria-label={hex}
                />
              );
            })}
            <label className="flex h-9 items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-xs font-semibold text-[var(--color-muted)] hover:text-[var(--color-text)]">
              <input
                type="color"
                value={accentOverride ?? "#36e2ec"}
                onChange={(e) => setAccentOverride(e.target.value)}
                className="h-5 w-5 cursor-pointer rounded border-none bg-transparent p-0"
                aria-label={t("settings.personalization.accent.custom")}
              />
              {t("settings.personalization.accent.custom")}
            </label>
          </div>
        </div>

        {/* Reset */}
        <div className="flex justify-end xl:col-span-2">
          <button
            type="button"
            onClick={resetPersonalization}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-4 py-2 text-xs font-semibold text-[var(--color-muted)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-text)]"
          >
            <RotateCcw className="h-3.5 w-3.5" strokeWidth={2.3} />
            {t("settings.personalization.reset")}
          </button>
        </div>
      </div>
    </div>
  );
}
