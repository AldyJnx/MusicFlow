import { create } from 'zustand'

interface Track {
  id: string
  title: string
  artist: string
  album: string
  duration_ms: number
  cover_art?: string
  file_url?: string
}

interface PlayerState {
  currentTrack: Track | null
  queue: Track[]
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
  repeatMode: 'off' | 'one' | 'all'
  isShuffled: boolean

  // Actions
  setTrack: (track: Track) => void
  play: () => void
  pause: () => void
  togglePlay: () => void
  setQueue: (tracks: Track[]) => void
  addToQueue: (track: Track) => void
  removeFromQueue: (trackId: string) => void
  next: () => void
  previous: () => void
  seek: (time: number) => void
  setVolume: (volume: number) => void
  toggleMute: () => void
  toggleRepeat: () => void
  toggleShuffle: () => void
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  queue: [],
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  isMuted: false,
  repeatMode: 'off',
  isShuffled: false,

  setTrack: (track) => set({ currentTrack: track, currentTime: 0 }),
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setQueue: (tracks) => set({ queue: tracks }),
  addToQueue: (track) => set((state) => ({ queue: [...state.queue, track] })),
  removeFromQueue: (trackId) =>
    set((state) => ({
      queue: state.queue.filter((t) => t.id !== trackId),
    })),
  next: () => {
    const { queue, currentTrack, repeatMode, isShuffled } = get()
    if (queue.length === 0) return

    const currentIndex = queue.findIndex((t) => t.id === currentTrack?.id)

    if (isShuffled) {
      const randomIndex = Math.floor(Math.random() * queue.length)
      set({ currentTrack: queue[randomIndex], currentTime: 0 })
    } else if (currentIndex < queue.length - 1) {
      set({ currentTrack: queue[currentIndex + 1], currentTime: 0 })
    } else if (repeatMode === 'all') {
      set({ currentTrack: queue[0], currentTime: 0 })
    }
  },
  previous: () => {
    const { queue, currentTrack, currentTime } = get()
    if (currentTime > 3) {
      set({ currentTime: 0 })
      return
    }

    const currentIndex = queue.findIndex((t) => t.id === currentTrack?.id)
    if (currentIndex > 0) {
      set({ currentTrack: queue[currentIndex - 1], currentTime: 0 })
    }
  },
  seek: (time) => set({ currentTime: time }),
  setVolume: (volume) => set({ volume, isMuted: volume === 0 }),
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  toggleRepeat: () =>
    set((state) => ({
      repeatMode:
        state.repeatMode === 'off'
          ? 'all'
          : state.repeatMode === 'all'
          ? 'one'
          : 'off',
    })),
  toggleShuffle: () => set((state) => ({ isShuffled: !state.isShuffled })),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
}))
