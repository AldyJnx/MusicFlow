import { useEffect, useRef, useState } from "react";
import { Check, Palette, Settings2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { usePreferences } from "../hooks/usePreferences";
import { APP_THEMES } from "../utils/theme";

/** Compact, account-scoped theme selector for application shells. */
export default function PreferencesMenu() {
  const { t } = useTranslation();
  const { theme, setTheme } = usePreferences();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const onClick = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text)] transition hover:border-[var(--color-primary)]"
        aria-haspopup="menu"
        aria-expanded={open}
        title={t("admin.layout.preferences")}
      >
        <Settings2 className="h-3.5 w-3.5" strokeWidth={2.2} />
        <span className="hidden sm:inline">
          {t("admin.layout.preferences")}
        </span>
      </button>
      {open ? (
        <div
          role="menu"
          aria-label={t("admin.layout.preferences")}
          className="absolute right-0 z-50 mt-2 w-72 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[0_24px_60px_rgba(0,0,0,0.4)]"
        >
          <div className="mb-2 flex items-center gap-2 text-[var(--color-muted)]">
            <Palette
              className="h-3.5 w-3.5 text-[var(--color-primary)]"
              strokeWidth={2.3}
            />
            <span className="text-[10px] font-semibold uppercase tracking-wider">
              {t("admin.layout.theme")}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            {APP_THEMES.map((option) => {
              const isActive = option.id === theme;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setTheme(option.id)}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-2 text-left transition ${isActive ? "border-[var(--color-primary)] bg-[var(--color-surface-alt)]" : "border-[var(--color-border)] hover:border-[var(--color-primary)]"}`}
                >
                  <span
                    className={`h-6 w-10 rounded-md ${option.previewClassName}`}
                  />
                  <span className="flex-1 text-xs font-semibold text-[var(--color-text)]">
                    {t(option.nameKey)}
                  </span>
                  {isActive ? (
                    <Check
                      className="h-3 w-3 text-[var(--color-primary)]"
                      strokeWidth={3}
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
