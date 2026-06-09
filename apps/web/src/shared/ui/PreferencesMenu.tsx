import { useEffect, useRef, useState } from "react";
import { Check, Globe2, Palette, Settings2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { usePreferences } from "../hooks/usePreferences";
import { APP_THEMES } from "../utils/theme";
import { SUPPORTED_LANGUAGES, type AppLanguage } from "../i18n";

const LANG_FLAGS: Record<AppLanguage, string> = {
  es: "🇪🇸",
  en: "🇺🇸",
};

/**
 * Compact preferences popover — language + theme selectors. Designed to live
 * in the admin header (and any other shell that doesn't show the full
 * SettingsPage), so admins can switch language/theme without leaving the
 * dashboard.
 */
export default function PreferencesMenu() {
  const { t } = useTranslation();
  const { language, setLanguage, theme, setTheme } = usePreferences();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Click-outside + ESC to close.
  useEffect(() => {
    if (!open) return undefined;
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
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
        onClick={() => setOpen((v) => !v)}
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
          {/* Language */}
          <div className="mb-4">
            <div className="mb-2 flex items-center gap-2 text-[var(--color-muted)]">
              <Globe2
                className="h-3.5 w-3.5 text-[var(--color-primary)]"
                strokeWidth={2.3}
              />
              <span className="text-[10px] font-semibold uppercase tracking-wider">
                {t("admin.layout.language")}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isActive = language === lang;
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setLanguage(lang)}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                      isActive
                        ? "border-[var(--color-primary)] bg-[var(--color-surface-alt)] text-[var(--color-text)]"
                        : "border-[var(--color-border)] bg-[var(--color-surface-alt)]/40 text-[var(--color-text)] hover:border-[var(--color-primary)]"
                    }`}
                  >
                    <span className="text-base leading-none">
                      {LANG_FLAGS[lang]}
                    </span>
                    {t(`settings.language.${lang}`)}
                    {isActive ? (
                      <Check
                        className="ml-auto h-3 w-3 text-[var(--color-primary)]"
                        strokeWidth={3}
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Theme */}
          <div>
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
                    className={`flex items-center gap-3 rounded-xl border px-3 py-2 text-left transition ${
                      isActive
                        ? "border-[var(--color-primary)] bg-[var(--color-surface-alt)]"
                        : "border-[var(--color-border)] hover:border-[var(--color-primary)]"
                    }`}
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
        </div>
      ) : null}
    </div>
  );
}
