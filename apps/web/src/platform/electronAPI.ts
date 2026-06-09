// Shape of the bridge exposed by apps/web/electron/preload.cjs. Optional —
// when the renderer is loaded in a regular browser, `window.electronAPI` is
// undefined and every helper here returns null.

export interface ScannedFile {
  absolutePath: string;
  name: string;
  relPath: string;
  sizeBytes: number;
}

export interface ScanResult {
  folder: string;
  files: ScannedFile[];
}

interface ElectronBridge {
  platform: "desktop";
  scanMusicFolder(): Promise<ScanResult | null>;
  readMusicFile(absolutePath: string): Promise<ArrayBuffer | Uint8Array>;
}

declare global {
  interface Window {
    electronAPI?: ElectronBridge;
  }
}

export function isElectron(): boolean {
  return typeof window !== "undefined" && Boolean(window.electronAPI);
}

export function getElectronAPI(): ElectronBridge | null {
  if (!isElectron()) return null;
  return window.electronAPI ?? null;
}

const AUDIO_MIME: Record<string, string> = {
  mp3: "audio/mpeg",
  flac: "audio/flac",
  wav: "audio/wav",
  m4a: "audio/mp4",
  ogg: "audio/ogg",
  aac: "audio/aac",
  opus: "audio/opus",
};

/**
 * Materialize a scanned native file into a regular `File` so it can flow
 * through the same upload pipeline as drag-and-drop in the browser.
 */
export async function toFile(scanned: ScannedFile): Promise<File> {
  const api = getElectronAPI();
  if (!api) throw new Error("Electron bridge not available");
  const raw = await api.readMusicFile(scanned.absolutePath);
  // Normalize to a fresh, plain ArrayBuffer so File's BlobPart typing accepts
  // it regardless of whether the bridge returned a Buffer/Uint8Array or an
  // ArrayBuffer-like (SharedArrayBuffer-tagged) value.
  const u8 =
    raw instanceof Uint8Array ? raw : new Uint8Array(raw as ArrayBufferLike);
  const ab = new ArrayBuffer(u8.byteLength);
  new Uint8Array(ab).set(u8);
  const ext = scanned.name.split(".").pop()?.toLowerCase() ?? "";
  const mime = AUDIO_MIME[ext] ?? "application/octet-stream";
  return new File([ab], scanned.name, { type: mime });
}
