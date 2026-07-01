import { Music } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useTranslation } from "react-i18next";

import { usePlayerStore } from "../stores/playStore";
import BorderGlow from "../../shared/ui/reactbits/BorderGlow";

/**
 * Persistent floating action button for the AI assistant — always within reach
 * on every client page. Opens the in-place assistant panel (`openAiPrompt`)
 * without navigating away: with a track it tunes that song, otherwise it tunes
 * the global sound. Floats above the mini-player bar and hides itself while the
 * panel is already open so it never overlaps it.
 */
export default function AIAssistantFab() {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const openAiPrompt = usePlayerStore((s) => s.openAiPrompt);
  const aiPromptOpen = usePlayerStore((s) => s.aiPromptOpen);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isExpanded = usePlayerStore((s) => s.isExpanded);

  // The mini-player is a 78px sticky bar shown only while a track plays and the
  // player isn't expanded — lift the FAB above it so they never collide.
  const miniPlayerVisible = !!currentTrack && !isExpanded;

  // Hide the FAB while the quick prompt is open OR the expanded player is up —
  // the expanded player already has an explicit "Ajustar con IA" CTA, so the
  // floating button would be a redundant second AI entry point there.
  const hidden = aiPromptOpen || isExpanded;

  return (
    <AnimatePresence>
      {hidden ? null : (
        <motion.button
          type="button"
          onClick={() => openAiPrompt()}
          title={t("right.assistant", { defaultValue: "Asistente IA" })}
          aria-label={t("right.assistant", { defaultValue: "Asistente IA" })}
          initial={reduce ? false : { opacity: 0, scale: 0.6, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6, y: 14 }}
          whileHover={reduce ? undefined : { scale: 1.06 }}
          whileTap={reduce ? undefined : { scale: 0.92 }}
          transition={{ type: "spring", stiffness: 380, damping: 24 }}
          style={{
            background:
              "linear-gradient(135deg,var(--color-primary),var(--color-accent))",
            bottom: miniPlayerVisible ? 96 : 20,
          }}
          className="group fixed right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-[0_16px_38px_-8px_var(--color-primary)] lg:right-[84px]"
        >
          {/* Animated glow border to draw the eye. */}
          {reduce ? null : <BorderGlow thickness={2} durationSeconds={3} />}

          <Music className="relative h-6 w-6" strokeWidth={2.3} />

          {/* Hover label. */}
          <span className="pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap rounded-lg bg-[var(--color-surface)] px-2.5 py-1 text-xs font-semibold text-[var(--color-text)] opacity-0 shadow-lg transition group-hover:opacity-100 sm:block">
            {t("fab.askAi", { defaultValue: "Pregúntale a la IA" })}
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
