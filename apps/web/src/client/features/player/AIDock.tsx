import { useTranslation } from "react-i18next";
import { ArrowUpRight, MessageSquarePlus, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { usePlayerStore } from "../../stores/playStore";

type AIDockProps = {
  trackId: string | null;
};

const CHIP_KEYS = [
  "warmer",
  "brighter",
  "punch",
  "vocal",
  "detectSegments",
] as const;

/**
 * Ambient AI dock for the expanded player. The full chat lives in /ai-mixer
 * — this dock is the "always within reach" surface: contextual chips for
 * common EQ tweaks plus a one-click entry into the quick-prompt modal.
 */
export default function AIDock({ trackId }: AIDockProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const openAiPrompt = usePlayerStore((s) => s.openAiPrompt);
  const setExpanded = usePlayerStore((s) => s.setExpanded);

  function openFull() {
    setExpanded(false);
    navigate(trackId ? `/ai-mixer?trackId=${trackId}` : "/ai-mixer");
  }

  return (
    <aside className="flex h-full min-h-0 flex-col rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)]/70 backdrop-blur-xl">
      <header className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="relative">
            <span className="absolute inset-0 -m-1 animate-ping rounded-full bg-[var(--color-accent)]/40" />
            <Sparkles
              className="relative h-4 w-4 text-[var(--color-accent)]"
              strokeWidth={2.3}
            />
          </span>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-text)]">
              {t("player.ai.dockTitle")}
            </h3>
            <p className="text-[10px] text-[var(--color-muted)]">
              {t("player.ai.dockSubtitle")}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={openFull}
          className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-text)]"
          title={t("player.ai.openFull")}
        >
          {t("player.ai.openFull")}
          <ArrowUpRight className="h-3 w-3" strokeWidth={2.3} />
        </button>
      </header>

      <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-5">
        <button
          type="button"
          onClick={openAiPrompt}
          className="group relative overflow-hidden rounded-2xl border border-[var(--color-accent)]/40 bg-[linear-gradient(135deg,var(--color-cta-start)_0%,var(--color-cta-end)_100%)] p-5 text-left text-white shadow-[0_18px_40px_rgba(0,0,0,0.25)] transition hover:scale-[1.01]"
        >
          <div className="flex items-start gap-3">
            <MessageSquarePlus
              className="mt-0.5 h-5 w-5 shrink-0"
              strokeWidth={2.2}
            />
            <div>
              <p className="text-base font-semibold tracking-tight">
                {t("player.ai.quickPrompt")}
              </p>
              <p className="mt-1 text-xs text-white/80">
                Ej: <i>“Hazlo más cálido para escucha nocturna”</i>
              </p>
            </div>
          </div>
          <div className="absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
        </button>

        <div className="flex flex-col gap-2">
          <p className="px-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
            Atajos
          </p>
          <div className="flex flex-wrap gap-2">
            {CHIP_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={openAiPrompt}
                className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-1.5 text-xs font-medium text-[var(--color-text)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
              >
                {t(`player.ai.chips.${key}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-auto rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-alt)]/50 p-4">
          <p className="text-[11px] leading-5 text-[var(--color-muted)]">
            El asistente lee el segmento activo y la curva actual antes de
            proponer cambios. Aplicarlos no es destructivo: siempre puedes
            descartar.
          </p>
        </div>
      </div>
    </aside>
  );
}
