import { usePreferencesStore } from '../stores/preferencesStore'

export function usePreferences() {
  const theme = usePreferencesStore((store) => store.theme)
  const setTheme = usePreferencesStore((store) => store.setTheme)

  return {
    theme,
    setTheme,
  }
}
