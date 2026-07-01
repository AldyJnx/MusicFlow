import type { StorageService } from "@/modules/storage/storage.service";

/**
 * Parsed-metadata helpers shared by the catalog (admin) and library (client)
 * upload paths, so embedded cover art and lyrics are extracted the same way
 * regardless of who uploads the file.
 */

/** Minimal shape of what `music-metadata` returns that we read here. */
export interface ParsedMeta {
  common?: {
    lyrics?: unknown;
    picture?: Array<{ data: Uint8Array | Buffer; format?: string }>;
  };
  native?: Record<string, Array<{ id?: unknown; value?: unknown }>>;
}

/** Pull a lyric string out of one value (string, {text}, or {syncText[]}). */
export function lyricTextOf(v: unknown): string {
  if (typeof v === "string") return v;
  if (v && typeof v === "object") {
    const o = v as { text?: unknown; syncText?: unknown };
    if (typeof o.text === "string" && o.text.trim()) return o.text;
    if (Array.isArray(o.syncText)) {
      return (o.syncText as Array<{ text?: unknown }>)
        .map((s) => (typeof s.text === "string" ? s.text : ""))
        .filter(Boolean)
        .join("\n");
    }
  }
  return "";
}

/**
 * Pull unsynced/synced lyrics out of parsed metadata. Some formats expose them
 * on `common.lyrics`; ID3 (MP3) keeps them as native USLT/SYLT frames, so we
 * scan both. Stored as LRC when the text carries [mm:ss] timestamps.
 */
export function extractEmbeddedLyrics(meta: ParsedMeta | null): {
  lyricsLrc?: string;
  lyricsText?: string;
} {
  const texts: string[] = [];

  const common = meta?.common?.lyrics;
  if (Array.isArray(common)) {
    for (const item of common) {
      const t = lyricTextOf(item);
      if (t.trim()) texts.push(t);
    }
  }

  const native = meta?.native;
  if (native) {
    for (const frames of Object.values(native)) {
      for (const frame of frames) {
        const id = String(frame.id ?? "").toUpperCase();
        if (id === "USLT" || id === "SYLT" || id === "LYRICS") {
          const t = lyricTextOf(frame.value);
          if (t.trim()) texts.push(t);
        }
      }
    }
  }

  // De-dupe (common + native often carry the same text) and join.
  const joined = [...new Set(texts.map((t) => t.trim()))]
    .filter(Boolean)
    .join("\n")
    .trim();
  if (!joined) return {};
  return /\[\d{1,2}:\d{2}/.test(joined)
    ? { lyricsLrc: joined }
    : { lyricsText: joined };
}

/**
 * Upload the first embedded picture (ID3 APIC etc.) to storage and return its
 * public URL, or null when there's no cover or the upload failed. Never throws
 * — a bad embedded image must not block the track upload.
 */
export async function extractEmbeddedCover(
  meta: ParsedMeta | null,
  storage: StorageService,
  folder = "covers",
): Promise<string | null> {
  const pic = meta?.common?.picture?.[0];
  if (!pic) return null;
  const buf = Buffer.from(pic.data);
  const mime = pic.format || "image/jpeg";
  const ext = mime.split("/")[1]?.split("+")[0] || "jpg";
  try {
    const up = await storage.uploadImage(
      {
        buffer: buf,
        mimetype: mime,
        size: buf.length,
        originalname: `cover.${ext}`,
      } as Express.Multer.File,
      folder,
    );
    return up.url;
  } catch {
    // Unsupported/oversized embedded image — skip, keep the track.
    return null;
  }
}
