/**
 * Low-level IndexedDB store for offline downloads. Each record holds a track's
 * audio Blob (+ cover, lyrics) so it can play with no network. The browser
 * persists this across sessions — the foundation of the "normal player"
 * offline mode.
 */

const DB_NAME = "musicflow-offline";
const STORE = "tracks";
const VERSION = 1;

export interface DownloadRecord {
  id: string;
  title: string;
  artist: string;
  durationMs: number;
  audio: Blob;
  cover: Blob | null;
  lyricsLrc: string | null;
  lyricsText: string | null;
  downloadedAt: number;
}

export interface DownloadMeta {
  id: string;
  title: string;
  artist: string;
  durationMs: number;
  hasCover: boolean;
  hasLyrics: boolean;
  downloadedAt: number;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const req = fn(t.objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
        t.oncomplete = () => db.close();
      }),
  );
}

export function idbPut(record: DownloadRecord): Promise<IDBValidKey> {
  return tx("readwrite", (s) => s.put(record));
}

export function idbGet(id: string): Promise<DownloadRecord | undefined> {
  return tx("readonly", (s) => s.get(id) as IDBRequest<DownloadRecord>);
}

export function idbDelete(id: string): Promise<undefined> {
  return tx("readwrite", (s) => s.delete(id) as IDBRequest<undefined>);
}

export async function idbListMeta(): Promise<DownloadMeta[]> {
  const all = await tx<DownloadRecord[]>(
    "readonly",
    (s) => s.getAll() as IDBRequest<DownloadRecord[]>,
  );
  return all
    .map((r) => ({
      id: r.id,
      title: r.title,
      artist: r.artist,
      durationMs: r.durationMs,
      hasCover: !!r.cover,
      hasLyrics: !!(r.lyricsLrc || r.lyricsText),
      downloadedAt: r.downloadedAt,
    }))
    .sort((a, b) => b.downloadedAt - a.downloadedAt);
}
