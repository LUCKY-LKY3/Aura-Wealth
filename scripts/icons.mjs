// Renders every icon and splash image from the Aurum coin mark.
// Run: node scripts/icons.mjs  (then `npm run icons` for the Android sizes)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BLACK = '#0B0A08';
const GOLD = '#D4AF5A';

// The coin, drawn in a 48x48 box centred on (24, 24).
const coin = `
  <circle cx="24" cy="24" r="14.5" fill="none" stroke="${GOLD}" stroke-width="2.2"/>
  <circle cx="24" cy="24" r="11.6" fill="none" stroke="${GOLD}" stroke-width=".8" opacity=".45"/>
  <path d="M17.2 30.2L24 16.6l6.8 13.6" fill="none" stroke="${GOLD}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M19.9 25.4h8.2" stroke="${GOLD}" stroke-width="2.4" stroke-linecap="round"/>`;

function svg({ size, background = 'none', scale = 1, rounded = false, edge = false }) {
  const bg = background === 'none' ? ''
    : rounded
      ? `<rect x=".5" y=".5" width="47" height="47" rx="11.5" fill="${background}"${edge ? ` stroke="${GOLD}" stroke-opacity=".35"` : ''}/>`
      : `<rect width="48" height="48" fill="${background}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="${size}" height="${size}">${bg}<g transform="translate(24 24) scale(${scale}) translate(-24 -24)">${coin}</g></svg>`;
}

async function png(file, opts) {
  const out = path.join(root, file);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await sharp(Buffer.from(svg(opts))).resize(opts.size, opts.size).png().toFile(out);
  console.log('wrote', file);
}

// Sources for @capacitor/assets (Android launcher icons and splash screens).
await png('resources/icon-only.png', { size: 1024, background: BLACK, scale: 1.15 });
await png('resources/icon-foreground.png', { size: 1024, scale: 0.9 });
await png('resources/icon-background.png', { size: 1024, background: BLACK, scale: 0.0001 });
await png('resources/splash.png', { size: 2732, background: '#080807', scale: 0.3 });
await png('resources/splash-dark.png', { size: 2732, background: '#080807', scale: 0.3 });

// Website / installable web app icons.
await png('public/icons/icon-192.png', { size: 192, background: BLACK, scale: 1, rounded: true, edge: true });
await png('public/icons/icon-512.png', { size: 512, background: BLACK, scale: 1, rounded: true, edge: true });
await png('public/icons/maskable-512.png', { size: 512, background: BLACK, scale: 0.85 });
await png('public/icons/apple-touch-icon.png', { size: 180, background: BLACK, scale: 1.1 });
fs.writeFileSync(path.join(root, 'public/icons/favicon.svg'), svg({ size: 48, background: BLACK, rounded: true, edge: true }));
console.log('wrote public/icons/favicon.svg');
