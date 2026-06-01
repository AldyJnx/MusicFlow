import {
  usePlayerStore,
  initializePlayerEngine,
} from "../../client/stores/playStore";
import type { PlayerTrack } from "../../client/stores/playStore";

// Initialize on first import (module body runs once per load, not on every render)
initializePlayerEngine();

// Re-export the zustand hook as the primary API
export { usePlayerStore };

// Re-export the track type for convenience
export type { PlayerTrack };
