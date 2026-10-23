import { BadRequestException } from "@nestjs/common";

const ALLOWED_IMAGE_MIMES = new Set(["image/webp", "image/avif"]);
const ALLOWED_IMAGE_EXTS = new Set(["webp", "avif"]);

/**
 * Multer fileFilter for catalog artwork. The service additionally verifies the
 * decoded file dimensions, because MIME data alone is client-controlled.
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
