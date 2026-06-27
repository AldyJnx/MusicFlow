import { create } from "zustand";
import { parseBlob } from "music-metadata";
import {
  getElectronAPI,
  isElectron,
  toFile,
  type ScannedFile,
} from "../../platform/electronAPI";

/**
 * Local music library (offline "normal player" mode).
 *
 * Web: uses the File System Access API — the user picks a folder once, we scan
 * its audio files and keep the *directory handle* in IndexedDB so the app
 * "recognises" the same folder on the next launch (re-reading files fresh, with
 * no copy/upload). Playback streams straight from the local file.
 *
 * Desktop (Electron): a native fs scan can replace `pickFolder` for a true
 * auto-detected library — see `window.electron` (not required here).
 */

const DB = "musicflow-local";
const KV = "kv"; // holds the root directory handle
const TRACKS = "tracks"; // local track metadata, keyed by id

export interface LocalTrack {
  id: string; // stable hash of the relative path
  title: string;
  artist: string;
  album: string;
  path: string; // relative path segments joined by "/" (web handle walk)
  /** Absolute filesystem path — Electron only; used to read the file via IPC. */
  absolutePath?: string;
  durationMs: number; // from the file's tags (0 if unknown)
  cover: Blob | null; // embedded artwork, if any
}

async function metaFromFile(
  file: File,
  fallbackName: string,
): Promise<{
  title: string;
  artist: string;
  album: string;
  durationMs: number;
  cover: Blob | null;
}> {
  const fallback = parseName(fallbackName);
  let title = fallback.title;
  let artist = fallback.artist;
  let album = "";
  let durationMs = 0;
  let cover: Blob | null = null;
  try {
    const md = await parseBlob(file, { duration: true });
    if (md.common.title) title = md.common.title;
    if (md.common.artist) artist = md.common.artist;
    album = md.common.album ?? "";
    durationMs = Math.round((md.format.duration ?? 0) * 1000);
    const pic = md.common.picture?.[0];
    if (pic) cover = new Blob([pic.data as BlobPart], { type: pic.format });
  } catch {
    /* unreadable tags — keep filename fallback */
  }
  return { title, artist, album, durationMs, cover };
}

const AUDIO_RE = /\.(mp3|wav|flac|ogg|opus|m4a|aac)$/i;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(KV)) db.createObjectStore(KV);
      if (!db.objectStoreNames.contains(TRACKS))
        db.createObjectStore(TRACKS, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function kvGet<T>(key: string): Promise<T | undefined> {
  return openDb().then(
    (db) =>
      new Promise<T | undefined>((resolve, reject) => {
        const r = db.transaction(KV, "readonly").objectStore(KV).get(key);
        r.onsuccess = () => resolve(r.result as T | undefined);
        r.onerror = () => reject(r.error);
      }),
  );
}
function kvPut(key: string, val: unknown): Promise<void> {
  return openDb().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const t = db.transaction(KV, "readwrite");
        t.objectStore(KV).put(val, key);
        t.oncomplete = () => resolve();
        t.onerror = () => reject(t.error);
      }),
  );
}
function tracksPutAll(items: LocalTrack[]): Promise<void> {
  return openDb().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const t = db.transaction(TRACKS, "readwrite");
        const s = t.objectStore(TRACKS);
        s.clear();
        items.forEach((it) => s.put(it));
        t.oncomplete = () => resolve();
        t.onerror = () => reject(t.error);
      }),
  );
}
function tracksGetAll(): Promise<LocalTrack[]> {
  return openDb().then(
    (db) =>
      new Promise<LocalTrack[]>((resolve, reject) => {
        const r = db
          .transaction(TRACKS, "readonly")
          .objectStore(TRACKS)
          .getAll();
        r.onsuccess = () => resolve(r.result as LocalTrack[]);
        r.onerror = () => reject(r.error);
      }),
  );
}

async function hashPath(path: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-1",
    new TextEncoder().encode(path),
  );
  return (
    "local:" +
    Array.from(new Uint8Array(buf).slice(0, 8))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
  );
}

/** Parse "Artist - Title.ext" → metadata (best effort). */
function parseName(name: string): { artist: string; title: string } {
  const noExt = name.replace(AUDIO_RE, "");
  const i = noExt.indexOf(" - ");
  if (i > 0)
    return {
      artist: noExt.slice(0, i).trim(),
      title: noExt.slice(i + 3).trim(),
    };
  return { artist: "Desconocido", title: noExt.trim() };
}

// FS Access API typings are loose across TS lib versions — use a narrow shim.
type DirHandle = {
  kind: "directory";
  name: string;
  values: () => AsyncIterable<DirHandle | FileHandle>;
  queryPermission?: (o: { mode: string }) => Promise<PermissionState>;
  requestPermission?: (o: { mode: string }) => Promise<PermissionState>;
};
type FileHandle = {
  kind: "file";
  name: string;
  getFile: () => Promise<File>;
};

export function isSupported(): boolean {
  if (isElectron()) return true;
  return (
    typeof (window as unknown as { showDirectoryPicker?: unknown })
      .showDirectoryPicker === "function"
  );
}

async function scanDir(
  dir: DirHandle,
  prefix: string,
  depth: number,
  out: { path: string; handle: FileHandle }[],
): Promise<void> {
  if (depth > 4) return;
  for await (const entry of dir.values()) {
    if (entry.kind === "file" && AUDIO_RE.test(entry.name)) {
      out.push({ path: `${prefix}${entry.name}`, handle: entry });
    } else if (entry.kind === "directory") {
      await scanDir(entry, `${prefix}${entry.name}/`, depth + 1, out);
    }
  }
}

interface LocalLibState {
  ready: boolean;
  scanning: boolean;
  folderName: string | null;
  items: Record<string, LocalTrack>;
  init: () => Promise<void>;
  pickFolder: () => Promise<void>;
  rescan: () => Promise<void>;
  clear: () => Promise<void>;
}

let rootHandle: DirHandle | null = null;
const fileCache = new Map<string, string>(); // id → object URL

export const useLocalLibraryStore = create<LocalLibState>((set, get) => ({
  ready: false,
  scanning: false,
  folderName: null,
  items: {},

  init: async () => {
    try {
      const handle = await kvGet<DirHandle>("rootHandle");
      const savedName = await kvGet<string>("folderName");
      const metas = await tracksGetAll();
      const items: Record<string, LocalTrack> = {};
      for (const m of metas) items[m.id] = m;
      rootHandle = handle ?? null;
      // Electron tracks persist by absolutePath, so they're playable on relaunch
      // without re-picking; web tracks need the directory handle.
      set({
        items,
        folderName: handle?.name ?? savedName ?? null,
        ready: true,
      });
    } catch {
      set({ ready: true });
    }
  },

  pickFolder: async () => {
    // Desktop (Electron): native folder dialog + fs scan — no permission dance,
    // recognises the whole folder tree.
    if (isElectron()) {
      const api = getElectronAPI();
      if (!api) return;
      set({ scanning: true });
      try {
        const result = await api.scanMusicFolder();
        if (!result) {
          set({ scanning: false });
          return;
        }
        const tracks: LocalTrack[] = [];
        for (const sf of result.files as ScannedFile[]) {
          const id = await hashPath(sf.relPath || sf.absolutePath);
          const file = await toFile(sf);
          const meta = await metaFromFile(file, sf.name);
          tracks.push({
            id,
            path: sf.relPath || sf.name,
            absolutePath: sf.absolutePath,
            ...meta,
          });
        }
        await tracksPutAll(tracks);
        const items: Record<string, LocalTrack> = {};
        for (const m of tracks) items[m.id] = m;
        await kvPut("folderName", result.folder);
        set({ items, folderName: result.folder, scanning: false });
      } catch {
        set({ scanning: false });
      }
      return;
    }

    // Web: File System Access API.
    const picker = (
      window as unknown as {
        showDirectoryPicker: (o?: unknown) => Promise<DirHandle>;
      }
    ).showDirectoryPicker;
    if (!picker) return;
    const handle = await picker({ mode: "read" });
    rootHandle = handle;
    await kvPut("rootHandle", handle);
    set({ folderName: handle.name });
    await get().rescan();
  },

  rescan: async () => {
    if (!rootHandle) return;
    set({ scanning: true });
    try {
      if (rootHandle.queryPermission) {
        let perm = await rootHandle.queryPermission({ mode: "read" });
        if (perm !== "granted" && rootHandle.requestPermission) {
          perm = await rootHandle.requestPermission({ mode: "read" });
        }
        if (perm !== "granted") {
          set({ scanning: false });
          return;
        }
      }
      const found: { path: string; handle: FileHandle }[] = [];
      await scanDir(rootHandle, "", 0, found);
      const tracks: LocalTrack[] = [];
      for (const f of found) {
        const id = await hashPath(f.path);
        const file = await f.handle.getFile();
        const meta = await metaFromFile(file, f.handle.name);
        tracks.push({ id, path: f.path, ...meta });
      }
      await tracksPutAll(tracks);
      const items: Record<string, LocalTrack> = {};
      for (const m of tracks) items[m.id] = m;
      set({ items, scanning: false });
    } catch {
      set({ scanning: false });
    }
  },

  clear: async () => {
    rootHandle = null;
    await kvPut("rootHandle", undefined);
    await tracksPutAll([]);
    fileCache.forEach((u) => URL.revokeObjectURL(u));
    fileCache.clear();
    set({ items: {}, folderName: null });
  },
}));

const coverCache = new Map<string, string>();

/** Local object URL for a local track's embedded cover, or null. */
export async function resolveLocalCover(id: string): Promise<string | null> {
  const meta = useLocalLibraryStore.getState().items[id];
  if (!meta?.cover) return null;
  const cached = coverCache.get(id);
  if (cached) return cached;
  const url = URL.createObjectURL(meta.cover);
  coverCache.set(id, url);
  return url;
}

/** Resolve a playable object URL for a local track (Electron path or web handle). */
export async function resolveLocalUrl(id: string): Promise<string | null> {
  const meta = useLocalLibraryStore.getState().items[id];
  if (!meta) return null;
  const cached = fileCache.get(id);
  if (cached) return cached;

  // Desktop: read the file by absolute path via IPC.
  if (meta.absolutePath && isElectron()) {
    try {
      const file = await toFile({
        absolutePath: meta.absolutePath,
        name: meta.path.split("/").pop() ?? meta.title,
        relPath: meta.path,
        sizeBytes: 0,
      });
      const url = URL.createObjectURL(file);
      fileCache.set(id, url);
      return url;
    } catch {
      return null;
    }
  }

  if (!rootHandle) return null;
  try {
    const segments = meta.path.split("/");
    let dir: DirHandle = rootHandle;
    for (let i = 0; i < segments.length - 1; i++) {
      let next: DirHandle | null = null;
      for await (const entry of dir.values()) {
        if (entry.kind === "directory" && entry.name === segments[i]) {
          next = entry;
          break;
        }
      }
      if (!next) return null;
      dir = next;
    }
    const fileName = segments[segments.length - 1];
    for await (const entry of dir.values()) {
      if (entry.kind === "file" && entry.name === fileName) {
        const file = await entry.getFile();
        const url = URL.createObjectURL(file);
        fileCache.set(id, url);
        return url;
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}
