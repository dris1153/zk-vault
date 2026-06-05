// Generate PWA PNG icons from the vault-cube SVG. Run once; commit the PNGs.
//   node scripts/gen-icons.mjs
import sharp from "sharp";
import { readFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const p = (rel) => fileURLToPath(new URL(rel, import.meta.url));
const tile = readFileSync(p("../app/icon.svg"));
mkdirSync(p("../public/icons/"), { recursive: true });

const render = (svg, size, out) =>
  sharp(Buffer.from(svg)).resize(size, size).png().toFile(p(out));

// Regular icons + apple-touch: the rounded gradient tile.
await render(tile, 192, "../public/icons/icon-192.png");
await render(tile, 512, "../public/icons/icon-512.png");
await render(tile, 180, "../app/apple-icon.png");

// Maskable: full-bleed gradient square (no rounded corners), cube in the safe zone.
const maskable = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#3e9bff"/><stop offset="1" stop-color="#1f3a6b"/>
  </linearGradient></defs>
  <rect width="512" height="512" fill="url(#g)"/>
  <svg x="140" y="140" width="232" height="232" viewBox="0 0 24 24" fill="none"
       stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 12 L20 7.5 M12 12 L12 21 M12 12 L4 7.5"/>
    <path d="M4 7.5 L4 16.5 L12 21 L20 16.5 L20 7.5"/>
    <path d="M4 7.5 L12 12 L20 7.5" stroke="#bfe0ff"/>
    <path d="M12 0.6 L20 5.1 L12 9.6 L4 5.1 Z"/>
  </svg>
</svg>`;
await render(maskable, 512, "../public/icons/icon-512-maskable.png");

console.log("PWA icons generated.");
