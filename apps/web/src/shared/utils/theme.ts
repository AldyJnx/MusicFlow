export type AppThemeId =
  | "midnight-neon"
  | "ocean-teal"
  | "sunset-coral"
  | "aurora-light"
  | "cosmic-purple"
  | "aurora-cyan";

export type LegacyThemeId = "sonic-dark" | "neon-genesis" | "estudio";

const LEGACY_ALIASES: Record<LegacyThemeId, AppThemeId> = {
  "sonic-dark": "midnight-neon",
  "neon-genesis": "cosmic-purple",
  estudio: "aurora-light",
};

export type AppTheme = {
  id: AppThemeId;
  /** i18n key under `themes.<id>.name`. Resolved at render time. */
  nameKey: string;
  /** i18n key under `themes.<id>.description`. Resolved at render time. */
  descriptionKey: string;
  /** Whether the theme is light-on-light (affects sliders, glass tints). */
  mode: "dark" | "light";
  /** Tailwind utility describing the small preview swatch (gradient). */
  previewClassName: string;
  /** Tailwind utilities for the swatch's color dots. */
  dotsClassName: string[];
  colors: {
    page: string;
    sidebar: string;
    navbar: string;
    surface: string;
    surfaceAlt: string;
    text: string;
    muted: string;
    border: string;
    primary: string;
    secondary: string;
    ctaStart: string;
    ctaEnd: string;
    /** Accent for "wow" moments — segment chips, AI sparkle, EQ glow. */
    accent: string;
  };
};

export const APP_THEMES: AppTheme[] = [
  {
    id: "midnight-neon",
    nameKey: "themes.midnight-neon.name",
    descriptionKey: "themes.midnight-neon.description",
    mode: "dark",
    previewClassName: "bg-[linear-gradient(180deg,#0d1117_0%,#020409_100%)]",
    dotsClassName: ["bg-[#22e58a]", "bg-[#10b981]"],
    colors: {
      page: "#0b0f15",
      sidebar: "#05080d",
      navbar: "#0b0f15",
      surface: "#11161f",
      surfaceAlt: "#161d28",
      text: "#f8fafc",
      muted: "#7e8aa3",
      border: "#1d2533",
      primary: "#22e58a",
      secondary: "#0e1a18",
      ctaStart: "#22e58a",
      ctaEnd: "#10b981",
      accent: "#22e58a",
    },
  },
  {
    id: "ocean-teal",
    nameKey: "themes.ocean-teal.name",
    descriptionKey: "themes.ocean-teal.description",
    mode: "dark",
    previewClassName: "bg-[linear-gradient(180deg,#1a3a3f_0%,#0a1f25_100%)]",
    dotsClassName: ["bg-[#5eead4]", "bg-[#2dd4bf]"],
    colors: {
      page: "#0e2024",
      sidebar: "#091619",
      navbar: "#0e2024",
      surface: "#13282d",
      surfaceAlt: "#1a3037",
      text: "#e0f2f1",
      muted: "#7fa6a8",
      border: "#1f3a40",
      primary: "#5eead4",
      secondary: "#13282d",
      ctaStart: "#5eead4",
      ctaEnd: "#2dd4bf",
      accent: "#5eead4",
    },
  },
  {
    id: "sunset-coral",
    nameKey: "themes.sunset-coral.name",
    descriptionKey: "themes.sunset-coral.description",
    mode: "dark",
    previewClassName: "bg-[linear-gradient(180deg,#1a1310_0%,#0b0807_100%)]",
    dotsClassName: ["bg-[#fb923c]", "bg-[#f97316]"],
    colors: {
      page: "#100b09",
      sidebar: "#080605",
      navbar: "#100b09",
      surface: "#181210",
      surfaceAlt: "#1f1714",
      text: "#fef3ec",
      muted: "#a08679",
      border: "#2a201c",
      primary: "#fb923c",
      secondary: "#1f1714",
      ctaStart: "#fb923c",
      ctaEnd: "#f97316",
      accent: "#fb923c",
    },
  },
  {
    id: "aurora-light",
    nameKey: "themes.aurora-light.name",
    descriptionKey: "themes.aurora-light.description",
    mode: "light",
    previewClassName: "bg-[linear-gradient(180deg,#e9d8fd_0%,#dbeafe_100%)]",
    dotsClassName: ["bg-[#8b5cf6]", "bg-[#6366f1]"],
    colors: {
      page: "#f5f3ff",
      sidebar: "#ede9fe",
      navbar: "#f5f3ff",
      surface: "#ffffff",
      surfaceAlt: "#ede9fe",
      text: "#1e1b4b",
      muted: "#6b7280",
      border: "#ddd6fe",
      primary: "#8b5cf6",
      secondary: "#ede9fe",
      ctaStart: "#a78bfa",
      ctaEnd: "#7c3aed",
      accent: "#8b5cf6",
    },
  },
  {
    id: "aurora-cyan",
    nameKey: "themes.aurora-cyan.name",
    descriptionKey: "themes.aurora-cyan.description",
    mode: "dark",
    previewClassName: "bg-[linear-gradient(180deg,#0d1117_0%,#020a14_100%)]",
    dotsClassName: ["bg-[#1db9c3]", "bg-[#0e7490]"],
    colors: {
      page: "#0d1117",
      sidebar: "#070b12",
      navbar: "#0d1117",
      surface: "#121922",
      surfaceAlt: "#18222e",
      text: "#e6f6f8",
      muted: "#7a8a9a",
      border: "#1c2734",
      primary: "#1db9c3",
      secondary: "#0e2429",
      ctaStart: "#22d3ee",
      ctaEnd: "#0e7490",
      accent: "#1db9c3",
    },
  },
  {
    id: "cosmic-purple",
    nameKey: "themes.cosmic-purple.name",
    descriptionKey: "themes.cosmic-purple.description",
    mode: "dark",
    previewClassName: "bg-[linear-gradient(180deg,#1e1b4b_0%,#0f0d2c_100%)]",
    dotsClassName: ["bg-[#a78bfa]", "bg-[#ec4899]"],
    colors: {
      page: "#0f0d2c",
      sidebar: "#0a0820",
      navbar: "#0f0d2c",
      surface: "#181438",
      surfaceAlt: "#1f1a44",
      text: "#ede9fe",
      muted: "#9588c4",
      border: "#312a64",
      primary: "#a78bfa",
      secondary: "#1f1a44",
      ctaStart: "#a78bfa",
      ctaEnd: "#ec4899",
      accent: "#ec4899",
    },
  },
];

export const appThemes: Record<AppThemeId, AppTheme> = APP_THEMES.reduce(
  (acc, theme) => {
    acc[theme.id] = theme;
    return acc;
  },
  {} as Record<AppThemeId, AppTheme>,
);

export const DEFAULT_THEME: AppThemeId = "midnight-neon";

export function normalizeThemeId(value: string | null | undefined): AppThemeId {
  if (!value) return DEFAULT_THEME;
  if (value in LEGACY_ALIASES) return LEGACY_ALIASES[value as LegacyThemeId];
  if (value in appThemes) return value as AppThemeId;
  return DEFAULT_THEME;
}

export function applyTheme(themeId: AppThemeId) {
  const theme = appThemes[themeId] ?? appThemes[DEFAULT_THEME];
  const root = document.documentElement;

  root.dataset.theme = theme.id;
  root.dataset.themeMode = theme.mode;
  root.style.colorScheme = theme.mode;
  root.style.setProperty("--color-page", theme.colors.page);
  root.style.setProperty("--color-sidebar", theme.colors.sidebar);
  root.style.setProperty("--color-navbar", theme.colors.navbar);
  root.style.setProperty("--color-surface", theme.colors.surface);
  root.style.setProperty("--color-surface-alt", theme.colors.surfaceAlt);
  root.style.setProperty("--color-text", theme.colors.text);
  root.style.setProperty("--color-muted", theme.colors.muted);
  root.style.setProperty("--color-border", theme.colors.border);
  root.style.setProperty("--color-primary", theme.colors.primary);
  root.style.setProperty("--color-secondary", theme.colors.secondary);
  root.style.setProperty("--color-cta-start", theme.colors.ctaStart);
  root.style.setProperty("--color-cta-end", theme.colors.ctaEnd);
  root.style.setProperty("--color-accent", theme.colors.accent);
}
