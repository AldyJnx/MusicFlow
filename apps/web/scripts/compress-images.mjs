// One-off image compressor: convert oversized PNG assets to WebP.
// Resizes logos down to display-appropriate dimensions and keeps the
// background at its source resolution but in WebP for ~10x size reduction.
//
// Run: pnpm compress-images

import { readFile, writeFile, stat, unlink } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const jobs = [
  {
    src: "src/assets/Fondo_Login.png",
    out: "src/assets/Fondo_Login.webp",
    resize: null, // keep 1536x1024 — used as background
    quality: 78,
  },
  {
    src: "src/assets/Logo_Music_Flow.png",
    out: "src/assets/Logo_Music_Flow.webp",
    resize: { width: 512 }, // displayed at ~256, 2x for retina
    quality: 85,
  },
  {
    src: "src/shared/assets/MusicFlowLogo.png",
    out: "src/shared/assets/MusicFlowLogo.webp",
    resize: { width: 320 }, // sidebar logo displayed at ~160
    quality: 85,
  },
];

for (const job of jobs) {
  const srcPath = join(root, job.src);
  const outPath = join(root, job.out);
  const before = (await stat(srcPath)).size;

  let pipeline = sharp(await readFile(srcPath));
  if (job.resize) pipeline = pipeline.resize(job.resize);
  pipeline = pipeline.webp({ quality: job.quality, effort: 6 });

  await writeFile(outPath, await pipeline.toBuffer());
  const after = (await stat(outPath)).size;
  const saved = (((before - after) / before) * 100).toFixed(1);
  console.log(
    `${job.src} → ${job.out}: ${(before / 1024).toFixed(0)}KB → ${(after / 1024).toFixed(0)}KB (-${saved}%)`,
  );

  await unlink(srcPath);
}
