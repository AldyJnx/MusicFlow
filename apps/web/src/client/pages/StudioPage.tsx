import {
  ArrowRight,
  Crown,
  Scissors,
  Settings as SettingsIcon,
  Sliders,
  Sparkles,
} from "lucide-react";
import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import ClientLayout from "../layout/ClientLayout";
import {
  usePremiumGate,
  type PremiumFeature,
} from "../../shared/hooks/usePremiumGate";
import GradientText from "../../shared/ui/reactbits/GradientText";
import Aurora from "../../shared/ui/reactbits/Aurora";

type StudioCardProps = {
  to: string;
  icon: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  tone: "primary" | "accent";
  /** When set, the card requires Premium. Free users see a corona badge
   *  and clicking opens the upgrade modal instead of navigating. */
  premium?: PremiumFeature;
};

function StudioCard({
  to,
  icon,
  eyebrow,
  title,
  description,
  tone,
  premium,
}: StudioCardProps) {
  const navigate = useNavigate();
  const { guard, isPremium } = usePremiumGate();
  const showPremiumBadge = !!premium && !isPremium;
  const accentVar =
    tone === "primary" ? "var(--color-primary)" : "var(--color-accent)";

  function handleClick() {
    if (premium) {
      guard(premium, () => navigate(to));
    } else {
      navigate(to);
    }
  }

  const reduce = useReducedMotion();

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      style={{ backdropFilter: "blur(var(--glass-blur))" }}
      variants={{
        hidden: { opacity: 0, y: 18 },
        show: { opacity: 1, y: 0 },
      }}
      whileHover={reduce ? undefined : { y: -6 }}
      whileTap={reduce ? undefined : { scale: 0.98 }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
      className="group relative flex flex-col gap-4 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-glass)] p-6 text-left transition-colors hover:border-[var(--color-primary)] hover:bg-[color-mix(in_srgb,var(--color-surface)_70%,transparent)] hover:shadow-[0_22px_48px_-12px_rgba(0,0,0,0.55)]"
    >
      {showPremiumBadge ? (
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-300">
          <Crown className="h-2.5 w-2.5" strokeWidth={2.6} />
          Premium
        </span>
      ) : null}
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
          className="text-[10px] font-bold uppercase tracking-[0.18em]"
          style={{ color: accentVar, fontFamily: "var(--font-mono)" }}
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
    </motion.button>
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
  const reduce = useReducedMotion();

  return (
    <ClientLayout>
      <section className="min-h-screen w-full text-[var(--color-text)]">
        {/* Hero strip */}
        <header className="relative overflow-hidden px-8 pb-10 pt-12">
          <Aurora intensity={0.35} />
          <motion.div
            className="relative flex max-w-3xl flex-col gap-3"
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <p
              className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-primary)]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {t("studio.eyebrow", { defaultValue: "Estudio" })}
            </p>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              <GradientText>
                {t("studio.title", { defaultValue: "Tú dominas tu sonido" })}
              </GradientText>
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-[var(--color-muted)] sm:text-base">
              {t("studio.subtitle", {
                defaultValue:
                  "Ecualizador granular, segmentos por canción, asistente IA y todas tus preferencias en un solo lugar — todo lo que distingue MusicFlow del resto.",
              })}
            </p>
          </motion.div>
        </header>

        {/* Cards grid */}
        <motion.div
          className="mx-auto grid max-w-7xl grid-cols-1 gap-5 px-8 pb-12 md:grid-cols-2 xl:grid-cols-4"
          initial={reduce ? false : "hidden"}
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
          }}
        >
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
            premium="segments"
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
            premium="ai"
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
        </motion.div>
      </section>
    </ClientLayout>
  );
}
