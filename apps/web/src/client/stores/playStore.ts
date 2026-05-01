import { useSyncExternalStore } from 'react'

export type PlayerTrack = {
  id: number
  title: string
  artist: string
  cover: string
  duration: string
}

type PlayerState = {
  currentTrack: PlayerTrack | null
  isOpen: boolean
  isPlaying: boolean
  volume: number
  progress: number
  currentTime: string
}

type PlayerActions = {
  setTrack: (track: PlayerTrack) => void
  clearTrack: () => void
  play: () => void
  pause: () => void
  togglePlay: () => void
  setVolume: (volume: number) => void
  setProgress: (progress: number) => void
  setCurrentTime: (currentTime: string) => void
}

export type PlayerStore = PlayerState & PlayerActions

const listeners = new Set<() => void>()

const playerStoreState: PlayerState = {
  currentTrack: null,
  isOpen: false,
  isPlaying: false,
  volume: 68,
  progress: 0,
  currentTime: '0:00',
}

function emitChange() {
  listeners.forEach((listener) => listener())
}

function updateState(partial: Partial<PlayerState>) {
  Object.assign(playerStoreState, partial)
  emitChange()
}

const actions: PlayerActions = {
  setTrack(track) {
    updateState({
      currentTrack: track,
      isOpen: true,
      isPlaying: true,
      progress: 0,
      currentTime: '0:00',
    })
  },

  clearTrack() {
    updateState({
      currentTrack: null,
      isOpen: false,
      isPlaying: false,
      progress: 0,
      currentTime: '0:00',
    })
  },

  play() {
    updateState({ isPlaying: true })
  },

  pause() {
    updateState({ isPlaying: false })
  },

  togglePlay() {
    updateState({ isPlaying: !playerStoreState.isPlaying })
  },

  setVolume(volume) {
    const nextVolume = Math.max(0, Math.min(100, volume))
    updateState({ volume: nextVolume })
  },

  setProgress(progress) {
    const nextProgress = Math.max(0, Math.min(100, progress))
    updateState({ progress: nextProgress })
  },

  setCurrentTime(currentTime) {
    updateState({ currentTime })
  },
}

function subscribe(listener: () => void) {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}

function getStore(): PlayerStore {
  return {
    ...playerStoreState,
    ...actions,
  }
}

export function usePlayerStore<T>(selector: (store: PlayerStore) => T) {
  return useSyncExternalStore(
    subscribe,
    () => selector(getStore()),
    () => selector(getStore()),
  )
}

export const playerStore = {
  getState: getStore,
  ...actions,
}
