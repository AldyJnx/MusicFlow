import { useCallback, useRef } from "react";
import { create } from "zustand";
import { useQuery } from "@tanstack/react-query";
import { getAudioEngine, type AudioEngine } from "../../audio/engine";
import type { ReverbPreset, EQPreset } from "../api/equalizer";
import { listPresets } from "../api/equalizer";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EffectsState {
  bassBoost: number;
  virtualizer: number;
  loudness: number;
  reverbPreset: ReverbPreset;
  reverbAmount: number;
}

const DEFAULT_BANDS: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

const DEFAULT_EFFECTS: EffectsState = {
  bassBoost: 0,
  virtualizer: 0,
  loudness: 0,
  reverbPreset: "NONE",
  reverbAmount: 0,
};

// ─── Shared EQ UI state ─────────────────────────────────────────────────────
//
// A single source of truth for the equalizer's *visible* curve, shared across
// every surface (Studio page, player EQ drawer, AI flow). Previously each
// `useEqualizer()` caller kept its own React state, so adjusting the EQ in one
// place left the others rendering a flat ("equilibrado") curve even though the
// audio engine was already shaped. With a shared store, moving the EQ anywhere
// reflects everywhere — and the cascade auto-apply (useAutoApplyEQ) keeps it in
// sync when the track changes.

interface EqUiState {
  bands: number[];
  effects: EffectsState;
  /** Replace the visible bands (already length-normalised by callers). */
  setBandsState: (bands: number[]) => void;
  /** Merge a partial effects patch. */
  patchEffectsState: (patch: Partial<EffectsState>) => void;
}

export const useEqUiStore = create<EqUiState>((set) => ({
  bands: [...DEFAULT_BANDS],
  effects: { ...DEFAULT_EFFECTS },
  setBandsState: (bands) => set({ bands }),
  patchEffectsState: (patch) =>
    set((s) => ({ effects: { ...s.effects, ...patch } })),
}));

/**
 * Pushes a resolved curve into the shared UI state *without* touching the
 * audio engine. Used by `useAutoApplyEQ` after it applies the cascade so the
 * EQ surfaces mirror what's actually playing.
 */
export function syncEqUiFromConfig(cfg: {
  bands: number[];
  bassBoost: number;
  virtualizer: number;
  loudness: number;
  reverbPreset: ReverbPreset;
  reverbAmount: number;
}): void {
  const padded = Array.from({ length: 10 }, (_, i) => cfg.bands[i] ?? 0);
  useEqUiStore.getState().setBandsState(padded);
  useEqUiStore.getState().patchEffectsState({
    bassBoost: cfg.bassBoost,
    virtualizer: cfg.virtualizer,
    loudness: cfg.loudness,
    reverbPreset: cfg.reverbPreset,
    reverbAmount: cfg.reverbAmount,
  });
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useEqualizer() {
  // Lazy engine ref — only populated after the first user interaction
  const engineRef = useRef<AudioEngine | null>(null);

  const bands = useEqUiStore((s) => s.bands);
  const effects = useEqUiStore((s) => s.effects);

  // Presets from the backend
  const presetsQuery = useQuery({
    queryKey: ["eq", "presets"],
    queryFn: listPresets,
  });

  // Helper: lazily obtain the engine (only after a user gesture).
  const getEngineIfNeeded = useCallback((): AudioEngine | null => {
    if (typeof window === "undefined") return null;
    if (!engineRef.current) {
      try {
        engineRef.current = getAudioEngine();
      } catch {
        return null;
      }
    }
    return engineRef.current;
  }, []);

  // ── Band setters ──────────────────────────────────────────────────────────

  const setBand = useCallback(
    (index: number, dB: number) => {
      const next = [...useEqUiStore.getState().bands];
      next[index] = dB;
      useEqUiStore.getState().setBandsState(next);
      getEngineIfNeeded()?.equalizer.setBand(index, dB);
    },
    [getEngineIfNeeded],
  );

  const setBands = useCallback(
    (newBands: number[], transitionMs?: number) => {
      const normalised = Array.from({ length: 10 }, (_, i) => newBands[i] ?? 0);
      useEqUiStore.getState().setBandsState(normalised);
      getEngineIfNeeded()?.equalizer.setBands(normalised, transitionMs);
    },
    [getEngineIfNeeded],
  );

  // ── Effects setter ────────────────────────────────────────────────────────

  const setEffects = useCallback(
    (partial: Partial<EffectsState>) => {
      useEqUiStore.getState().patchEffectsState(partial);
      const next = useEqUiStore.getState().effects;
      getEngineIfNeeded()?.setEffects({
        bassBoost: next.bassBoost,
        virtualizer: next.virtualizer,
        loudness: next.loudness,
        reverbPreset: next.reverbPreset,
        reverbAmount: next.reverbAmount,
      });
    },
    [getEngineIfNeeded],
  );

  // ── Preset application ────────────────────────────────────────────────────

  const applyPreset = useCallback(
    (preset: EQPreset) => {
      setBands(preset.bands, 250);
      setEffects({
        bassBoost: preset.bassBoost,
        virtualizer: preset.virtualizer,
        loudness: preset.loudness,
        reverbPreset: preset.reverbPreset,
        reverbAmount: preset.reverbAmount,
      });
    },
    [setBands, setEffects],
  );

  // ── Reset ─────────────────────────────────────────────────────────────────

  const reset = useCallback(() => {
    setBands([...DEFAULT_BANDS], 250);
    setEffects({ ...DEFAULT_EFFECTS });
  }, [setBands, setEffects]);

  // ── Hydrate from engine ───────────────────────────────────────────────────

  /**
   * Pull the engine's live bands + effects into the shared state. Use this
   * when a panel opens after some other code path wrote to the engine — keeps
   * the sliders in sync with the audio.
   */
  const syncFromEngine = useCallback(() => {
    const engine = getEngineIfNeeded();
    if (!engine) return;
    const snapshot = engine.getCurrentEqState();
    const padded = Array.from({ length: 10 }, (_, i) => snapshot.bands[i] ?? 0);
    useEqUiStore.getState().setBandsState(padded);
    useEqUiStore.getState().patchEffectsState({
      bassBoost: snapshot.effects.bassBoost,
      virtualizer: snapshot.effects.virtualizer,
      loudness: snapshot.effects.loudness,
      reverbPreset: snapshot.effects.reverbPreset,
      reverbAmount: snapshot.effects.reverbAmount,
    });
  }, [getEngineIfNeeded]);

  return {
    // EQ bands
    bands,
    setBand,
    setBands,
    // Effects
    effects,
    setEffects,
    // Presets
    presets: presetsQuery.data ?? [],
    presetsLoading: presetsQuery.isPending,
    // Helpers
    applyPreset,
    reset,
    syncFromEngine,
  };
}
