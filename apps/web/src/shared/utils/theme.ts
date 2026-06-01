export type AppThemeId = 'sonic-dark' | 'neon-genesis' | 'estudio'

export type AppTheme = {
  id: AppThemeId
  name: string
  description: string
  colors: {
    page: string
    sidebar: string
    navbar: string
    surface: string
    surfaceAlt: string
    text: string
    muted: string
    border: string
    primary: string
    secondary: string
    ctaStart: string
    ctaEnd: string
  }
}

export const appThemes: Record<AppThemeId, AppTheme> = {
  'sonic-dark': {
    id: 'sonic-dark',
    name: 'Sonic Dark',
    description: 'Tema actual',
    colors: {
      page: '#16161d',
      sidebar: '#090c12',
      navbar: '#15161d',
      surface: '#1c1d24',
      surfaceAlt: '#10182d',
      text: '#f8fafc',
      muted: '#7e8aa3',
      border: '#232836',
      primary: '#3b82f6',
      secondary: '#1a2230',
      ctaStart: '#5f87ff',
      ctaEnd: '#3b82f6',
    },
  },
  'neon-genesis': {
    id: 'neon-genesis',
    name: 'Neon Genesis',
    description: 'Estilo enérgico',
    colors: {
      page: '#171320',
      sidebar: '#120d1f',
      navbar: '#1b152b',
      surface: '#221a31',
      surfaceAlt: '#311b4f',
      text: '#f8fafc',
      muted: '#a78bfa',
      border: '#4c1d95',
      primary: '#c084fc',
      secondary: '#6d28d9',
      ctaStart: '#5f87ff',
      ctaEnd: '#3b82f6',
    },
  },
  estudio: {
    id: 'estudio',
    name: 'Estudio',
    description: 'Claridad técnica',
    colors: {
      page: '#ecf2f8',
      sidebar: '#dbe4f0',
      navbar: '#edf3f8',
      surface: '#f9fbfd',
      surfaceAlt: '#d5e1ef',
      text: '#142033',
      muted: '#64748b',
      border: '#c3cfdd',
      primary: '#5d83d6',
      secondary: '#dce7f4',
      ctaStart: '#5f87ff',
      ctaEnd: '#3b82f6',
    },
  },
}

export function applyTheme(themeId: AppThemeId) {
  const theme = appThemes[themeId]
  const root = document.documentElement

  root.dataset.theme = themeId
  root.style.setProperty('--color-page', theme.colors.page)
  root.style.setProperty('--color-sidebar', theme.colors.sidebar)
  root.style.setProperty('--color-navbar', theme.colors.navbar)
  root.style.setProperty('--color-surface', theme.colors.surface)
  root.style.setProperty('--color-surface-alt', theme.colors.surfaceAlt)
  root.style.setProperty('--color-text', theme.colors.text)
  root.style.setProperty('--color-muted', theme.colors.muted)
  root.style.setProperty('--color-border', theme.colors.border)
  root.style.setProperty('--color-primary', theme.colors.primary)
  root.style.setProperty('--color-secondary', theme.colors.secondary)
  root.style.setProperty('--color-cta-start', theme.colors.ctaStart)
  root.style.setProperty('--color-cta-end', theme.colors.ctaEnd)
}
