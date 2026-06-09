import {
  ArrowRight,
  Scissors,
  Settings as SettingsIcon,
  Sliders,
  Sparkles,
} from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import ClientLayout from "../layout/ClientLayout";

type StudioCardProps = {
  to: string;
  icon: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  tone: "primary" | "accent";
};

function StudioCard({
  to,
  icon,
  eyebrow,
  title,
  description,
  tone,
}: StudioCardProps) {
  const navigate = useNavigate();
  const accentVar =
    tone === "primary" ? "var(--color-primary)" : "var(--color-accent)";
  return (
    <button
      type="button"
      onClick={() => navigate(to)}
      className="group flex flex-col gap-4 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-left transition hover:-translate-y-1 hover:border-[var(--color-primary)] hover:shadow-[0_18px_40px_rgba(0,0,0,0.32)]"
    >
      <div
        className="inline-flex h-12 w-12 items-center justify-center rounded-2xl"
        style={{
          color: accentVar,
          backgroundColor: `color-mix(in srgb, ${accentVar} 14%, transparent)`,
        }}
      >
        {icon}
      </div>
      <div className="flex flex-col gap-1">
        <p
          className="text-[10px] font-bold uppercase tracking-[0.22em]"
          style={{ color: accentVar }}
        >
          {eyebrow}
        </p>
        <h2 className="text-xl font-semibold tracking-tight text-[var(--color-text)]">
          {title}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-[var(--color-muted)]">
          {description}
        </p>
      </div>
      <ArrowRight
        className="mt-auto h-4 w-4 text-[var(--color-muted)] transition group-hover:translate-x-1 group-hover:text-[var(--color-primary)]"
        strokeWidth={2.4}
      />
    </button>
  );
}

/**
 * Studio is MusicFlow's "you own your sound" hub — a single page that
 * gathers the four surfaces that make this app different from a regular
 * player: the EQ, the segment editor, the AI mixer, and the preferences
 * that shape everything else. No new data here, just clear navigation
 * with the cyan fusion language so users discover the differentiators.
 */
export default function StudioPage() {
  const { t } = useTranslation();

  return (
    <ClientLayout>
      <section className="min-h-screen w-full bg-[var(--color-page)] text-[var(--color-text)]">
        {/* Hero strip */}
        <header className="relative overflow-hidden px-8 pb-10 pt-12">
          <div
            className="pointer-events-none absolute -left-20 top-0 h-64 w-64 rounded-full opacity-30 blur-3xl"
            style={{ backgroundColor: "var(--color-primary)" }}
          />
          <div
            className="pointer-events-none absolute -right-10 top-10 h-72 w-72 rounded-full opacity-20 blur-3xl"
            style={{ backgroundColor: "var(--color-accent)" }}
          />
          <div className="relative flex max-w-3xl flex-col gap-3">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-primary)]">
              {t("studio.eyebrow", { defaultValue: "Estudio" })}
            </p>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              {t("studio.title", { defaultValue: "Tú dominas tu sonido" })}
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-[var(--color-muted)] sm:text-base">
              {t("studio.subtitle", {
                defaultValue:
                  "Ecualizador granular, segmentos por canción, asistente IA y todas tus preferencias en un solo lugar — todo lo que distingue MusicFlow del resto.",
              })}
            </p>
          </div>
        </header>

        {/* Cards grid */}
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 px-8 pb-12 md:grid-cols-2 xl:grid-cols-4">
          <StudioCard
            to="/equalizer"
            tone="primary"
            icon={<Sliders className="h-6 w-6" strokeWidth={2.2} />}
            eyebrow={t("studio.eq.eyebrow", { defaultValue: "Sonido" })}
            title={t("studio.eq.title", { defaultValue: "Ecualizador" })}
            description={t("studio.eq.description", {
              defaultValue:
                "Curvas globales, por playlist y por canción. Aplican en cascada al reproducir.",
            })}
          />
          <StudioCard
            to="/segments"
            tone="accent"
            icon={<Scissors className="h-6 w-6" strokeWidth={2.2} />}
            eyebrow={t("studio.segments.eyebrow", {
              defaultValue: "Granular",
            })}
            title={t("studio.segments.title", { defaultValue: "Segmentos" })}
            description={t("studio.segments.description", {
              defaultValue:
                "EQ distinto en cada parte de un track — intro, verso, coro, outro. La feature firma de MusicFlow.",
            })}
          />
          <StudioCard
            to="/ai-mixer"
            tone="accent"
            icon={<Sparkles className="h-6 w-6" strokeWidth={2.2} />}
            eyebrow={t("studio.ai.eyebrow", { defaultValue: "Asistente" })}
            title={t("studio.ai.title", { defaultValue: "Agente IA" })}
            description={t("studio.ai.description", {
              defaultValue:
                "Describe cómo quieres que suene y Claude propone una curva. Aplicás o descartás, no es destructivo.",
            })}
          />
          <StudioCard
            to="/settings"
            tone="primary"
            icon={<SettingsIcon className="h-6 w-6" strokeWidth={2.2} />}
            eyebrow={t("studio.prefs.eyebrow", {
              defaultValue: "Apariencia",
            })}
            title={t("studio.prefs.title", { defaultValue: "Preferencias" })}
            description={t("studio.prefs.description", {
              defaultValue:
                "Tema, acento, densidad, hero, sidebar, player, tabs. Cambian en vivo sin recargar.",
            })}
          />
        </div>
      </section>
    </ClientLayout>
  );
}
