import { CheckCircle2, RotateCcw, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

import { usePreferences } from "../../../shared/hooks/usePreferences";
import SegmentedControl from "../../../shared/ui/SegmentedControl";
import type {
  HeroVariant,
  PlayerLayout,
  SidebarLayout,
  TabsLayout,
} from "../../../shared/stores/preferencesStore";
import type { AppDensity } from "../../../shared/utils/theme";

function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-3 text-[var(--color-text)]">
        <span className="text-[var(--color-primary)]">
          <Sparkles className="h-4 w-4" strokeWidth={2.3} />
        </span>
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      </div>
      <p className="pl-7 text-xs text-[var(--color-muted)]">{subtitle}</p>
    </div>
  );
}

function FieldHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h3 className="text-sm font-semibold tracking-tight text-[var(--color-text)]">
        {title}
      </h3>
      <p className="mt-0.5 text-xs text-[var(--color-muted)]">{subtitle}</p>
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

const SUGGESTED_ACCENTS = [
  "#36e2ec",
  "#22e58a",
  "#fb923c",
  "#a78bfa",
  "#ec4899",
  "#3b82f6",
];

export default function PersonalizationSection() {
  const { t } = useTranslation();
  const {
    accentOverride,
    setAccentOverride,
    density,
    setDensity,
    heroVariant,
    setHeroVariant,
    sidebarLayout,
    setSidebarLayout,
    playerLayout,
    setPlayerLayout,
    showWave,
    setShowWave,
    tabsLayout,
    setTabsLayout,
    resetPersonalization,
  } = usePreferences();

  return (
    <div className="flex flex-col gap-5">
      <SectionTitle
        title={t("settings.personalization.title")}
        subtitle={t("settings.personalization.subtitle")}
      />

      <div className="grid grid-cols-1 gap-5 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 xl:grid-cols-2">
        {/* Accent override */}
        <div className="flex flex-col gap-3 border-b border-[var(--color-border)] pb-5 xl:border-b-0 xl:border-r xl:pb-0 xl:pr-5">
          <FieldHeader
            title={t("settings.personalization.accent.title")}
            subtitle={t("settings.personalization.accent.subtitle")}
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setAccentOverride(null)}
              className={`flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-semibold transition ${
                accentOverride === null
                  ? "border-[var(--color-primary)] bg-[var(--color-surface-alt)] text-[var(--color-text)]"
                  : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              {accentOverride === null ? (
                <CheckCircle2
                  className="h-3.5 w-3.5 text-[var(--color-primary)]"
                  strokeWidth={2.5}
                />
              ) : null}
              {t("settings.personalization.accent.useTheme")}
            </button>
            {SUGGESTED_ACCENTS.map((hex) => {
              const active =
                accentOverride?.toLowerCase() === hex.toLowerCase();
              return (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setAccentOverride(hex)}
                  className={`h-9 w-9 rounded-lg border-2 transition ${
                    active
                      ? "border-white shadow-[0_0_0_2px_var(--color-primary)]"
                      : "border-transparent hover:border-[var(--color-border)]"
                  }`}
                  style={{ backgroundColor: hex }}
                  aria-label={hex}
                />
              );
            })}
            <label className="flex h-9 items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-xs font-semibold text-[var(--color-muted)] hover:text-[var(--color-text)]">
              <input
                type="color"
                value={accentOverride ?? "#36e2ec"}
                onChange={(e) => setAccentOverride(e.target.value)}
                className="h-5 w-5 cursor-pointer rounded border-none bg-transparent p-0"
                aria-label={t("settings.personalization.accent.custom")}
              />
              {t("settings.personalization.accent.custom")}
            </label>
          </div>
        </div>

        {/* Density */}
        <div className="flex flex-col gap-3 xl:pl-5">
          <FieldHeader
            title={t("settings.personalization.density.title")}
            subtitle={t("settings.personalization.density.subtitle")}
          />
          <SegmentedControl<AppDensity>
            value={density}
            onChange={setDensity}
            options={[
              {
                id: "comfortable",
                label: t("settings.personalization.density.comfortable"),
              },
              {
                id: "compact",
                label: t("settings.personalization.density.compact"),
              },
            ]}
          />
        </div>

        {/* Hero variant */}
        <div className="flex flex-col gap-3 border-t border-[var(--color-border)] pt-5 xl:border-t-0 xl:border-r xl:pr-5 xl:pt-0">
          <FieldHeader
            title={t("settings.personalization.hero.title")}
            subtitle={t("settings.personalization.hero.subtitle")}
          />
          <SegmentedControl<HeroVariant>
            value={heroVariant}
            onChange={setHeroVariant}
            options={[
              {
                id: "featured-track",
                label: t("settings.personalization.hero.featured-track"),
              },
              {
                id: "featured-playlist",
                label: t("settings.personalization.hero.featured-playlist"),
              },
              {
                id: "off",
                label: t("settings.personalization.hero.off"),
              },
            ]}
          />
        </div>

        {/* Sidebar layout */}
        <div className="flex flex-col gap-3 border-t border-[var(--color-border)] pt-5 xl:pl-5 xl:pt-0">
          <FieldHeader
            title={t("settings.personalization.sidebar.title")}
            subtitle={t("settings.personalization.sidebar.subtitle")}
          />
          <SegmentedControl<SidebarLayout>
            value={sidebarLayout}
            onChange={setSidebarLayout}
            options={[
              {
                id: "numbered",
                label: t("settings.personalization.sidebar.numbered"),
              },
              {
                id: "playlists",
                label: t("settings.personalization.sidebar.playlists"),
              },
              {
                id: "both",
                label: t("settings.personalization.sidebar.both"),
              },
            ]}
          />
        </div>

        {/* Player layout */}
        <div className="flex flex-col gap-3 border-t border-[var(--color-border)] pt-5 xl:border-r xl:border-t-0 xl:pr-5 xl:pt-0">
          <FieldHeader
            title={t("settings.personalization.player.title")}
            subtitle={t("settings.personalization.player.subtitle")}
          />
          <SegmentedControl<PlayerLayout>
            value={playerLayout}
            onChange={setPlayerLayout}
            options={[
              {
                id: "compact",
                label: t("settings.personalization.player.compact"),
              },
              {
                id: "expanded",
                label: t("settings.personalization.player.expanded"),
              },
              {
                id: "auto",
                label: t("settings.personalization.player.auto"),
              },
            ]}
          />
        </div>

        {/* Tabs layout */}
        <div className="flex flex-col gap-3 border-t border-[var(--color-border)] pt-5 xl:pl-5 xl:pt-0">
          <FieldHeader
            title={t("settings.personalization.tabs.title")}
            subtitle={t("settings.personalization.tabs.subtitle")}
          />
          <SegmentedControl<TabsLayout>
            value={tabsLayout}
            onChange={setTabsLayout}
            options={[
              {
                id: "full",
                label: t("settings.personalization.tabs.full"),
              },
              {
                id: "icons",
                label: t("settings.personalization.tabs.icons"),
              },
              {
                id: "off",
                label: t("settings.personalization.tabs.off"),
              },
            ]}
          />
        </div>

        {/* Wave toggle */}
        <div className="flex items-center justify-between gap-4 border-t border-[var(--color-border)] pt-5 xl:col-span-2">
          <FieldHeader
            title={t("settings.personalization.wave.title")}
            subtitle={t("settings.personalization.wave.subtitle")}
          />
          <Toggle enabled={showWave} onToggle={() => setShowWave(!showWave)} />
        </div>

        {/* Reset */}
        <div className="flex justify-end xl:col-span-2">
          <button
            type="button"
            onClick={resetPersonalization}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-4 py-2 text-xs font-semibold text-[var(--color-muted)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-text)]"
          >
            <RotateCcw className="h-3.5 w-3.5" strokeWidth={2.3} />
            {t("settings.personalization.reset")}
          </button>
        </div>
      </div>
    </div>
  );
}
