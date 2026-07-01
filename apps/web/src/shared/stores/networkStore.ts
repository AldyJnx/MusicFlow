import { create } from "zustand";

/**
 * Tracks connectivity. `online` follows the browser; `forcedOffline` is a
 * user/dev override (the settings "Modo sin conexión" toggle). When
 * `effectiveOffline` is true the app behaves like a local player — only
 * downloaded + local tracks are available and the catalog is hidden until
 * connectivity returns.
 */
interface NetworkState {
  online: boolean;
  forcedOffline: boolean;
  effectiveOffline: boolean;
  setOnline: (v: boolean) => void;
  setForcedOffline: (v: boolean) => void;
}

const initialOnline =
  typeof navigator === "undefined" ? true : navigator.onLine !== false;

function compute(online: boolean, forced: boolean): boolean {
  return forced || !online;
}

export const useNetworkStore = create<NetworkState>((set, get) => ({
  online: initialOnline,
  forcedOffline: false,
  effectiveOffline: compute(initialOnline, false),
  setOnline: (v) =>
    set({ online: v, effectiveOffline: compute(v, get().forcedOffline) }),
  setForcedOffline: (v) =>
    set({ forcedOffline: v, effectiveOffline: compute(get().online, v) }),
}));

/** Wire browser online/offline events once. Call from app bootstrap. */
export function initNetworkListeners(): () => void {
  if (typeof window === "undefined") return () => {};
  const onOnline = () => useNetworkStore.getState().setOnline(true);
  const onOffline = () => useNetworkStore.getState().setOnline(false);
  window.addEventListener("online", onOnline);
  window.addEventListener("offline", onOffline);
  return () => {
    window.removeEventListener("online", onOnline);
    window.removeEventListener("offline", onOffline);
  };
}
