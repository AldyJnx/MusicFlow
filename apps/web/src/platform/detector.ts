type ElectronAPI = unknown;

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export const platform = {
  isElectron:
    typeof window !== "undefined" && Boolean((window as Window).electronAPI),
  isWeb: typeof window !== "undefined" && !(window as Window).electronAPI,
  isPWAInstalled:
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(display-mode: standalone)").matches,
  supportsFileSystemAccess:
    typeof window !== "undefined" && "showOpenFilePicker" in window,
};

export type Platform = typeof platform;
