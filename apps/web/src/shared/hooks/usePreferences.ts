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
  const sidebarPosition = usePreferencesStore((store) => store.sidebarPosition);
  const setSidebarPosition = usePreferencesStore(
    (store) => store.setSidebarPosition,
  );
  const queuePosition = usePreferencesStore((store) => store.queuePosition);
  const setQueuePosition = usePreferencesStore(
    (store) => store.setQueuePosition,
  );
  const lyricsScale = usePreferencesStore((store) => store.lyricsScale);
  const setLyricsScale = usePreferencesStore((store) => store.setLyricsScale);
  const assistantEnabled = usePreferencesStore(
    (store) => store.assistantEnabled,
  );
  const setAssistantEnabled = usePreferencesStore(
    (store) => store.setAssistantEnabled,
  );
  const assistantMode = usePreferencesStore((store) => store.assistantMode);
  const setAssistantMode = usePreferencesStore(
    (store) => store.setAssistantMode,
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
    sidebarPosition,
    setSidebarPosition,
    queuePosition,
    setQueuePosition,
    lyricsScale,
    setLyricsScale,
    assistantEnabled,
    setAssistantEnabled,
    assistantMode,
    setAssistantMode,
  };
}
