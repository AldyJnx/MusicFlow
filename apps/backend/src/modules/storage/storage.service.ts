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

export interface UploadResult {
  key: string;
  url: string;
  bucket: string;
}

@Injectable()
export class StorageService {
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly endpoint: string;
  private readonly publicUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.endpoint = this.configService.get<string>(
      "S3_ENDPOINT",
      "http://localhost:9000",
    );
    this.bucket = this.configService.get<string>("S3_BUCKET", "musicflow");
    this.publicUrl = this.configService.get<string>(
      "S3_PUBLIC_URL",
      this.endpoint,
    );

    this.s3Client = new S3Client({
      endpoint: this.endpoint,
      region: this.configService.get<string>("S3_REGION", "us-east-1"),
      credentials: {
        accessKeyId: this.configService.get<string>(
          "S3_ACCESS_KEY",
          "minioadmin",
        ),
        secretAccessKey: this.configService.get<string>(
          "S3_SECRET_KEY",
          "minioadmin",
        ),
      },
      forcePathStyle: true, // Required for MinIO
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = "uploads",
  ): Promise<UploadResult> {
    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        "Invalid file type. Allowed: JPEG, PNG, GIF, WebP",
      );
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException("File too large. Maximum size: 5MB");
    }

    const extension = file.originalname.split(".").pop() || "jpg";
    const key = `${folder}/${uuidv4()}.${extension}`;

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: "public-read",
      }),
    );

    return {
      key,
      url: `${this.publicUrl}/${this.bucket}/${key}`,
      bucket: this.bucket,
    };
  }

  async deleteFile(key: string): Promise<void> {
    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  extractKeyFromUrl(url: string): string | null {
    if (!url) return null;
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname;
      // Remove leading slash and bucket name
      const parts = path.split("/").filter(Boolean);
      if (parts.length > 1 && parts[0] === this.bucket) {
        return parts.slice(1).join("/");
      }
      return parts.join("/");
    } catch {
      return null;
    }
  }
}
