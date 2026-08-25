import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getAudioEngine } from "../../audio/engine";
import { resolvePlayableUrl } from "../../shared/stores/downloadsStore";
import { resolveLocalUrl } from "../../shared/offline/localLibrary";
import { googleCast } from "../../shared/cast/googleCast";

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

/** off → no repeat · all → loop the queue/playlist · one → loop current track. */
export type RepeatMode = "off" | "all" | "one";

interface PlayerState {
  currentTrack: PlayerTrack | null;
  queue: PlayerTrack[];
  queueIndex: number;
  /** Random next-track order. */
  shuffle: boolean;
  /** Repeat behaviour for the queue. */
  repeatMode: RepeatMode;
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
  playbackTarget: "local" | "cast";
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
  /** Stop playback and fully reset the player (e.g. on logout). */
  stop: () => void;
  togglePlay: () => Promise<void>;
  /** Toggle random next-track order. */
  toggleShuffle: () => void;
  /** Cycle repeat: off → all → one → off. */
  cycleRepeat: () => void;
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
let castBridgeInitialized = false;
let playbackRequestId = 0;
let queueBeforeShuffle: PlayerTrack[] | null = null;

async function prepareLocalTrack(
  track: PlayerTrack,
  positionMs: number,
): Promise<void> {
  const requestId = ++playbackRequestId;
  const engine = getAudioEngine();
  let url = await resolvePlayableUrl({ id: track.id, url: track.url });
  if (requestId !== playbackRequestId) return;
  if (url === track.url && track.id.startsWith("local:")) {
    url = (await resolveLocalUrl(track.id)) ?? track.url;
  }
  if (requestId !== playbackRequestId) return;
  await engine.load(url);
  if (requestId !== playbackRequestId) return;
  engine.seek(positionMs);
  engine.pause();
}

export function initializePlayerEngine(): void {
  if (engineInitialized) return;
  engineInitialized = true;

  const engine = getAudioEngine();

  // Sync engine status → store. The engine emits on every animation frame
  // (~60fps); committing position that often re-renders every position-bound
  // component 60×/s for no visible gain. Throttle position to ~5fps, but flush
  // immediately whenever a discrete field (play/pause, volume, mute, duration)
  // changes or playback jumps (seek), so those stay instant.
  let lastCommittedPos = 0;
  engine.onStatus((status) => {
    const prev = usePlayerStore.getState();
    if (prev.playbackTarget === "cast") return;
    const discreteChanged =
      prev.isPlaying !== status.isPlaying ||
      prev.volume !== status.volume ||
      prev.muted !== status.muted ||
      prev.durationMs !== status.durationMs;
    if (
      !discreteChanged &&
      Math.abs(status.positionMs - lastCommittedPos) < 200
    )
      return;
    lastCommittedPos = status.positionMs;
    usePlayerStore.setState({
      isPlaying: status.isPlaying,
      positionMs: status.positionMs,
      durationMs: status.durationMs,
      volume: status.volume,
      muted: status.muted,
    });
  });

  // Auto-advance when the current track ends. Repeat-one replays the same
  // track; everything else falls through to next() (which itself honors
  // shuffle and repeat-all).
  engine.onEnded(() => {
    if (usePlayerStore.getState().playbackTarget === "cast") return;
    if (usePlayerStore.getState().repeatMode === "one") {
      const eng = getAudioEngine();
      eng.seek(0);
      void eng.play();
      return;
    }
    void usePlayerStore.getState().next();
  });

  if (!castBridgeInitialized) {
    castBridgeInitialized = true;
    googleCast.subscribe((cast) => {
      const state = usePlayerStore.getState();
      if (cast.connection === "connected") {
        if (state.playbackTarget !== "cast") {
          const shouldPlay = state.isPlaying;
          const positionMs = state.positionMs;
          getAudioEngine().pause();
          usePlayerStore.setState({ playbackTarget: "cast" });
          if (state.currentTrack) {
            void googleCast
              .loadTrack(state.currentTrack, positionMs, shouldPlay)
              .catch(() => {
                usePlayerStore.setState({ isPlaying: false });
              });
          }
        }
        usePlayerStore.setState({
          playbackTarget: "cast",
          isPlaying: cast.isPlaying,
          positionMs: cast.positionMs,
          durationMs: cast.durationMs || state.durationMs,
          volume: cast.volume,
          muted: cast.muted,
        });
        return;
      }

      if (state.playbackTarget === "cast") {
        const track = state.currentTrack;
        const positionMs = state.positionMs;
        usePlayerStore.setState({ playbackTarget: "local", isPlaying: false });
        if (track) {
          void prepareLocalTrack(track, positionMs).then(() => {
            usePlayerStore.setState({ positionMs, isPlaying: false });
          });
        }
      }
    });
    googleCast.onEnded(() => {
      const state = usePlayerStore.getState();
      if (state.repeatMode === "one" && state.currentTrack) {
        void googleCast.loadTrack(state.currentTrack, 0, true);
        return;
      }
      void state.next();
    });
  }
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
  const requestId = ++playbackRequestId;
  if (googleCast.getSnapshot().connection === "connected") {
    usePlayerStore.setState({
      playbackTarget: "cast",
      isPlaying: true,
      positionMs: 0,
      durationMs: track.durationMs,
    });
    try {
      await googleCast.loadTrack(track, 0, true);
    } catch {
      if (requestId === playbackRequestId) {
        usePlayerStore.setState({ isPlaying: false });
      }
    }
    return;
  }
  const engine = getAudioEngine();
  try {
    // Resolve the best source: a downloaded copy → a local file → remote stream.
    // All three play offline except the last. A newer transport action wins over
    // any slow IndexedDB or media metadata request from an older one.
    let url = await resolvePlayableUrl({ id: track.id, url: track.url });
    if (requestId !== playbackRequestId) return;
    if (url === track.url && track.id.startsWith("local:")) {
      url = (await resolveLocalUrl(track.id)) ?? track.url;
    }
    if (requestId !== playbackRequestId) return;
    await engine.load(url);
    if (requestId !== playbackRequestId) return;
    await engine.play();
  } catch {
    // A failed or superseded source must not surface as an unhandled rejection
    // from a transport button. Only the latest request may change UI state.
    if (requestId === playbackRequestId) {
      usePlayerStore.setState({ isPlaying: false });
    }
  }
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const usePlayerStore = create<PlayerState & PlayerActions>()(
  persist(
    (set, get) => ({
      // ── Initial state ──────────────────────────────────────────────────────
      currentTrack: null,
      queue: [],
      queueIndex: 0,
      shuffle: false,
      repeatMode: "off",
      currentPlaylistId: null,
      isPlaying: false,
      positionMs: 0,
      durationMs: 0,
      volume: 0.8,
      muted: false,
      playbackTarget: "local",
      isExpanded: false,
      eqDrawerOpen: false,
      aiPromptOpen: false,
      queueDrawerOpen: false,
      eqBypassed: false,

      // ── Actions ────────────────────────────────────────────────────────────

      playTrack: async (track) => {
        initializePlayerEngine();
        queueBeforeShuffle = null;
        set({
          currentTrack: track,
          queue: [track],
          queueIndex: 0,
          currentPlaylistId: null,
          positionMs: 0,
          durationMs: track.durationMs,
          isPlaying: true,
        });
        await loadAndPlay(track);
      },

      playTrackList: async (tracks, startIndex = 0, opts) => {
        if (tracks.length === 0) return;
        initializePlayerEngine();
        queueBeforeShuffle = null;
        const index = Math.max(0, Math.min(startIndex, tracks.length - 1));
        const track = tracks[index];
        set({
          currentTrack: track,
          queue: tracks,
          queueIndex: index,
          currentPlaylistId: opts?.playlistId ?? null,
          positionMs: 0,
          durationMs: track.durationMs,
          isPlaying: true,
        });
        await loadAndPlay(track);
      },

      pause: () => {
        initializePlayerEngine();
        if (get().playbackTarget === "cast") {
          googleCast.pause();
          set({ isPlaying: false });
          return;
        }
        getAudioEngine().pause();
      },

      stop: () => {
        playbackRequestId++;
        queueBeforeShuffle = null;
        // Halt the audio element and wipe player state. Only touches the
        // engine if it was ever initialized, so logout never spins up a
        // fresh AudioContext just to pause silence.
        if (engineInitialized) {
          const engine = getAudioEngine();
          engine.pause();
          engine.seek(0);
        }
        if (googleCast.getSnapshot().connection === "connected") {
          googleCast.disconnect();
        }
        set({
          currentTrack: null,
          queue: [],
          queueIndex: 0,
          currentPlaylistId: null,
          isPlaying: false,
          positionMs: 0,
          durationMs: 0,
          isExpanded: false,
          eqDrawerOpen: false,
          aiPromptOpen: false,
          queueDrawerOpen: false,
          playbackTarget: "local",
        });
      },

      togglePlay: async () => {
        initializePlayerEngine();
        const { currentTrack } = get();
        if (!currentTrack) return;
        if (get().playbackTarget === "cast") {
          googleCast.togglePlay();
          set((state) => ({ isPlaying: !state.isPlaying }));
          return;
        }
        await getAudioEngine().toggle();
      },

      next: async () => {
        initializePlayerEngine();
        const { queue, queueIndex, repeatMode } = get();
        if (queue.length === 0) return;

        // Shuffle permutes the remaining queue once while keeping the
        // selected track first. Advancing through that order avoids repeats.
        let nextIndex = queueIndex + 1;
        if (nextIndex >= queue.length) {
          if (repeatMode === "all") nextIndex = 0;
          else return; // end of queue, no repeat → stop advancing
        }

        const track = queue[nextIndex];
        set({
          currentTrack: track,
          queueIndex: nextIndex,
          positionMs: 0,
          durationMs: track.durationMs,
          isPlaying: true,
        });
        await loadAndPlay(track);
      },

      toggleShuffle: () => {
        const { queue, queueIndex, shuffle } = get();
        if (shuffle) {
          const restored = queueBeforeShuffle ?? queue;
          const currentId = get().currentTrack?.id;
          queueBeforeShuffle = null;
          set({
            shuffle: false,
            queue: restored,
            queueIndex: Math.max(
              0,
              restored.findIndex((track) => track.id === currentId),
            ),
          });
          return;
        }

        if (queue.length < 2) {
          set({ shuffle: true });
          return;
        }

        queueBeforeShuffle = [...queue];
        const current = queue[queueIndex];
        const remaining = queue.filter((_, index) => index !== queueIndex);
        for (let index = remaining.length - 1; index > 0; index--) {
          const swapIndex = Math.floor(Math.random() * (index + 1));
          [remaining[index], remaining[swapIndex]] = [
            remaining[swapIndex],
            remaining[index],
          ];
        }
        set({ shuffle: true, queue: [current, ...remaining], queueIndex: 0 });
      },

      cycleRepeat: () =>
        set((s) => ({
          repeatMode:
            s.repeatMode === "off"
              ? "all"
              : s.repeatMode === "all"
                ? "one"
                : "off",
        })),

      previous: async () => {
        initializePlayerEngine();
        const { positionMs, queue, queueIndex } = get();
        if (positionMs > 3000) {
          if (get().playbackTarget === "cast") googleCast.seek(0);
          else getAudioEngine().seek(0);
          set({ positionMs: 0 });
          return;
        }
        const prevIndex = queueIndex - 1;
        if (prevIndex < 0) return;
        const track = queue[prevIndex];
        set({
          currentTrack: track,
          queueIndex: prevIndex,
          positionMs: 0,
          durationMs: track.durationMs,
          isPlaying: true,
        });
        await loadAndPlay(track);
      },

      seek: (positionMs) => {
        initializePlayerEngine();
        if (get().playbackTarget === "cast") googleCast.seek(positionMs);
        else getAudioEngine().seek(positionMs);
        set({ positionMs });
      },

      setVolume: (v) => {
        initializePlayerEngine();
        const clamped = Math.min(1, Math.max(0, v));
        if (get().playbackTarget === "cast") googleCast.setVolume(clamped);
        else getAudioEngine().setVolume(clamped);
        set({ volume: clamped, muted: clamped === 0 });
      },

      toggleMute: () => {
        initializePlayerEngine();
        const { muted } = get();
        if (get().playbackTarget === "cast") googleCast.toggleMute();
        else getAudioEngine().setMuted(!muted);
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
        // No track guard here: the assistant works globally too (it can tune
        // the global EQ or just chat), so it must open from anywhere — e.g. the
        // floating assistant button with nothing playing.
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
        queueBeforeShuffle = null;
        set((s) => ({ queue: [...s.queue, track] }));
      },

      playNext: (track) => {
        queueBeforeShuffle = null;
        set((s) => {
          const next = [...s.queue];
          next.splice(s.queueIndex + 1, 0, track);
          return { queue: next };
        });
      },

      reorderQueue: (from, to) => {
        queueBeforeShuffle = null;
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
        queueBeforeShuffle = null;
        set((s) => {
          const next = s.queue.filter((_, i) => i !== index);
          const queueIndex =
            index < s.queueIndex ? s.queueIndex - 1 : s.queueIndex;
          return { queue: next, queueIndex: Math.max(0, queueIndex) };
        });
      },

      clearQueue: () => {
        queueBeforeShuffle = null;
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
        shuffle: state.shuffle,
        repeatMode: state.repeatMode,
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
  stop: () => usePlayerStore.getState().stop(),
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
