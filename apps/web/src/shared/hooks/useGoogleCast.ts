import { useEffect, useSyncExternalStore } from "react";
import { googleCast } from "../cast/googleCast";

export function useGoogleCast() {
  const snapshot = useSyncExternalStore(
    googleCast.subscribe,
    googleCast.getSnapshot,
    googleCast.getSnapshot,
  );

  useEffect(() => {
    void googleCast.initialize();
  }, []);

  return snapshot;
}
