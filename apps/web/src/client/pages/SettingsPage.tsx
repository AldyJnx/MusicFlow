import type { ReactNode } from "react";
import {
  CheckCircle2,
  GripHorizontal,
  Palette,
  PanelRight,
  Sparkles,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import ClientLayout from "../layout/ClientLayout";
import PersonalizationSection from "../features/settings/PersonalizationSection";
import { usePreferences } from "../../shared/hooks/usePreferences";
import { APP_THEMES } from "../../shared/utils/theme";
import { useAuthStore } from "../../shared/stores/authStore";
import { usePremiumGate } from "../../shared/hooks/usePremiumGate";

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
  disabled = false,
}: {
  enabled: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={enabled}
      onClick={onToggle}
      disabled={disabled}
      className={`relative inline-flex h-7 w-12 items-center rounded-full border transition ${
        enabled
          ? "border-[var(--color-primary)] bg-[var(--color-primary)]"
          : "border-[var(--color-border)] bg-[var(--color-surface-alt)]"
      } disabled:cursor-not-allowed disabled:opacity-45`}
    >
      <span
        className={`h-5 w-5 rounded-full bg-white shadow-sm transition ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

const LANG_FLAGS = {
  es: "🇪🇸",
  en: "🇺🇸",
};
void LANG_FLAGS;

function Choice<T extends string>({
  value,
  onChange,
  options,
  disabled = false,
}: {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string }>;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(option.value)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${value === option.value ? "bg-[var(--color-primary)] text-white" : "text-[var(--color-muted)] hover:text-[var(--color-text)]"} disabled:cursor-not-allowed disabled:opacity-40`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function PreferenceCard({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <SectionTitle icon={icon} title={title} subtitle={description} />
      <div className="mt-5">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const isPremium = useAuthStore((state) => state.user?.isPremium === true);
  const { openUpgrade } = usePremiumGate();
  const {
    theme: activeTheme,
    setTheme,
    sidebarPosition,
    setSidebarPosition,
    queuePosition,
    setQueuePosition,
    lyricsScale,
    setLyricsScale,
    assistantEnabled,
    setAssistantEnabled,
    assistantMode,
    setAssistantMode,
  } = usePreferences();
  const { t } = useTranslation();

  return (
    <ClientLayout>
      <section className="min-h-screen w-full px-4 py-6 text-[var(--color-text)] sm:px-6 xl:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 rounded-[28px] border border-[var(--color-line)] bg-[color-mix(in_srgb,var(--color-surface)_82%,transparent)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-[var(--glass-blur)] sm:p-8">
          {/* Header */}
          <div className="flex flex-col gap-1">
            <p
              className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-primary)]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {t("settings.eyebrow", { defaultValue: "Ajustes" })}
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              {t("settings.title", { defaultValue: "Configuración" })}
            </h1>
            <p className="text-sm text-[var(--color-muted)]">
              {t("settings.subtitle", {
                defaultValue: "Ajusta tu cuenta, reproducción y ecualización",
              })}
            </p>
            <p className="mt-2 max-w-2xl text-xs text-[var(--color-muted)]">
              Temas, distribución y preferencias de asistencia se aplican y se
              guardan por cuenta.
            </p>
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

          <PersonalizationSection />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <PreferenceCard
              icon={<PanelRight className="h-4 w-4" />}
              title="Sidebar"
              description="Elige en qué lado se muestra la navegación principal."
            >
              <Choice
                value={sidebarPosition}
                onChange={setSidebarPosition}
                options={[
                  { value: "left", label: "Izquierda" },
                  { value: "right", label: "Derecha" },
                ]}
              />
            </PreferenceCard>
            <PreferenceCard
              icon={<PanelRight className="h-4 w-4" />}
              title="Cola - Reproducción"
              description="El panel de cola se mantiene a la derecha por defecto."
            >
              <Choice
                value={queuePosition}
                onChange={setQueuePosition}
                options={[
                  { value: "left", label: "Izquierda" },
                  { value: "right", label: "Derecha" },
                ]}
              />
            </PreferenceCard>
            <PreferenceCard
              icon={<GripHorizontal className="h-4 w-4" />}
              title="Letra"
              description="Ajusta el tamaño de las letras durante la reproducción."
            >
              <div className="flex items-center gap-3">
                <input
                  aria-label="Escala de letra"
                  type="range"
                  min="0.85"
                  max="1.2"
                  step="0.05"
                  value={lyricsScale}
                  onChange={(event) =>
                    setLyricsScale(Number(event.target.value))
                  }
                  className="w-full accent-[var(--color-primary)]"
                />
                <button
                  type="button"
                  onClick={() => setLyricsScale(1)}
                  className="text-xs font-semibold text-[var(--color-primary)]"
                >
                  Default
                </button>
              </div>
            </PreferenceCard>
            <PreferenceCard
              icon={<Sparkles className="h-4 w-4" />}
              title="Asistente IA"
              description="Controla la presencia y el comportamiento del asistente FlowIA."
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Toggle
                    enabled={isPremium && assistantEnabled}
                    disabled={!isPremium}
                    onToggle={() =>
                      isPremium
                        ? setAssistantEnabled(!assistantEnabled)
                        : openUpgrade("ai")
                    }
                  />
                  <span className="text-sm text-[var(--color-muted)]">
                    {!isPremium
                      ? "Premium"
                      : assistantEnabled
                        ? "Activo"
                        : "Desactivado"}
                  </span>
                </div>
                <Choice
                  value={assistantMode}
                  onChange={setAssistantMode}
                  options={[
                    { value: "static", label: "Estático" },
                    { value: "draggable", label: "Arrastrable" },
                  ]}
                  disabled={!isPremium || !assistantEnabled}
                />
              </div>
            </PreferenceCard>
          </div>
        </div>
      </section>
    </ClientLayout>
  );
}
