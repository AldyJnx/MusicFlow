// Generate PWA icons (192 + 512) for purpose="any" and purpose="maskable"
// from public/music_flow.svg. Maskable variants use ~20% safe-zone padding
// so Android adaptive icon masks don't crop the logo.
//
// Run: pnpm pwa-icons

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const publicDir = join(root, "public");
const outDir = join(publicDir, "icons");

const BG = "#10182d"; // matches theme_color in manifest
const SIZES = [192, 512];

await mkdir(outDir, { recursive: true });

const svg = await readFile(join(publicDir, "music_flow.svg"));

async function renderAny(size) {
  // Full-bleed: logo fills ~85% of the canvas, transparent background optional.
  const logoSize = Math.round(size * 0.85);
  const offset = Math.round((size - logoSize) / 2);
  const logoPng = await sharp(svg).resize(logoSize, logoSize).png().toBuffer();
  await sharp({
    create: { width: size, height: size, channels: 4, background: BG },
  })
    .composite([{ input: logoPng, top: offset, left: offset }])
    .png()
    .toFile(join(outDir, `pwa-${size}-any.png`));
}

async function renderMaskable(size) {
  // Maskable: logo at 60% of canvas — 20% safe zone on each side
  // (Android may mask the outer 10% in some shapes).
  const logoSize = Math.round(size * 0.6);
  const offset = Math.round((size - logoSize) / 2);
  const logoPng = await sharp(svg).resize(logoSize, logoSize).png().toBuffer();
  await sharp({
    create: { width: size, height: size, channels: 4, background: BG },
  })
    .composite([{ input: logoPng, top: offset, left: offset }])
    .png()
    .toFile(join(outDir, `pwa-${size}-maskable.png`));
}

for (const size of SIZES) {
  await renderAny(size);
  await renderMaskable(size);
}

console.log(`Generated ${SIZES.length * 2} PWA icons in ${outDir}`);
