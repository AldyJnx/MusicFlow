export type AppThemeId =
  | "nebula-pulse"
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
    /** Foreground color over `primary` backgrounds (e.g. PLAY button label).
     *  Dark themes use near-black, light themes use white. */
    primaryContrast: string;
    secondary: string;
    ctaStart: string;
    ctaEnd: string;
    /** Accent for "wow" moments — segment chips, AI sparkle, EQ glow. */
    accent: string;
  };
};

export const APP_THEMES: AppTheme[] = [
  {
    id: "nebula-pulse",
    nameKey: "themes.nebula-pulse.name",
    descriptionKey: "themes.nebula-pulse.description",
    mode: "dark",
    previewClassName: "bg-[linear-gradient(180deg,#0c0c18_0%,#06060e_100%)]",
    dotsClassName: ["bg-[#7c5ce8]", "bg-[#e85cc0]"],
    colors: {
      page: "#06060e",
      sidebar: "#04040c",
      navbar: "#06060e",
      surface: "#0c0c18",
      surfaceAlt: "#12121f",
      text: "#f3f4fb",
      // Lifted from the design's rgba(206,212,240,.64) to clear WCAG AA
      // (~7:1 on #06060e) per the design critique.
      muted: "#9a9fc2",
      border: "#20202e",
      primary: "#7c5ce8",
      primaryContrast: "#0a0a14",
      secondary: "#14142a",
      ctaStart: "#7c5ce8",
      ctaEnd: "#e85cc0",
      accent: "#e85cc0",
    },
  },
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
      primaryContrast: "#0b0b0b",
      secondary: "#0e1a18",
      ctaStart: "#22e58a",
      ctaEnd: "#10b981",
      // Distinct from primary so the accent tier (AI sparkle, segment chips)
      // reads as its own level in the CTA hierarchy.
      accent: "#38bdf8",
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
      primaryContrast: "#062028",
      secondary: "#13282d",
      ctaStart: "#5eead4",
      ctaEnd: "#2dd4bf",
      accent: "#f472b6",
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
      primaryContrast: "#160a04",
      secondary: "#1f1714",
      ctaStart: "#fb923c",
      ctaEnd: "#f97316",
      accent: "#f472b6",
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
      primaryContrast: "#ffffff",
      secondary: "#ede9fe",
      ctaStart: "#a78bfa",
      ctaEnd: "#7c3aed",
      accent: "#be185d",
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
      // Lifted from #7a8a9a: that sat at exactly 4.5:1 on surface-alt — no
      // headroom for AA. This clears ~5.2:1.
      muted: "#8494a4",
      border: "#1c2734",
      primary: "#1db9c3",
      primaryContrast: "#041417",
      secondary: "#0e2429",
      ctaStart: "#22d3ee",
      ctaEnd: "#0e7490",
      accent: "#a78bfa",
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
      primaryContrast: "#0d0824",
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

export const DEFAULT_THEME: AppThemeId = "nebula-pulse";

export function normalizeThemeId(value: string | null | undefined): AppThemeId {
  if (!value) return DEFAULT_THEME;
  if (value in LEGACY_ALIASES) return LEGACY_ALIASES[value as LegacyThemeId];
  if (value in appThemes) return value as AppThemeId;
  return DEFAULT_THEME;
}

export type AppDensity = "comfortable" | "compact";

export const DENSITY_SCALE: Record<AppDensity, string> = {
  comfortable: "1",
  compact: "0.85",
};

/**
 * Applies a theme to the document root. When `accentOverride` is provided
 * (a valid hex color), it replaces the theme's primary/cta/accent vars so
 * the user can pick a custom highlight color while keeping the base palette.
 * `density` scales the global `--density-scale` var used by spacing utilities.
 */
export function applyTheme(
  themeId: AppThemeId,
  options: { accentOverride?: string | null; density?: AppDensity } = {},
) {
  const theme = appThemes[themeId] ?? appThemes[DEFAULT_THEME];
  const root = document.documentElement;
  const accent = options.accentOverride?.trim() || theme.colors.primary;
  const density = options.density ?? "comfortable";

  root.dataset.theme = theme.id;
  root.dataset.themeMode = theme.mode;
  root.dataset.density = density;
  root.style.colorScheme = theme.mode;
  root.style.setProperty("--color-page", theme.colors.page);
  root.style.setProperty("--color-sidebar", theme.colors.sidebar);
  root.style.setProperty("--color-navbar", theme.colors.navbar);
  root.style.setProperty("--color-surface", theme.colors.surface);
  root.style.setProperty("--color-surface-alt", theme.colors.surfaceAlt);
  root.style.setProperty("--color-text", theme.colors.text);
  root.style.setProperty("--color-muted", theme.colors.muted);
  root.style.setProperty("--color-border", theme.colors.border);
  root.style.setProperty("--color-primary", accent);
  root.style.setProperty(
    "--color-primary-contrast",
    options.accentOverride
      ? pickContrast(accent)
      : theme.colors.primaryContrast,
  );
  root.style.setProperty("--color-secondary", theme.colors.secondary);
  root.style.setProperty(
    "--color-cta-start",
    options.accentOverride ? accent : theme.colors.ctaStart,
  );
  root.style.setProperty(
    "--color-cta-end",
    options.accentOverride ? accent : theme.colors.ctaEnd,
  );
  root.style.setProperty(
    "--color-accent",
    options.accentOverride ? accent : theme.colors.accent,
  );
  root.style.setProperty("--density-scale", DENSITY_SCALE[density]);
}

const HEX_COLOR = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function isValidHexColor(value: string | null | undefined): boolean {
  if (!value) return false;
  return HEX_COLOR.test(value.trim());
}

/**
 * Picks a near-black or near-white foreground for the given background hex
 * using the WCAG-relative-luminance threshold (0.5). Used when the user
 * overrides the accent color — we can't know which contrast their custom
 * hex needs, so we compute it.
 */
export function pickContrast(hex: string): string {
  const v = hex.trim().replace("#", "");
  const expanded =
    v.length === 3
      ? v
          .split("")
          .map((c) => c + c)
          .join("")
      : v;
  if (expanded.length !== 6) return "#0b0b0b";
  const r = parseInt(expanded.slice(0, 2), 16) / 255;
  const g = parseInt(expanded.slice(2, 4), 16) / 255;
  const b = parseInt(expanded.slice(4, 6), 16) / 255;
  // Perceived luminance (Rec. 709 weights — enough for foreground picking).
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.55 ? "#0b0b0b" : "#ffffff";
}
