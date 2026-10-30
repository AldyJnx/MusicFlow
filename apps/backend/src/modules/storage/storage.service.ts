import {
  Injectable,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  S3ServiceException,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

export type StorageBucket =
  | "audio"
  | "images"
  | "artistImages"
  | "lyrics"
  | "artistEvidence";

export interface UploadResult {
  key: string;
  url: string;
  bucket: string;
}

interface BucketConfig {
  name: string;
  publicBase: string;
}

const IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
];
const AUDIO_MIME_TYPES = [
  "audio/mpeg",
  "audio/mp4",
  "audio/wav",
  "audio/x-wav",
  "audio/flac",
  "audio/x-flac",
  "audio/ogg",
  "audio/aac",
  "audio/webm",
];
const CATALOG_AUDIO_MIME_TYPES = [
  "audio/wav",
  "audio/x-wav",
  "audio/flac",
  "audio/x-flac",
];

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_AUDIO_SIZE = 100 * 1024 * 1024; // 100 MB
const MAX_VERIFICATION_DOCUMENT_SIZE = 5 * 1024 * 1024;

function catalogKeyPart(value: string, label: string): string {
  const cleaned = value
    // Control characters must be stripped from user-controlled R2 object names.
    // eslint-disable-next-line no-control-regex
    .replace(/[\\/:*?"<>|\u0000-\u001F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) {
    throw new BadRequestException(`El nombre de ${label} no es válido.`);
  }
  return cleaned.slice(0, 180);
}

function catalogAssetExtension(
  extension: string,
  allowedExtensions: readonly string[],
  label: string,
): string {
  const ext = extension.toLowerCase().replace(/^\./, "");
  if (!allowedExtensions.includes(ext)) {
    throw new BadRequestException(
      `El ${label} debe ser ${allowedExtensions
        .map((value) => value.toUpperCase())
        .join(" o ")}.`,
    );
  }
  return ext;
}

/** Build the exact root-level key required by the public audio bucket. */
export function buildCatalogAudioKey(
  artistName: string,
  trackTitle: string,
  extension: string,
): string {
  const ext = catalogAssetExtension(extension, ["wav", "flac"], "audio");
  const artist = catalogKeyPart(artistName, "artista");
  const title = catalogKeyPart(trackTitle, "canción");
  return `${artist} - ${title}.${ext}`;
}

/** Root-level R2 key for a canonical artist portrait. */
export function buildArtistImageKey(
  artistName: string,
  extension: string,
): string {
  const ext = catalogAssetExtension(extension, ["webp", "avif"], "imagen");
  return `${catalogKeyPart(artistName, "artista")}.${ext}`;
}

/** Root-level R2 key for an album cover. */
export function buildAlbumCoverKey(
  albumTitle: string,
  artistName: string,
  extension: string,
): string {
  const ext = catalogAssetExtension(extension, ["webp", "avif"], "imagen");
  return `${catalogKeyPart(albumTitle, "álbum")} - ${catalogKeyPart(
    artistName,
    "artista",
  )}.${ext}`;
}

/** Root-level R2 key for synchronized lyrics. */
export function buildLyricsKey(artistName: string, trackTitle: string): string {
  return `${catalogKeyPart(artistName, "artista")} - ${catalogKeyPart(
    trackTitle,
    "canción",
  )}.lrc`;
}

@Injectable()
export class StorageService {
  private readonly s3: S3Client;
  private readonly buckets: Record<StorageBucket, BucketConfig>;

  constructor(private readonly configService: ConfigService) {
    const endpoint =
      this.configService.get<string>("R2_ENDPOINT") ??
      this.configService.get<string>("AWS_S3_ENDPOINT") ??
      "http://localhost:9000";

    const accessKeyId =
      this.configService.get<string>("R2_ACCESS_KEY") ??
      this.configService.get<string>("AWS_ACCESS_KEY_ID") ??
      "";

    const secretAccessKey =
      this.configService.get<string>("R2_SECRET_ACCESS_KEY") ??
      this.configService.get<string>("AWS_SECRET_ACCESS_KEY") ??
      "";

    const region =
      this.configService.get<string>("R2_REGION") ??
      this.configService.get<string>("AWS_S3_REGION") ??
      "auto";

    // R2 uses 'auto' region. forcePathStyle is required for MinIO but not for R2.
    this.s3 = new S3Client({
      endpoint,
      region,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: !endpoint.includes("r2.cloudflarestorage.com"),
    });

    this.buckets = {
      audio: {
        name:
          this.configService.get<string>("R2_BUCKET_AUDIO") ??
          this.configService.get<string>("AWS_S3_BUCKET") ??
          "music-flow",
        publicBase:
          this.configService.get<string>("R2_PUBLIC_AUDIO_URL") ?? endpoint,
      },
      images: {
        name:
          this.configService.get<string>("R2_BUCKET_IMAGES") ??
          this.configService.get<string>("AWS_S3_BUCKET") ??
          "music-flow-images",
        publicBase:
          this.configService.get<string>("R2_PUBLIC_IMAGES_URL") ?? endpoint,
      },
      artistImages: {
        name:
          this.configService.get<string>("R2_BUCKET_ARTIST_IMAGES") ||
          this.configService.get<string>("R2_BUCKET_IMAGES_ARTIST") ||
          "music-flow-artist-image",
        publicBase:
          this.configService.get<string>("R2_PUBLIC_ARTIST_IMAGES_URL") ||
          this.configService.get<string>("R2_PUBLIC_IMAGES_URL") ||
          endpoint,
      },
      // Lyrics are served by the backend (not loaded by the browser), so this
      // bucket needs no public URL — publicBase is only used to build the
      // archive's reference URL.
      lyrics: {
        name:
          this.configService.get<string>("R2_BUCKET_LYRICS") ??
          "music-flow-songs-lyrics",
        publicBase:
          this.configService.get<string>("R2_PUBLIC_LYRICS_URL")?.trim() ?? "",
      },
      // Evidence is private and must remain isolated from catalogue artwork.
      // The dashboard obtains a short-lived signed URL only when an admin needs
      // to review a request.
      artistEvidence: {
        name:
          this.configService.get<string>("R2_BUCKET_ARTIST_EVIDENCE") ??
          "portal-artist-evidence",
        publicBase:
          this.configService
            .get<string>("R2_PUBLIC_ARTIST_EVIDENCE_URL")
            ?.trim() ?? "",
      },
    };
  }

  async uploadImage(
    file: Express.Multer.File,
    folder = "uploads",
  ): Promise<UploadResult> {
    this.validate(file, IMAGE_MIME_TYPES, MAX_IMAGE_SIZE, "image");
    return this.upload("images", file, folder);
  }

  /**
   * Stores verification evidence in its dedicated private bucket.  The folder
   * is deliberately the requester's username so it can be audited in R2;
   * the PDF file itself remains unguessable and is only exposed by a signed URL.
   */
  async uploadArtistVerificationDocument(
    file: Express.Multer.File,
    username: string,
  ): Promise<UploadResult> {
    if (
      file?.mimetype !== "application/pdf" ||
      !/\.pdf$/i.test(file.originalname)
    ) {
      throw new BadRequestException("La evidencia debe ser un PDF.");
    }
    if (file.size > MAX_VERIFICATION_DOCUMENT_SIZE) {
      throw new BadRequestException(
        "El PDF de evidencia no puede superar 5 MB.",
      );
    }
    const key = `${catalogKeyPart(username, "usuario")}/${uuidv4()}.pdf`;
    return this.putCanonical("artistEvidence", file, key);
  }

  async uploadArtistImage(
    file: Express.Multer.File,
    artistName: string,
  ): Promise<UploadResult> {
    this.validate(file, IMAGE_MIME_TYPES, MAX_IMAGE_SIZE, "image");
    const ext = file.originalname.split(".").pop() ?? "";
    const key = buildArtistImageKey(artistName, ext);
    return this.putCanonical("artistImages", file, key);
  }

  async uploadAlbumCover(
    file: Express.Multer.File,
    albumTitle: string,
    artistName: string,
  ): Promise<UploadResult> {
    this.validate(file, IMAGE_MIME_TYPES, MAX_IMAGE_SIZE, "image");
    const ext = file.originalname.split(".").pop() ?? "";
    const key = buildAlbumCoverKey(albumTitle, artistName, ext);
    return this.putCanonical("images", file, key);
  }

  async uploadAudio(
    file: Express.Multer.File,
    folder = "tracks",
  ): Promise<UploadResult> {
    if (folder === "catalog" || folder.startsWith("catalog/")) {
      throw new BadRequestException(
        "La música de catálogo debe subirse con uploadCatalogAudio.",
      );
    }
    this.validate(file, AUDIO_MIME_TYPES, MAX_AUDIO_SIZE, "audio");
    return this.upload("audio", file, folder);
  }

  /**
   * Catalog masters are deliberately addressable in R2 as
   * "Artist - Song.wav|flac". Unlike private uploads, there is no generated
   * UUID and an existing object is rejected instead of silently overwritten.
   */
  async uploadCatalogAudio(
    file: Express.Multer.File,
    artistName: string,
    trackTitle: string,
  ): Promise<UploadResult> {
    this.validate(file, CATALOG_AUDIO_MIME_TYPES, MAX_AUDIO_SIZE, "audio");
    const ext = file.originalname.split(".").pop()?.toLowerCase();
    if (ext !== "wav" && ext !== "flac") {
      throw new BadRequestException(
        "El catálogo solo acepta archivos WAV o FLAC.",
      );
    }

    const key = buildCatalogAudioKey(artistName, trackTitle, ext);
    const displayName = key.replace(/\.(wav|flac)$/i, "");
    const { name, publicBase } = this.buckets.audio;

    try {
      await this.s3.send(new HeadObjectCommand({ Bucket: name, Key: key }));
      throw new ConflictException(
        `Ya existe una canción en R2 con el nombre "${displayName}".`,
      );
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      if (
        !(error instanceof S3ServiceException) &&
        (error as { name?: string })?.name !== "NotFound" &&
        (error as { $metadata?: { httpStatusCode?: number } })?.$metadata
          ?.httpStatusCode !== 404
      ) {
        throw error;
      }
    }

    await this.s3.send(
      new PutObjectCommand({
        Bucket: name,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );
    return {
      key,
      url: `${publicBase.replace(/\/+$/, "")}/${encodeURI(key)}`,
      bucket: name,
    };
  }

  /** Replaces a catalog master at its deterministic R2 key. */
  async replaceCatalogAudio(
    file: Express.Multer.File,
    artistName: string,
    trackTitle: string,
  ): Promise<UploadResult> {
    this.validate(file, CATALOG_AUDIO_MIME_TYPES, MAX_AUDIO_SIZE, "audio");
    const ext = file.originalname.split(".").pop()?.toLowerCase();
    if (ext !== "wav" && ext !== "flac") {
      throw new BadRequestException(
        "El catálogo solo acepta archivos WAV o FLAC.",
      );
    }
    return this.putCanonical(
      "audio",
      file,
      buildCatalogAudioKey(artistName, trackTitle, ext),
    );
  }

  /**
   * Persist lyrics under the canonical `Artist - Song.lrc` key. Re-saving a
   * track deliberately replaces that same public object without UUIDs.
   */
  async uploadLyrics(
    artistName: string,
    trackTitle: string,
    lrc: string,
  ): Promise<UploadResult> {
    const key = buildLyricsKey(artistName, trackTitle);
    return this.putCanonical(
      "lyrics",
      {
        buffer: Buffer.from(lrc, "utf-8"),
        mimetype: "text/plain; charset=utf-8",
      } as Express.Multer.File,
      key,
    );
  }

  /**
   * Removes the canonical lyric object, or the explicitly linked object when
   * an administrator selected an existing R2 URL.  DeleteObject is idempotent
   * in R2, so this also safely clears an object that was removed manually.
   */
  async deleteLyrics(
    artistName: string,
    trackTitle: string,
    linkedLyricsUrl?: string | null,
  ): Promise<void> {
    const linkedKey = linkedLyricsUrl
      ? this.extractKeyFromUrl(linkedLyricsUrl)
      : null;
    const key = linkedKey ?? buildLyricsKey(artistName, trackTitle);

    if (!key.toLowerCase().endsWith(".lrc") || key.includes("..")) {
      throw new BadRequestException("La clave de la letra no es válida.");
    }

    await this.delete("lyrics", key);
  }

  /** @deprecated Use uploadImage / uploadAudio for clarity. */
  async uploadFile(
    file: Express.Multer.File,
    folder = "uploads",
  ): Promise<UploadResult> {
    return this.uploadImage(file, folder);
  }

  async delete(bucket: StorageBucket, key: string): Promise<void> {
    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.buckets[bucket].name,
        Key: key,
      }),
    );
  }

  /** @deprecated Use delete(bucket, key). */
  async deleteFile(key: string): Promise<void> {
    await this.delete("images", key);
  }

  async getSignedDownloadUrl(
    bucket: StorageBucket,
    key: string,
    expiresInSeconds = 3600,
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.buckets[bucket].name,
      Key: key,
    });
    return getSignedUrl(this.s3, command, { expiresIn: expiresInSeconds });
  }

  async getTextObject(
    bucket: StorageBucket,
    key: string,
  ): Promise<string | null> {
    try {
      const res = await this.s3.send(
        new GetObjectCommand({
          Bucket: this.buckets[bucket].name,
          Key: key,
        }),
      );
      return (await res.Body?.transformToString("utf-8")) ?? null;
    } catch (error) {
      if (
        error instanceof S3ServiceException &&
        (error.name === "NoSuchKey" || error.$metadata.httpStatusCode === 404)
      ) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Public URL for a known object key. A bucket without a public domain returns
   * null so callers can use a temporary signed URL instead of a broken URL.
   */
  getPublicObjectUrl(bucket: StorageBucket, key: string): string | null {
    const { publicBase } = this.buckets[bucket];
    if (!publicBase) return null;
    return `${publicBase.replace(/\/+$/, "")}/${encodeURI(key)}`;
  }

  /** @deprecated Use getSignedDownloadUrl. */
  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    return this.getSignedDownloadUrl("images", key, expiresIn);
  }

  extractKeyFromUrl(url: string): string | null {
    if (!url) return null;
    try {
      const parsed = new URL(url);
      const path = parsed.pathname.replace(/^\/+/, "");
      if (!path) return null;
      const parts = path.split("/");
      const knownBuckets = Object.values(this.buckets).map((b) => b.name);
      if (parts.length > 1 && knownBuckets.includes(parts[0])) {
        return parts.slice(1).join("/");
      }
      return path;
    } catch {
      return null;
    }
  }

  private async upload(
    bucket: StorageBucket,
    file: Express.Multer.File,
    folder: string,
  ): Promise<UploadResult> {
    const { name, publicBase } = this.buckets[bucket];
    const ext = file.originalname.includes(".")
      ? file.originalname.split(".").pop()!.toLowerCase()
      : "bin";
    // Catalog audio is intentionally searchable in R2 by its original title.
    // Private uploads remain under their user-scoped prefix. The UUID suffix
    // keeps repeated titles from overwriting an existing object.
    const catalogFileName = file.originalname
      .replace(/\.[^.]+$/, "")
      .replace(/[\\/:*?"<>|]/g, "-")
      .trim()
      .slice(0, 180);
    const key =
      folder === "catalog" && catalogFileName
        ? `${catalogFileName}-${uuidv4()}.${ext}`
        : `${folder}/${uuidv4()}.${ext}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: name,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        // R2 doesn't honor canned ACLs; bucket public access is set in the Cloudflare dashboard.
      }),
    );

    return {
      key,
      url: `${publicBase.replace(/\/+$/, "")}/${encodeURI(key)}`,
      bucket: name,
    };
  }

  /** Canonical catalogue objects intentionally have no generated folders or UUIDs. */
  private async putCanonical(
    bucket: StorageBucket,
    file: Pick<Express.Multer.File, "buffer" | "mimetype">,
    key: string,
  ): Promise<UploadResult> {
    const { name, publicBase } = this.buckets[bucket];
    await this.s3.send(
      new PutObjectCommand({
        Bucket: name,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );
    return {
      key,
      url: `${publicBase.replace(/\/+$/, "")}/${encodeURI(key)}`,
      bucket: name,
    };
  }

  private validate(
    file: Express.Multer.File,
    allowedTypes: string[],
    maxSize: number,
    label: string,
  ): void {
    if (!file?.mimetype || !allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid ${label} file type. Allowed: ${allowedTypes.join(", ")}`,
      );
    }
    if (file.size > maxSize) {
      const mb = Math.round(maxSize / (1024 * 1024));
      throw new BadRequestException(
        `${label} file too large. Maximum: ${mb}MB`,
      );
    }
  }
}
