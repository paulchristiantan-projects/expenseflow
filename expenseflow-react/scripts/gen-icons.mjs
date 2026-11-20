// Generates PWA/iOS PNG icons from public/icon.svg
import sharp from "sharp";
import { readFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const pub = join(root, "public");
const svg = readFileSync(join(pub, "icon.svg"));

mkdirSync(pub, { recursive: true });

// Maskable icon: same art but on a solid bg with safe padding so iOS/Android
// masking never clips the glyph.
const maskable = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#5a6bf0"/><stop offset="1" stop-color="#7c8cff"/>
  </linearGradient></defs>
  <rect width="512" height="512" fill="url(#g)"/>
  <g transform="translate(51 51) scale(0.8)" fill="none" stroke="#ffffff" stroke-width="30" stroke-linecap="round" stroke-linejoin="round">
    <path d="M150 340 L150 300"/><path d="M222 340 L222 250"/>
    <path d="M294 340 L294 200"/><path d="M366 340 L366 150"/>
    <path d="M140 262 Q230 250 300 190 T390 120"/>
    <path d="M352 120 L390 120 L390 158"/>
  </g>
</svg>`;

const targets = [
  { file: "pwa-192.png", size: 192, src: svg },
  { file: "pwa-512.png", size: 512, src: svg },
  { file: "maskable-512.png", size: 512, src: Buffer.from(maskable) },
  { file: "apple-touch-icon.png", size: 180, src: Buffer.from(maskable) },
  { file: "favicon-32.png", size: 32, src: svg },
];

for (const t of targets) {
  await sharp(t.src).resize(t.size, t.size).png().toFile(join(pub, t.file));
  console.log("wrote", t.file);
}

// Native iOS app icon (Capacitor expects a single 1024x1024, no alpha).
const iosIcon = join(
  root,
  "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png"
);
try {
  await sharp(Buffer.from(maskable))
    .resize(1024, 1024)
    .flatten({ background: "#4a5adf" })
    .png()
    .toFile(iosIcon);
  console.log("wrote ios AppIcon-512@2x.png");
} catch {
  console.log("skipped ios icon (ios platform not added yet)");
}
