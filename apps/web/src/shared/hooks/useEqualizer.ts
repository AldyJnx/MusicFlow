import { useCallback, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { AudioEngine } from "../../audio/engine";
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

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useEqualizer() {
  // Lazy engine ref — only populated after the first user interaction
  const engineRef = useRef<AudioEngine | null>(null);

  const [bands, setBandsState] = useState<number[]>([...DEFAULT_BANDS]);
  const [effects, setEffectsState] = useState<EffectsState>({
    ...DEFAULT_EFFECTS,
  });

  // Presets from the backend
  const presetsQuery = useQuery({
    queryKey: ["eq", "presets"],
    queryFn: listPresets,
  });

  // Helper: lazily obtain the engine (only after a user gesture)
  const getEngineIfNeeded = useCallback((): AudioEngine | null => {
    if (typeof window === "undefined") return null;
    if (!engineRef.current) {
      // Dynamic import to avoid AudioContext construction at module load
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { getAudioEngine } =
          require("../../audio/engine") as typeof import("../../audio/engine");
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
      setBandsState((prev) => {
        const next = [...prev];
        next[index] = dB;
        return next;
      });
      const engine = getEngineIfNeeded();
      engine?.equalizer.setBand(index, dB);
    },
    [getEngineIfNeeded],
  );

  const setBands = useCallback(
    (newBands: number[], transitionMs?: number) => {
      // Ensure length 10, fill gaps with 0
      const normalised = Array.from({ length: 10 }, (_, i) => newBands[i] ?? 0);
      setBandsState(normalised);
      const engine = getEngineIfNeeded();
      engine?.equalizer.setBands(normalised, transitionMs);
    },
    [getEngineIfNeeded],
  );

  // ── Effects setter ────────────────────────────────────────────────────────

  const setEffects = useCallback(
    (partial: Partial<EffectsState>) => {
      setEffectsState((prev) => {
        const next = { ...prev, ...partial };
        const engine = getEngineIfNeeded();
        engine?.setEffects({
          bassBoost: next.bassBoost,
          virtualizer: next.virtualizer,
          loudness: next.loudness,
          reverbPreset: next.reverbPreset,
          reverbAmount: next.reverbAmount,
        });
        return next;
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
  };
}
