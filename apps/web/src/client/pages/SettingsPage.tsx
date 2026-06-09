import type { ReactNode } from "react";
import {
  AudioLines,
  CheckCircle2,
  CircleDot,
  Globe2,
  Palette,
  SlidersHorizontal,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import ClientLayout from "../layout/ClientLayout";
import { usePreferences } from "../../shared/hooks/usePreferences";
import { APP_THEMES } from "../../shared/utils/theme";
import { SUPPORTED_LANGUAGES, type AppLanguage } from "../../shared/i18n";

function SectionTitle({
  icon,
  title,
  subtitle,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-3 text-[var(--color-text)]">
        <span className="text-[var(--color-primary)]">{icon}</span>
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      </div>
      {subtitle ? (
        <p className="pl-7 text-xs text-[var(--color-muted)]">{subtitle}</p>
      ) : null}
    </div>
  );
}

function Toggle({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={enabled}
      onClick={onToggle}
      className={`relative inline-flex h-7 w-12 items-center rounded-full border transition ${
        enabled
          ? "border-[var(--color-primary)] bg-[var(--color-primary)]"
          : "border-[var(--color-border)] bg-[var(--color-surface-alt)]"
      }`}
    >
      <span
        className={`h-5 w-5 rounded-full bg-white shadow-sm transition ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

const LANG_FLAGS: Record<AppLanguage, string> = {
  es: "🇪🇸",
  en: "🇺🇸",
};

export default function SettingsPage() {
  const [normalizeVolume, setNormalizeVolume] = useState(true);
  const [gaplessPlayback, setGaplessPlayback] = useState(true);
  const {
    theme: activeTheme,
    setTheme,
    language,
    setLanguage,
  } = usePreferences();
  const { t } = useTranslation();

  return (
    <ClientLayout>
      <section className="min-h-screen w-full bg-[var(--color-page)] px-4 py-6 text-[var(--color-text)] sm:px-6 xl:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:p-8">
          {/* Language */}
          <div className="flex flex-col gap-5">
            <SectionTitle
              icon={<Globe2 className="h-4 w-4" strokeWidth={2.3} />}
              title={t("settings.language.title")}
              subtitle={t("settings.language.subtitle")}
            />

            <div className="grid grid-cols-2 gap-3 sm:max-w-md">
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isActive = language === lang;
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setLanguage(lang)}
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                      isActive
                        ? "border-[var(--color-primary)] bg-[var(--color-surface-alt)]"
                        : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-alt)]"
                    }`}
                  >
                    <span className="text-2xl leading-none">
                      {LANG_FLAGS[lang]}
                    </span>
                    <span className="flex-1 text-sm font-semibold text-[var(--color-text)]">
                      {t(`settings.language.${lang}`)}
                    </span>
                    {isActive ? (
                      <CheckCircle2
                        className="h-4 w-4 text-[var(--color-primary)]"
                        strokeWidth={2.5}
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Themes */}
          <div className="flex flex-col gap-5">
            <SectionTitle
              icon={<Palette className="h-4 w-4" strokeWidth={2.3} />}
              title={t("settings.themes.title")}
              subtitle={t("settings.themes.subtitle")}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {APP_THEMES.map((option) => {
                const isActive = option.id === activeTheme;
                return (
                  <article
                    key={option.id}
                    onClick={() => setTheme(option.id)}
                    className={`cursor-pointer rounded-2xl border bg-[var(--color-surface)] p-4 transition hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-alt)] ${
                      isActive
                        ? "border-[var(--color-primary)] shadow-[0_0_0_1px_var(--color-primary)]"
                        : "border-[var(--color-border)]"
                    }`}
                  >
                    <div
                      className={`relative h-24 overflow-hidden rounded-xl ${option.previewClassName}`}
                    >
                      {/* Mini preview UI inside swatch */}
                      <div className="absolute bottom-2 left-2 right-2 flex items-center gap-1.5">
                        {option.dotsClassName.map((dot, i) => (
                          <span
                            key={i}
                            className={`h-1.5 rounded-full ${dot} ${i === 0 ? "w-6" : "w-3"}`}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 flex items-end justify-between gap-4">
                      <div className="flex items-center gap-2">
                        {option.dotsClassName.map((dotClassName, i) => (
                          <span
                            key={i}
                            className={`h-3 w-3 rounded-full ${dotClassName}`}
                          />
                        ))}
                      </div>

                      {isActive ? (
                        <CheckCircle2
                          className="h-4 w-4 text-[var(--color-primary)]"
                          strokeWidth={2.5}
                        />
                      ) : null}
                    </div>

                    <div className="mt-3">
                      <h3 className="text-base font-semibold tracking-tight text-[var(--color-text)]">
                        {t(option.nameKey)}
                      </h3>
                      <p className="mt-1 text-xs text-[var(--color-muted)]">
                        {t(option.descriptionKey)}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="flex flex-col gap-4">
              <SectionTitle
                icon={<AudioLines className="h-4 w-4" strokeWidth={2.3} />}
                title={t("settings.audio.title")}
              />

              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] pb-5">
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight text-[var(--color-text)]">
                      {t("settings.audio.streamingQuality")}
                    </h3>
                    <p className="mt-1 text-sm text-[var(--color-muted)]">
                      {t("settings.audio.streamingQualityDesc")}
                    </p>
                  </div>

                  <span className="rounded-lg border border-[var(--color-primary)] bg-[var(--color-secondary)] px-3 py-1 text-xs font-semibold text-[var(--color-primary)]">
                    {t("settings.audio.premium")}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 pt-5">
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight text-[var(--color-text)]">
                      {t("settings.audio.normalize")}
                    </h3>
                    <p className="mt-1 text-sm text-[var(--color-muted)]">
                      {t("settings.audio.normalizeDesc")}
                    </p>
                  </div>

                  <Toggle
                    enabled={normalizeVolume}
                    onToggle={() => setNormalizeVolume((c) => !c)}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <SectionTitle
                icon={<CircleDot className="h-4 w-4" strokeWidth={2.3} />}
                title={t("settings.playback.title")}
              />

              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                <div className="border-b border-[var(--color-border)] pb-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold tracking-tight text-[var(--color-text)]">
                        {t("settings.playback.crossfade")}
                      </h3>
                      <p className="mt-1 text-sm text-[var(--color-muted)]">
                        {t("settings.playback.crossfadeDesc")}
                      </p>
                    </div>

                    <span className="text-sm font-semibold text-[var(--color-primary)]">
                      6.5 s
                    </span>
                  </div>

                  <div className="mt-5 h-1.5 rounded-full bg-[var(--color-border)]">
                    <div className="relative h-full w-[58%] rounded-full bg-[linear-gradient(90deg,var(--color-primary)_0%,var(--color-primary)_100%)]">
                      <span className="absolute right-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 border-white bg-[var(--color-primary)]" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 pt-5">
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight text-[var(--color-text)]">
                      {t("settings.playback.gapless")}
                    </h3>
                    <p className="mt-1 text-sm text-[var(--color-muted)]">
                      {t("settings.playback.gaplessDesc")}
                    </p>
                  </div>

                  <Toggle
                    enabled={gaplessPlayback}
                    onToggle={() => setGaplessPlayback((c) => !c)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-6 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-semibold tracking-tight text-[var(--color-text)]">
                {t("settings.engine.title")}
              </h2>
              <p className="mt-3 text-sm leading-7 text-[var(--color-muted)] sm:text-base">
                {t("settings.engine.description")}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="rounded-xl bg-[linear-gradient(180deg,var(--color-cta-start)_0%,var(--color-cta-end)_100%)] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(0,0,0,0.28)] transition hover:brightness-110"
                >
                  {t("settings.engine.configure")}
                </button>

                <button
                  type="button"
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-5 py-3 text-sm font-semibold text-[var(--color-text)] transition hover:border-[var(--color-primary)] hover:bg-[var(--color-secondary)]"
                >
                  {t("settings.engine.reset")}
                </button>
              </div>
            </div>

            <div className="hidden rounded-2xl bg-[var(--color-surface-alt)] p-5 text-[var(--color-muted)] lg:block">
              <SlidersHorizontal className="h-20 w-20" strokeWidth={1.5} />
            </div>
          </div>
        </div>
      </section>
    </ClientLayout>
  );
}
