import { Injectable, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

export type StorageBucket = "audio" | "images";

export interface UploadResult {
  key: string;
  url: string;
  bucket: string;
}

interface BucketConfig {
  name: string;
  publicBase: string;
}

const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
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

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_AUDIO_SIZE = 100 * 1024 * 1024; // 100 MB

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
    };
  }

  async uploadImage(
    file: Express.Multer.File,
    folder = "uploads",
  ): Promise<UploadResult> {
    this.validate(file, IMAGE_MIME_TYPES, MAX_IMAGE_SIZE, "image");
    return this.upload("images", file, folder);
  }

  async uploadAudio(
    file: Express.Multer.File,
    folder = "tracks",
  ): Promise<UploadResult> {
    this.validate(file, AUDIO_MIME_TYPES, MAX_AUDIO_SIZE, "audio");
    return this.upload("audio", file, folder);
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
    const key = `${folder}/${uuidv4()}.${ext}`;

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
      url: `${publicBase.replace(/\/+$/, "")}/${key}`,
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
