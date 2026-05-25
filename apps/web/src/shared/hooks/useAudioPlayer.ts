import {
  usePlayerStore,
  initializePlayerEngine,
} from "../../client/stores/playStore";
import type { PlayerTrack } from "../../client/stores/playStore";

// Initialize on first import (module-level, not on every render)
let initialized = false;
if (!initialized) {
  initialized = true;
  initializePlayerEngine();
}

// Re-export the zustand hook as the primary API
export { usePlayerStore };

// Re-export the track type for convenience
export type { PlayerTrack };
