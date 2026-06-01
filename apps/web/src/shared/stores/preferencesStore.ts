import { useSyncExternalStore } from 'react'
import { applyTheme, type AppThemeId } from '../utils/theme'

type PreferencesState = {
  theme: AppThemeId
}

type PreferencesActions = {
  setTheme: (theme: AppThemeId) => void
}

export type PreferencesStore = PreferencesState & PreferencesActions

const listeners = new Set<() => void>()

const state: PreferencesState = {
  theme: 'sonic-dark',
}

function emitChange() {
  listeners.forEach((listener) => listener())
}

function updateState(partial: Partial<PreferencesState>) {
  Object.assign(state, partial)
  emitChange()
}

const actions: PreferencesActions = {
  setTheme(theme) {
    updateState({ theme })
    applyTheme(theme)
    localStorage.setItem('musicflow-theme', theme)
  },
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getStore(): PreferencesStore {
  return {
    ...state,
    ...actions,
  }
}

export function initializePreferences() {
  const savedTheme = localStorage.getItem('musicflow-theme') as AppThemeId | null
  const theme = savedTheme ?? 'sonic-dark'

  state.theme = theme
  applyTheme(theme)
}

export function usePreferencesStore<T>(selector: (store: PreferencesStore) => T) {
  return useSyncExternalStore(
    subscribe,
    () => selector(getStore()),
    () => selector(getStore()),
  )
}
