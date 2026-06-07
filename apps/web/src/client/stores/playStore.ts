import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getAudioEngine } from "../../audio/engine";

// ─── Track shape ────────────────────────────────────────────────────────────

export interface PlayerTrack {
  id: string;
  title: string;
  artist: string;
  cover?: string | null;
  url: string;
  durationMs: number;
}

// ─── State + Actions interface ───────────────────────────────────────────────

interface PlayerState {
  currentTrack: PlayerTrack | null;
  queue: PlayerTrack[];
  queueIndex: number;
  isPlaying: boolean;
  positionMs: number;
  durationMs: number;
  volume: number;
  muted: boolean;
  isExpanded: boolean;
  /** Lateral EQ drawer triggered from the persistent player. */
  eqDrawerOpen: boolean;
  /** Quick-prompt AI modal triggered from the persistent player. */
  aiPromptOpen: boolean;
}

interface PlayerActions {
  playTrack: (track: PlayerTrack) => Promise<void>;
  playTrackList: (tracks: PlayerTrack[], startIndex?: number) => Promise<void>;
  pause: () => void;
  togglePlay: () => Promise<void>;
  next: () => Promise<void>;
  previous: () => Promise<void>;
  seek: (positionMs: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  setExpanded: (open: boolean) => void;
  toggleExpanded: () => void;
  openEqDrawer: () => void;
  closeEqDrawer: () => void;
  openAiPrompt: () => void;
  closeAiPrompt: () => void;
  addToQueue: (track: PlayerTrack) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
}

// ─── Lazy engine init ────────────────────────────────────────────────────────

let engineInitialized = false;

export function initializePlayerEngine(): void {
  if (engineInitialized) return;
  engineInitialized = true;

  const engine = getAudioEngine();

  // Sync engine status → store
  engine.onStatus((status) => {
    usePlayerStore.setState({
      isPlaying: status.isPlaying,
      positionMs: status.positionMs,
      durationMs: status.durationMs,
      volume: status.volume,
      muted: status.muted,
    });
  });

  // Auto-advance to next track when current ends
  engine.onEnded(() => {
    void usePlayerStore.getState().next();
  });
}

// ─── Internal helper ─────────────────────────────────────────────────────────

async function loadAndPlay(track: PlayerTrack): Promise<void> {
  initializePlayerEngine();
  const engine = getAudioEngine();
  await engine.load(track.url);
  await engine.play();
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const usePlayerStore = create<PlayerState & PlayerActions>()(
  persist(
    (set, get) => ({
      // ── Initial state ──────────────────────────────────────────────────────
      currentTrack: null,
      queue: [],
      queueIndex: 0,
      isPlaying: false,
      positionMs: 0,
      durationMs: 0,
      volume: 0.8,
      muted: false,
      isExpanded: false,
      eqDrawerOpen: false,
      aiPromptOpen: false,

      // ── Actions ────────────────────────────────────────────────────────────

      playTrack: async (track) => {
        initializePlayerEngine();
        set({ currentTrack: track, queue: [track], queueIndex: 0 });
        await loadAndPlay(track);
      },

      playTrackList: async (tracks, startIndex = 0) => {
        if (tracks.length === 0) return;
        initializePlayerEngine();
        const index = Math.max(0, Math.min(startIndex, tracks.length - 1));
        const track = tracks[index];
        set({ currentTrack: track, queue: tracks, queueIndex: index });
        await loadAndPlay(track);
      },

      pause: () => {
        initializePlayerEngine();
        getAudioEngine().pause();
      },

      togglePlay: async () => {
        initializePlayerEngine();
        const { currentTrack } = get();
        if (!currentTrack) return;
        await getAudioEngine().toggle();
      },

      next: async () => {
        initializePlayerEngine();
        const { queue, queueIndex } = get();
        const nextIndex = queueIndex + 1;
        if (nextIndex >= queue.length) return;
        const track = queue[nextIndex];
        set({ currentTrack: track, queueIndex: nextIndex });
        await loadAndPlay(track);
      },

      previous: async () => {
        initializePlayerEngine();
        const { positionMs, queue, queueIndex } = get();
        if (positionMs > 3000) {
          getAudioEngine().seek(0);
          return;
        }
        const prevIndex = queueIndex - 1;
        if (prevIndex < 0) return;
        const track = queue[prevIndex];
        set({ currentTrack: track, queueIndex: prevIndex });
        await loadAndPlay(track);
      },

      seek: (positionMs) => {
        initializePlayerEngine();
        getAudioEngine().seek(positionMs);
      },

      setVolume: (v) => {
        initializePlayerEngine();
        const clamped = Math.min(1, Math.max(0, v));
        getAudioEngine().setVolume(clamped);
        set({ volume: clamped, muted: clamped === 0 });
      },

      toggleMute: () => {
        initializePlayerEngine();
        const { muted } = get();
        getAudioEngine().setMuted(!muted);
        set({ muted: !muted });
      },

      setExpanded: (open) => {
        set({ isExpanded: open });
      },

      toggleExpanded: () => {
        const { currentTrack, isExpanded } = get();
        if (!currentTrack) return;
        set({ isExpanded: !isExpanded });
      },

      // Overlays: opening one auto-closes the other so the user always sees a
      // single contextual surface on top of the expanded player.
      openEqDrawer: () => {
        if (!get().currentTrack) return;
        set({ eqDrawerOpen: true, aiPromptOpen: false });
      },
      closeEqDrawer: () => set({ eqDrawerOpen: false }),
      openAiPrompt: () => {
        if (!get().currentTrack) return;
        set({ aiPromptOpen: true, eqDrawerOpen: false });
      },
      closeAiPrompt: () => set({ aiPromptOpen: false }),

      addToQueue: (track) => {
        set((s) => ({ queue: [...s.queue, track] }));
      },

      removeFromQueue: (index) => {
        set((s) => {
          const next = s.queue.filter((_, i) => i !== index);
          const queueIndex =
            index < s.queueIndex ? s.queueIndex - 1 : s.queueIndex;
          return { queue: next, queueIndex: Math.max(0, queueIndex) };
        });
      },

      clearQueue: () => {
        set({ queue: [], queueIndex: 0 });
      },
    }),
    {
      name: "musicflow-player",
      // Persist only what makes sense across reloads
      partialize: (state) => ({
        currentTrack: state.currentTrack,
        queue: state.queue,
        queueIndex: state.queueIndex,
        volume: state.volume,
        muted: state.muted,
      }),
    },
  ),
);

// ─── Non-hook consumer helper ─────────────────────────────────────────────────

export const playerStore = {
  getState: () => usePlayerStore.getState(),
  playTrack: (track: PlayerTrack) => usePlayerStore.getState().playTrack(track),
  playTrackList: (tracks: PlayerTrack[], startIndex?: number) =>
    usePlayerStore.getState().playTrackList(tracks, startIndex),
  pause: () => usePlayerStore.getState().pause(),
  togglePlay: () => usePlayerStore.getState().togglePlay(),
  next: () => usePlayerStore.getState().next(),
  previous: () => usePlayerStore.getState().previous(),
  seek: (positionMs: number) => usePlayerStore.getState().seek(positionMs),
  setVolume: (v: number) => usePlayerStore.getState().setVolume(v),
  toggleMute: () => usePlayerStore.getState().toggleMute(),
  setExpanded: (open: boolean) => usePlayerStore.getState().setExpanded(open),
  toggleExpanded: () => usePlayerStore.getState().toggleExpanded(),
  addToQueue: (track: PlayerTrack) =>
    usePlayerStore.getState().addToQueue(track),
  removeFromQueue: (index: number) =>
    usePlayerStore.getState().removeFromQueue(index),
  clearQueue: () => usePlayerStore.getState().clearQueue(),
};
