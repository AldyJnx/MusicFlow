import { useSyncExternalStore } from "react";
import {
  applyTheme,
  isValidHexColor,
  normalizeThemeId,
  type AppDensity,
  type AppThemeId,
} from "../utils/theme";
import { changeLanguage, type AppLanguage } from "../i18n";

export type HeroVariant = "featured-track" | "featured-playlist" | "off";
export type SidebarLayout = "numbered" | "playlists" | "both";
export type PlayerLayout = "compact" | "expanded" | "auto";
export type TabsLayout = "full" | "icons" | "off";

type PreferencesState = {
  theme: AppThemeId;
  language: AppLanguage;
  accentOverride: string | null;
  density: AppDensity;
  heroVariant: HeroVariant;
  sidebarLayout: SidebarLayout;
  playerLayout: PlayerLayout;
  showWave: boolean;
  tabsLayout: TabsLayout;
};

type PreferencesActions = {
  setTheme: (theme: AppThemeId) => void;
  setLanguage: (language: AppLanguage) => void;
  setAccentOverride: (hex: string | null) => void;
  setDensity: (density: AppDensity) => void;
  setHeroVariant: (variant: HeroVariant) => void;
  setSidebarLayout: (layout: SidebarLayout) => void;
  setPlayerLayout: (layout: PlayerLayout) => void;
  setShowWave: (show: boolean) => void;
  setTabsLayout: (layout: TabsLayout) => void;
  resetPersonalization: () => void;
};

export type PreferencesStore = PreferencesState & PreferencesActions;

const STORAGE_KEYS = {
  theme: "musicflow-theme",
  language: "musicflow-lang",
  accent: "musicflow-accent",
  density: "musicflow-density",
  hero: "musicflow-hero",
  sidebar: "musicflow-sidebar",
  player: "musicflow-player",
  wave: "musicflow-wave",
  tabs: "musicflow-tabs",
} as const;

// Personalization must be owned by the authenticated account, not the browser
// origin. A browser can legitimately have an admin and a listener open at the
// same time; shared unscoped keys made their themes overwrite each other.
const preferenceStorage = localStorage;
let activePreferenceOwner = "anonymous";

function scopedKey(key: string): string {
  return `${key}:${activePreferenceOwner}`;
}

const DEFAULTS: PreferencesState = {
  theme: "midnight-neon",
  language: "es",
  accentOverride: null,
  density: "comfortable",
  heroVariant: "featured-track",
  sidebarLayout: "both",
  playerLayout: "auto",
  showWave: true,
  tabsLayout: "full",
};

const listeners = new Set<() => void>();
const state: PreferencesState = { ...DEFAULTS };

function emitChange() {
  listeners.forEach((listener) => listener());
}

function updateState(partial: Partial<PreferencesState>) {
  Object.assign(state, partial);
  emitChange();
}

function reapplyTheme() {
  applyTheme(state.theme, {
    accentOverride: state.accentOverride,
    density: state.density,
  });
}

const actions: PreferencesActions = {
  setTheme(theme) {
    updateState({ theme });
    reapplyTheme();
    preferenceStorage.setItem(scopedKey(STORAGE_KEYS.theme), theme);
  },
  setLanguage(language) {
    updateState({ language });
    changeLanguage(language);
  },
  setAccentOverride(hex) {
    const normalized = hex && isValidHexColor(hex) ? hex.trim() : null;
    updateState({ accentOverride: normalized });
    reapplyTheme();
    if (normalized) {
      preferenceStorage.setItem(scopedKey(STORAGE_KEYS.accent), normalized);
    } else {
      preferenceStorage.removeItem(scopedKey(STORAGE_KEYS.accent));
    }
  },
  setDensity(density) {
    updateState({ density });
    reapplyTheme();
    preferenceStorage.setItem(scopedKey(STORAGE_KEYS.density), density);
  },
  setHeroVariant(variant) {
    updateState({ heroVariant: variant });
    preferenceStorage.setItem(scopedKey(STORAGE_KEYS.hero), variant);
  },
  setSidebarLayout(layout) {
    updateState({ sidebarLayout: layout });
    preferenceStorage.setItem(scopedKey(STORAGE_KEYS.sidebar), layout);
  },
  setPlayerLayout(layout) {
    updateState({ playerLayout: layout });
    preferenceStorage.setItem(scopedKey(STORAGE_KEYS.player), layout);
  },
  setShowWave(show) {
    updateState({ showWave: show });
    preferenceStorage.setItem(scopedKey(STORAGE_KEYS.wave), show ? "1" : "0");
  },
  setTabsLayout(layout) {
    updateState({ tabsLayout: layout });
    preferenceStorage.setItem(scopedKey(STORAGE_KEYS.tabs), layout);
  },
  resetPersonalization() {
    updateState({
      accentOverride: DEFAULTS.accentOverride,
      density: DEFAULTS.density,
      heroVariant: DEFAULTS.heroVariant,
      sidebarLayout: DEFAULTS.sidebarLayout,
      playerLayout: DEFAULTS.playerLayout,
      showWave: DEFAULTS.showWave,
      tabsLayout: DEFAULTS.tabsLayout,
    });
    reapplyTheme();
    preferenceStorage.removeItem(scopedKey(STORAGE_KEYS.accent));
    preferenceStorage.removeItem(scopedKey(STORAGE_KEYS.density));
    preferenceStorage.removeItem(scopedKey(STORAGE_KEYS.hero));
    preferenceStorage.removeItem(scopedKey(STORAGE_KEYS.sidebar));
    preferenceStorage.removeItem(scopedKey(STORAGE_KEYS.player));
    preferenceStorage.removeItem(scopedKey(STORAGE_KEYS.wave));
    preferenceStorage.removeItem(scopedKey(STORAGE_KEYS.tabs));
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

function readEnum<T extends string>(
  key: string,
  allowed: readonly T[],
  fallback: T,
): T {
  const raw = preferenceStorage.getItem(key);
  return (allowed as readonly string[]).includes(raw ?? "")
    ? (raw as T)
    : fallback;
}

export function initializePreferences() {
  const savedTheme = normalizeThemeId(
    preferenceStorage.getItem(scopedKey(STORAGE_KEYS.theme)),
  );
  const savedLang =
    (preferenceStorage.getItem(
      scopedKey(STORAGE_KEYS.language),
    ) as AppLanguage | null) ?? "es";
  const savedAccent = preferenceStorage.getItem(scopedKey(STORAGE_KEYS.accent));
  const savedDensity = readEnum<AppDensity>(
    scopedKey(STORAGE_KEYS.density),
    ["comfortable", "compact"] as const,
    DEFAULTS.density,
  );
  const savedHero = readEnum<HeroVariant>(
    scopedKey(STORAGE_KEYS.hero),
    ["featured-track", "featured-playlist", "off"] as const,
    DEFAULTS.heroVariant,
  );
  const savedSidebar = readEnum<SidebarLayout>(
    scopedKey(STORAGE_KEYS.sidebar),
    ["numbered", "playlists", "both"] as const,
    DEFAULTS.sidebarLayout,
  );
  const savedPlayer = readEnum<PlayerLayout>(
    scopedKey(STORAGE_KEYS.player),
    ["compact", "expanded", "auto"] as const,
    DEFAULTS.playerLayout,
  );
  const savedWave = preferenceStorage.getItem(scopedKey(STORAGE_KEYS.wave));
  const savedTabs = readEnum<TabsLayout>(
    scopedKey(STORAGE_KEYS.tabs),
    ["full", "icons", "off"] as const,
    DEFAULTS.tabsLayout,
  );

  state.theme = savedTheme;
  state.language = savedLang;
  state.accentOverride = isValidHexColor(savedAccent) ? savedAccent : null;
  state.density = savedDensity;
  state.heroVariant = savedHero;
  state.sidebarLayout = savedSidebar;
  state.playerLayout = savedPlayer;
  state.showWave = savedWave === null ? DEFAULTS.showWave : savedWave === "1";
  state.tabsLayout = savedTabs;

  applyTheme(savedTheme, {
    accentOverride: state.accentOverride,
    density: state.density,
  });
  // Persist the normalized id so future reads skip the legacy alias path.
  preferenceStorage.setItem(scopedKey(STORAGE_KEYS.theme), savedTheme);
}

/** Switches the persisted preference namespace when the authenticated account changes. */
export function setPreferencesOwner(userId: string | null | undefined) {
  const nextOwner = userId || "anonymous";
  if (nextOwner === activePreferenceOwner) return;
  activePreferenceOwner = nextOwner;
  initializePreferences();
  emitChange();
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
