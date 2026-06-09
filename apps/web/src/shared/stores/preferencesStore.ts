import { useSyncExternalStore } from "react";
import { applyTheme, normalizeThemeId, type AppThemeId } from "../utils/theme";
import { changeLanguage, type AppLanguage } from "../i18n";

type PreferencesState = {
  theme: AppThemeId;
  language: AppLanguage;
};

type PreferencesActions = {
  setTheme: (theme: AppThemeId) => void;
  setLanguage: (language: AppLanguage) => void;
};

export type PreferencesStore = PreferencesState & PreferencesActions;

const listeners = new Set<() => void>();

const state: PreferencesState = {
  theme: "midnight-neon",
  language: "es",
};

function emitChange() {
  listeners.forEach((listener) => listener());
}

function updateState(partial: Partial<PreferencesState>) {
  Object.assign(state, partial);
  emitChange();
}

const actions: PreferencesActions = {
  setTheme(theme) {
    updateState({ theme });
    applyTheme(theme);
    localStorage.setItem("musicflow-theme", theme);
  },
  setLanguage(language) {
    updateState({ language });
    changeLanguage(language);
  },
};

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getStore(): PreferencesStore {
  return {
    ...state,
    ...actions,
  };
}

export function initializePreferences() {
  const savedTheme = normalizeThemeId(localStorage.getItem("musicflow-theme"));
  const savedLang =
    (localStorage.getItem("musicflow-lang") as AppLanguage | null) ?? "es";

  state.theme = savedTheme;
  state.language = savedLang;
  applyTheme(savedTheme);
  // Persist the normalized id so future reads skip the legacy alias path.
  localStorage.setItem("musicflow-theme", savedTheme);
}

export function usePreferencesStore<T>(
  selector: (store: PreferencesStore) => T,
) {
  return useSyncExternalStore(
    subscribe,
    () => selector(getStore()),
    () => selector(getStore()),
  );
}
