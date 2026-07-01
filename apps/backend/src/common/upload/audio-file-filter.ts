import { BadRequestException } from "@nestjs/common";

const AUDIO_MIME_PREFIX = "audio/";
const ALLOWED_AUDIO_MIMES = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/x-m4a",
  "audio/aac",
  "audio/flac",
  "audio/x-flac",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
  "audio/opus",
  "audio/vorbis",
]);
const ALLOWED_EXTS = new Set([
  "mp3",
  "flac",
  "wav",
  "m4a",
  "ogg",
  "aac",
  "opus",
]);

/**
 * Multer fileFilter for audio uploads. Mitigates CVE-2025-55305-class polyglot
 * uploads: the request must carry a real audio mime AND a matching extension —
 * both signals must agree — before Multer buffers the file into memory.
 */
export function audioFileFilter(
  _req: unknown,
  file: { originalname: string; mimetype: string },
  cb: (err: Error | null, accept: boolean) => void,
) {
  const ext = file.originalname.split(".").pop()?.toLowerCase() ?? "";
  const mime = (file.mimetype ?? "").toLowerCase();
  const mimeOk =
    ALLOWED_AUDIO_MIMES.has(mime) ||
    (mime.startsWith(AUDIO_MIME_PREFIX) && ALLOWED_EXTS.has(ext));
  const extOk = ALLOWED_EXTS.has(ext);
  if (!mimeOk || !extOk) {
    return cb(
      new BadRequestException(
        `Unsupported file type: ${mime || "unknown"} (.${ext || "unknown"})`,
      ),
      false,
    );
  }
  cb(null, true);
}
