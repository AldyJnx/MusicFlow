import { usePreferencesStore } from "../stores/preferencesStore";

export function usePreferences() {
  const theme = usePreferencesStore((store) => store.theme);
  const setTheme = usePreferencesStore((store) => store.setTheme);
  const language = usePreferencesStore((store) => store.language);
  const setLanguage = usePreferencesStore((store) => store.setLanguage);

  const accentOverride = usePreferencesStore((store) => store.accentOverride);
  const setAccentOverride = usePreferencesStore(
    (store) => store.setAccentOverride,
  );
  const density = usePreferencesStore((store) => store.density);
  const setDensity = usePreferencesStore((store) => store.setDensity);
  const heroVariant = usePreferencesStore((store) => store.heroVariant);
  const setHeroVariant = usePreferencesStore((store) => store.setHeroVariant);
  const sidebarLayout = usePreferencesStore((store) => store.sidebarLayout);
  const setSidebarLayout = usePreferencesStore(
    (store) => store.setSidebarLayout,
  );
  const playerLayout = usePreferencesStore((store) => store.playerLayout);
  const setPlayerLayout = usePreferencesStore((store) => store.setPlayerLayout);
  const showWave = usePreferencesStore((store) => store.showWave);
  const setShowWave = usePreferencesStore((store) => store.setShowWave);
  const tabsLayout = usePreferencesStore((store) => store.tabsLayout);
  const setTabsLayout = usePreferencesStore((store) => store.setTabsLayout);
  const resetPersonalization = usePreferencesStore(
    (store) => store.resetPersonalization,
  );

  return {
    theme,
    setTheme,
    language,
    setLanguage,
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
  };
}
