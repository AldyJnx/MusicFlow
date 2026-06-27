import { Disc3, ListMusic, Music3, Scissors } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  useEqCascade,
  type CascadeScopeId,
} from "../../../shared/hooks/useEqCascade";

const ICONS: Record<CascadeScopeId, typeof Disc3> = {
  global: Disc3,
  playlist: ListMusic,
  track: Music3,
  segment: Scissors,
};

/**
 * The EQ cascade — Global → Playlist → Pista → Segmento — shown as a stack of
 * cards for the currently-playing context. Each card reports whether a config
 * exists at that level (ACTIVO) and the most-specific active one is flagged
 * "EN VIVO": the visual contract of "lo más específico gana".
 *
 * Clicking a card selects that scope for editing (drives the page's `scope`).
 */
export default function EqCascade({
  active,
  onSelect,
}: {
  active: CascadeScopeId;
  onSelect: (id: CascadeScopeId) => void;
}) {
  const { t } = useTranslation();
  const { levels } = useEqCascade();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p
          className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-muted)]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {t("eq.cascade.title", {
            defaultValue: "Cascada de EQ · lo más específico gana",
          })}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {levels.map((level) => {
          const Icon = ICONS[level.id];
          const isSelected = level.id === active;
          const dimmed = !level.available;

          return (
            <button
              key={level.id}
              type="button"
              onClick={() => onSelect(level.id)}
              aria-pressed={isSelected}
              className={`group relative flex flex-col gap-2 rounded-2xl border px-3.5 py-3 text-left transition ${
                level.isWinner
                  ? "border-[var(--color-accent)] bg-[color-mix(in_srgb,var(--color-accent)_10%,transparent)]"
                  : isSelected
                    ? "border-[var(--color-primary)] bg-[var(--color-surface-alt)]"
                    : "border-[var(--color-line)] bg-[var(--color-glass)] hover:border-[var(--color-primary)]"
              } ${dimmed ? "opacity-55" : ""}`}
              style={{ backdropFilter: "blur(var(--glass-blur))" }}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${
                    level.isWinner
                      ? "bg-[var(--color-accent)] text-[var(--color-primary-contrast)]"
                      : isSelected
                        ? "bg-[var(--color-primary)] text-[var(--color-primary-contrast)]"
                        : "bg-[var(--color-surface-alt)] text-[var(--color-muted)] group-hover:text-[var(--color-text)]"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={2.3} />
                </span>
                {level.isWinner ? (
                  <span
                    className="rounded-full bg-[var(--color-accent)] px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-[var(--color-primary-contrast)]"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {t("eq.cascade.live", { defaultValue: "En vivo" })}
                  </span>
                ) : null}
              </div>

              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--color-text)]">
                  {t(`eq.scope.${level.id}`)}
                </p>
                <p className="truncate text-[10px] text-[var(--color-muted)]">
                  {t(`eq.scope.${level.id}Desc`)}
                </p>
              </div>

              {level.active ? (
                <span className="inline-flex w-fit items-center gap-1 rounded-full border border-[color-mix(in_srgb,var(--color-success)_40%,transparent)] bg-[color-mix(in_srgb,var(--color-success)_12%,transparent)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[var(--color-success)]">
                  {t("eq.cascade.active", { defaultValue: "Activo" })}
                </span>
              ) : (
                <span className="text-[9px] font-medium uppercase tracking-wider text-[var(--color-muted)]/60">
                  {level.available
                    ? t("eq.cascade.empty", { defaultValue: "Sin curva" })
                    : t("eq.cascade.noContext", {
                        defaultValue: "Sin contexto",
                      })}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
