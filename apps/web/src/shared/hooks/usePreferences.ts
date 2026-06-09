import { usePreferencesStore } from "../stores/preferencesStore";

export function usePreferences() {
  const theme = usePreferencesStore((store) => store.theme);
  const setTheme = usePreferencesStore((store) => store.setTheme);
  const language = usePreferencesStore((store) => store.language);
  const setLanguage = usePreferencesStore((store) => store.setLanguage);

  return {
    theme,
    setTheme,
    language,
    setLanguage,
  };
}
