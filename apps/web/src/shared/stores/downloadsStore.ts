import { create } from "zustand";

import {
  idbDelete,
  idbGet,
  idbListMeta,
  idbPut,
  type DownloadMeta,
} from "../offline/downloadsDb";
import { getTrackLyrics } from "../api/catalog";

export interface DownloadableTrack {
  id: string;
  title: string;
  artist: string;
  durationMs: number;
  url: string;
  cover?: string | null;
}

interface DownloadsState {
  ready: boolean;
  items: Record<string, DownloadMeta>;
  /** trackId → 0..100 while downloading. */
  progress: Record<string, number>;
  init: () => Promise<void>;
  download: (track: DownloadableTrack) => Promise<void>;
  remove: (id: string) => Promise<void>;
  isDownloaded: (id: string) => boolean;
}

export const useDownloadsStore = create<DownloadsState>((set, get) => ({
  ready: false,
  items: {},
  progress: {},

  init: async () => {
    try {
      const metas = await idbListMeta();
      const items: Record<string, DownloadMeta> = {};
      for (const m of metas) items[m.id] = m;
      set({ items, ready: true });
    } catch {
      set({ ready: true });
    }
  },

  download: async (track) => {
    if (get().items[track.id] || get().progress[track.id] != null) return;
    set((s) => ({ progress: { ...s.progress, [track.id]: 5 } }));
    try {
      // Audio (the heavy part).
      const audioRes = await fetch(track.url);
      if (!audioRes.ok) throw new Error("audio fetch failed");
      const audio = await audioRes.blob();
      set((s) => ({ progress: { ...s.progress, [track.id]: 70 } }));

      // Cover (best-effort).
      let cover: Blob | null = null;
      if (track.cover) {
        try {
          const r = await fetch(track.cover);
          if (r.ok) cover = await r.blob();
        } catch {
          /* ignore cover failures */
        }
      }

      // Lyrics (best-effort).
      let lyricsLrc: string | null = null;
      let lyricsText: string | null = null;
      try {
        const ly = await getTrackLyrics(track.id);
        lyricsLrc = ly.lyricsLrc ?? null;
        lyricsText = ly.lyricsText ?? null;
      } catch {
        /* ignore lyrics failures */
      }

      const downloadedAt = Date.now();
      await idbPut({
        id: track.id,
        title: track.title,
        artist: track.artist,
        durationMs: track.durationMs,
        audio,
        cover,
        lyricsLrc,
        lyricsText,
        downloadedAt,
      });

      set((s) => {
        const progress = { ...s.progress };
        delete progress[track.id];
        return {
          progress,
          items: {
            ...s.items,
            [track.id]: {
              id: track.id,
              title: track.title,
              artist: track.artist,
              durationMs: track.durationMs,
              hasCover: !!cover,
              hasLyrics: !!(lyricsLrc || lyricsText),
              downloadedAt,
            },
          },
        };
      });
    } catch {
      set((s) => {
        const progress = { ...s.progress };
        delete progress[track.id];
        return { progress };
      });
    }
  },

  remove: async (id) => {
    await idbDelete(id);
    set((s) => {
      const items = { ...s.items };
      delete items[id];
      return { items };
    });
    revokeCached(id);
  },

  isDownloaded: (id) => !!get().items[id],
}));

// ── Offline playback URL resolution ───────────────────────────────────────────
// Cache object URLs so we don't recreate a blob URL on every play/seek.
const urlCache = new Map<string, string>();
const coverCache = new Map<string, string>();

function revokeCached(id: string) {
  const u = urlCache.get(id);
  if (u) {
    URL.revokeObjectURL(u);
    urlCache.delete(id);
  }
  const c = coverCache.get(id);
  if (c) {
    URL.revokeObjectURL(c);
    coverCache.delete(id);
  }
}

/** Local object URL for a downloaded track's cover, or null. */
export async function resolveCoverUrl(id: string): Promise<string | null> {
  if (!useDownloadsStore.getState().items[id]?.hasCover) return null;
  const cached = coverCache.get(id);
  if (cached) return cached;
  const rec = await idbGet(id);
  if (!rec?.cover) return null;
  const objUrl = URL.createObjectURL(rec.cover);
  coverCache.set(id, objUrl);
  return objUrl;
}

/**
 * Returns a playable URL for a track: a local blob URL when it's downloaded,
 * otherwise the remote URL. Used by the player so downloads play with no net.
 */
export async function resolvePlayableUrl(track: {
  id: string;
  url: string;
}): Promise<string> {
  if (!useDownloadsStore.getState().items[track.id]) return track.url;
  const cached = urlCache.get(track.id);
  if (cached) return cached;
  const rec = await idbGet(track.id);
  if (!rec) return track.url;
  const objUrl = URL.createObjectURL(rec.audio);
  urlCache.set(track.id, objUrl);
  return objUrl;
}
