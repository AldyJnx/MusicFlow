/** Read-only inventory for checking Cloudflare R2 after catalog changes. */
import { readFileSync } from "fs";
import { join } from "path";
import { ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";

for (const line of readFileSync(join(__dirname, "..", ".env"), "utf8").split(/\r?\n/)) {
  const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2].trim();
}

const client = new S3Client({
  endpoint: process.env.R2_ENDPOINT,
  region: process.env.R2_REGION || "auto",
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY!, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY! },
});

async function inspect(label: string, bucket?: string) {
  if (!bucket) return;
  let token: string | undefined;
  let objects = 0;
  let bytes = 0;
  let audio = 0;
  do {
    const page = await client.send(new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: token }));
    for (const item of page.Contents ?? []) {
      objects += 1;
      bytes += item.Size ?? 0;
      if (/\.(mp3|m4a|wav|flac|ogg|aac|opus)$/i.test(item.Key ?? "")) audio += 1;
    }
    token = page.NextContinuationToken;
  } while (token);
  console.log(`${label}: ${objects} objetos, ${audio} canciones, ${(bytes / 1024 / 1024).toFixed(2)} MB`);
}

async function main() {
  await Promise.all([
    inspect("Audio", process.env.R2_BUCKET_AUDIO),
    inspect("Imágenes", process.env.R2_BUCKET_IMAGES),
    inspect("Imágenes de artistas", process.env.R2_BUCKET_ARTIST_IMAGES || process.env.R2_BUCKET_IMAGES_ARTIST),
    inspect("Letras", process.env.R2_BUCKET_LYRICS),
  ]);
}
void main();
