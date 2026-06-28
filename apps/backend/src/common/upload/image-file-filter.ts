import { BadRequestException } from "@nestjs/common";

const ALLOWED_IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);
const ALLOWED_IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "gif", "webp"]);

/**
 * Multer fileFilter for cover/artwork uploads. Requires a real image mime AND a
 * matching extension before Multer buffers the file (same hardening as audio).
 */
export function imageFileFilter(
  _req: unknown,
  file: { originalname: string; mimetype: string },
  cb: (err: Error | null, accept: boolean) => void,
) {
  const ext = file.originalname.split(".").pop()?.toLowerCase() ?? "";
  const mime = (file.mimetype ?? "").toLowerCase();
  if (!ALLOWED_IMAGE_MIMES.has(mime) || !ALLOWED_IMAGE_EXTS.has(ext)) {
    return cb(
      new BadRequestException(
        `Unsupported image type: ${mime || "unknown"} (.${ext || "unknown"})`,
      ),
      false,
    );
  }
  cb(null, true);
}
