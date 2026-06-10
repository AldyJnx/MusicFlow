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
  /**
   * The playlist that owns the current queue, if playback started from one.
   * Used by `useAutoApplyEQ` to resolve the EQ cascade with the playlist as
   * a scope. `null` when playing from the catalog / "My Library" / single
   * track click — those fall back to Track → Global.
   */
  currentPlaylistId: string | null;
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
  /** Lateral queue drawer showing what's playing next. */
  queueDrawerOpen: boolean;
  /**
   * EQ bypass — when true the engine is forced to flat (all bands at 0)
   * but the previous curve is held in memory so the user can toggle it
   * back on without losing their work.
   */
  eqBypassed: boolean;
}

interface PlayerActions {
  playTrack: (track: PlayerTrack) => Promise<void>;
  playTrackList: (
    tracks: PlayerTrack[],
    startIndex?: number,
    opts?: { playlistId?: string | null },
  ) => Promise<void>;
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
  openQueueDrawer: () => void;
  closeQueueDrawer: () => void;
  toggleEqBypass: () => void;
  /** Insert a track right after the currently playing one. */
  playNext: (track: PlayerTrack) => void;
  reorderQueue: (from: number, to: number) => void;
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

/**
 * Module-scoped stash for the EQ bypass flow. Holding it outside Zustand
 * keeps non-serializable details (engine snapshot shape) away from persist().
 * Cleared every time bypass is turned back off.
 */
let bypassStash: ReturnType<
  ReturnType<typeof getAudioEngine>["getCurrentEqState"]
> | null = null;

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
      currentPlaylistId: null,
      isPlaying: false,
      positionMs: 0,
      durationMs: 0,
      volume: 0.8,
      muted: false,
      isExpanded: false,
      eqDrawerOpen: false,
      aiPromptOpen: false,
      queueDrawerOpen: false,
      eqBypassed: false,

      // ── Actions ────────────────────────────────────────────────────────────

      playTrack: async (track) => {
        initializePlayerEngine();
        set({
          currentTrack: track,
          queue: [track],
          queueIndex: 0,
          currentPlaylistId: null,
        });
        await loadAndPlay(track);
      },

      playTrackList: async (tracks, startIndex = 0, opts) => {
        if (tracks.length === 0) return;
        initializePlayerEngine();
        const index = Math.max(0, Math.min(startIndex, tracks.length - 1));
        const track = tracks[index];
        set({
          currentTrack: track,
          queue: tracks,
          queueIndex: index,
          currentPlaylistId: opts?.playlistId ?? null,
        });
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
      openQueueDrawer: () => {
        if (!get().currentTrack) return;
        set({ queueDrawerOpen: true });
      },
      closeQueueDrawer: () => set({ queueDrawerOpen: false }),

      // EQ bypass — when turning OFF we snapshot the live curve so we can
      // restore it on the next toggle; turning ON we just flatten the engine.
      toggleEqBypass: () => {
        const engine = getAudioEngine();
        const wasBypassed = get().eqBypassed;
        if (wasBypassed) {
          // Re-enable EQ: replay the stashed bands and effects.
          const stash = bypassStash;
          if (stash) {
            engine.equalizer.setBands(stash.bands, 200);
            engine.setEffects(stash.effects);
          }
          bypassStash = null;
          set({ eqBypassed: false });
        } else {
          // Disable EQ: stash and flatten.
          bypassStash = engine.getCurrentEqState();
          engine.equalizer.setBands(new Array(10).fill(0), 200);
          engine.setEffects({
            bassBoost: 0,
            virtualizer: 0,
            loudness: 0,
            reverbPreset: "NONE",
            reverbAmount: 0,
          });
          set({ eqBypassed: true });
        }
      },

      addToQueue: (track) => {
        set((s) => ({ queue: [...s.queue, track] }));
      },

      playNext: (track) => {
        set((s) => {
          const next = [...s.queue];
          next.splice(s.queueIndex + 1, 0, track);
          return { queue: next };
        });
      },

      reorderQueue: (from, to) => {
        set((s) => {
          if (from === to) return s;
          const next = [...s.queue];
          const [moved] = next.splice(from, 1);
          next.splice(to, 0, moved);
          // Keep queueIndex pointing at the same logical track.
          let queueIndex = s.queueIndex;
          if (from === s.queueIndex) queueIndex = to;
          else if (from < s.queueIndex && to >= s.queueIndex) queueIndex--;
          else if (from > s.queueIndex && to <= s.queueIndex) queueIndex++;
          return { queue: next, queueIndex };
        });
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
        currentPlaylistId: state.currentPlaylistId,
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
  playTrackList: (
    tracks: PlayerTrack[],
    startIndex?: number,
    opts?: { playlistId?: string | null },
  ) => usePlayerStore.getState().playTrackList(tracks, startIndex, opts),
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
