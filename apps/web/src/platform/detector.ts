// `window.electronAPI` is declared in ./electronAPI.ts. Importing keeps both
// files in agreement on the bridge's shape — TS would otherwise complain
// about a duplicate global declaration with conflicting types.
import "./electronAPI";

export const platform = {
  isElectron: typeof window !== "undefined" && Boolean(window.electronAPI),
  isWeb: typeof window !== "undefined" && !window.electronAPI,
  isPWAInstalled:
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(display-mode: standalone)").matches,
  supportsFileSystemAccess:
    typeof window !== "undefined" && "showOpenFilePicker" in window,
};

export type Platform = typeof platform;
