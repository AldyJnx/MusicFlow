import { Home, Library, SlidersHorizontal } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";

import { usePreferences } from "../../../shared/hooks/usePreferences";

type TabSpec = {
  to: string;
  labelKey: string;
  defaultLabel: string;
  icon: ReactNode;
  end?: boolean;
};

const TABS: TabSpec[] = [
  {
    to: "/inicio",
    labelKey: "tabs.discover",
    defaultLabel: "Descubrir",
    icon: <Home className="h-4 w-4" strokeWidth={2.2} />,
    end: true,
  },
  {
    to: "/library",
    labelKey: "tabs.library",
    defaultLabel: "Biblioteca",
    icon: <Library className="h-4 w-4" strokeWidth={2.2} />,
  },
  {
    to: "/settings",
    labelKey: "tabs.studio",
    defaultLabel: "Estudio",
    icon: <SlidersHorizontal className="h-4 w-4" strokeWidth={2.2} />,
  },
];

/**
 * Client subnav inspired by the mock's `Discover · MY LIBRARY · RADIO`
 * pills, but mapped to MusicFlow routes: Descubrir / Biblioteca / Estudio.
 * Hidden when `tabsLayout === "off"`. In `icons` mode shows only icons
 * with native tooltips for accessibility.
 */
export default function ClientTabs() {
  const { t } = useTranslation();
  const { tabsLayout } = usePreferences();

  if (tabsLayout === "off") return null;

  const iconsOnly = tabsLayout === "icons";

  return (
    <nav
      className="flex items-center gap-1"
      aria-label={t("tabs.aria", { defaultValue: "Secciones del cliente" })}
    >
      {TABS.map((tab) => {
        const label = t(tab.labelKey, { defaultValue: tab.defaultLabel });
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            title={iconsOnly ? label : undefined}
            className={({ isActive }) =>
              `group relative inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
                isActive
                  ? "text-[var(--color-text)]"
                  : "text-[var(--color-muted)] hover:text-[var(--color-text)]"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {tab.icon}
                {!iconsOnly ? <span>{label}</span> : null}
                <span
                  aria-hidden="true"
                  className={`absolute -bottom-0.5 left-1/2 h-[2.5px] -translate-x-1/2 rounded-full bg-[var(--color-primary)] transition-all duration-200 ${
                    isActive ? "w-[60%] opacity-100" : "w-0 opacity-0"
                  }`}
                />
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}
