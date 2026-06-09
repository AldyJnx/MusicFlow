import { useEffect, useRef } from "react";
import { usePlayerStore } from "../../client/stores/playStore";
import { getAudioEngine } from "../../audio/engine";
import { resolveConfig, type EQConfig } from "../api/equalizer";

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
    const seq = ++lastSeqRef.current;

    let cancelled = false;
    void (async () => {
      let cfg: EQConfig | null = null;
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

      if (cfg) {
        engine.equalizer.setBands(cfg.bands, 250);
        engine.setEffects({
          bassBoost: cfg.bassBoost,
          virtualizer: cfg.virtualizer,
          loudness: cfg.loudness,
          reverbPreset: cfg.reverbPreset,
          reverbAmount: cfg.reverbAmount,
        });
      } else {
        // No config for this scope — flat bands.
        engine.equalizer.setBands(Array(10).fill(0), 250);
        engine.setEffects({
          bassBoost: 0,
          virtualizer: 0,
          loudness: 0,
          reverbPreset: "NONE",
          reverbAmount: 0,
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentTrackId, currentPlaylistId]);
}
