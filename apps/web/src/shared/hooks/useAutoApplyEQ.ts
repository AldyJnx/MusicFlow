import { useEffect, useRef } from "react";
import { usePlayerStore } from "../../client/stores/playStore";
import { getAudioEngine } from "../../audio/engine";
import { resolveConfig, type EQConfig } from "../api/equalizer";
import { syncEqUiFromConfig } from "./useEqualizer";

const FLAT_CONFIG = {
  bands: Array(10).fill(0) as number[],
  bassBoost: 0,
  virtualizer: 0,
  loudness: 0,
  reverbPreset: "NONE" as const,
  reverbAmount: 0,
};

// Module-level (survives ClientLayout remounts on navigation) — the last
// context we actually resolved + applied. Without this, navigating between
// pages remounts ClientLayout, re-runs this effect and resets the engine/UI to
// the saved config (or flat), wiping the user's in-progress manual EQ edits.
let appliedKey: string | null = null;
let seqCounter = 0;

/** Call after a manual edit so the cascade re-applies on the next *real*
 *  track change (and never silently overrides what the user just set). */
export function markEqContextDirty(): void {
  appliedKey = null;
}

/**
 * Watches the current track / playlist context and pushes the resolved EQ
 * config down to the audio engine. The cascade lives in the backend
 * (Segment → Track → Playlist → Global); the client just calls
 * `GET /equalizer/configs/resolve/:trackId?playlistId=` and applies the result.
 *
 * Mount once near the root (e.g. inside ClientLayout). It's effect-only and
 * doesn't render anything.
 */
export function useAutoApplyEQ(): void {
  const currentTrackId = usePlayerStore((s) => s.currentTrack?.id);
  const currentPlaylistId = usePlayerStore((s) => s.currentPlaylistId);
  // Avoid clobbering an in-flight resolution if the user skips tracks fast.
  const lastSeqRef = useRef(0);

  useEffect(() => {
    if (!currentTrackId) return;
    const key = `${currentTrackId}:${currentPlaylistId ?? ""}`;
    // Same context as last time (e.g. just a page navigation) — don't re-apply
    // and clobber manual edits. Only a genuine track/playlist change proceeds.
    if (key === appliedKey) return;
    const seq = (lastSeqRef.current = ++seqCounter);

    let cancelled = false;
    void (async () => {
      let cfg: EQConfig | null;
      try {
        cfg = await resolveConfig(
          currentTrackId,
          currentPlaylistId ?? undefined,
        );
      } catch {
        // Network error — leave the engine as-is. Errors here should not
        // interrupt playback or surface a global toast.
        return;
      }
      if (cancelled || seq !== lastSeqRef.current) return;
      const engine = (() => {
        try {
          return getAudioEngine();
        } catch {
          return null;
        }
      })();
      if (!engine) return;

      // Mark this context as applied so navigation remounts don't re-run it.
      appliedKey = key;

      if (cfg) {
        engine.equalizer.setBands(cfg.bands, 250);
        engine.setEffects({
          bassBoost: cfg.bassBoost,
          virtualizer: cfg.virtualizer,
          loudness: cfg.loudness,
          reverbPreset: cfg.reverbPreset,
          reverbAmount: cfg.reverbAmount,
        });
        // Mirror into the shared EQ UI so every surface shows this curve.
        syncEqUiFromConfig(cfg);
      } else {
        // No config for this scope — flat bands.
        engine.equalizer.setBands(FLAT_CONFIG.bands, 250);
        engine.setEffects({
          bassBoost: 0,
          virtualizer: 0,
          loudness: 0,
          reverbPreset: "NONE",
          reverbAmount: 0,
        });
        syncEqUiFromConfig(FLAT_CONFIG);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentTrackId, currentPlaylistId]);
}
