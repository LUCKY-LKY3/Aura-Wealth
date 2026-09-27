// Builds the website into www/ from src/app.html.
// The same www/ folder is published to GitHub Pages and packaged into the Android app.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const r = p => path.join(root, p);
const out = r('www');

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(out, 'fonts'), { recursive: true });

// Static files: manifest, icons.
fs.cpSync(r('public'), out, { recursive: true });

// Fonts are bundled so the app works offline and makes no third-party requests.
const fonts = [
  ['@fontsource-variable/geist/files/geist-latin-wght-normal.woff2', 'geist.woff2'],
  ['@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2', 'geist-mono.woff2']
];
for (const [src, dest] of fonts) fs.copyFileSync(r('node_modules/' + src), path.join(out, 'fonts', dest));

// Capacitor's runtime: inert in a normal browser, bridges to native plugins in the Android app.
fs.copyFileSync(r('node_modules/@capacitor/core/dist/capacitor.js'), path.join(out, 'capacitor.js'));

const fontFaces = `<style>
@font-face{font-family:'Geist';font-style:normal;font-weight:100 900;font-display:swap;src:url(fonts/geist.woff2) format('woff2')}
@font-face{font-family:'Geist Mono';font-style:normal;font-weight:100 900;font-display:swap;src:url(fonts/geist-mono.woff2) format('woff2')}
</style>`;

let app = fs.readFileSync(r('src/app.html'), 'utf8')
  .replace(/<link rel="preconnect"[^>]*>\r?\n/g, '')
  .replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>/, fontFaces)
  .replace(/<link rel="icon" href="data:[^"]*">/, '<link rel="icon" href="icons/favicon.svg" type="image/svg+xml">');

// Title, meta, fonts and styles belong in <head>; the page markup starts with the icon sprite.
const split = app.indexOf('<svg width="0" height="0"');
if (split < 0) throw new Error('Could not find the start of the page markup in src/app.html');
const headPart = app.slice(0, split);
const bodyPart = app.slice(split);

const html = `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="description" content="Aurum is a private wealth ledger for UK pensions and ISAs. Your data stays on your device.">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<style>body{margin:0}:root{padding-top:var(--sa-top,0px)}img{max-width:100%}[hidden]{display:none!important}</style>
<script src="capacitor.js"></script>
${headPart}
</head>
<body>
${bodyPart.trim()}
<script>
if ('serviceWorker' in navigator && location.protocol === 'https:' &&
    !(window.capacitorExports && capacitorExports.Capacitor.isNativePlatform())) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
</script>
</body>
</html>
`;
fs.writeFileSync(path.join(out, 'index.html'), html);

// Service worker: caches the app so the website opens offline. Version changes with every build.
const files = [];
(function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) walk(full);
    else if (f !== 'sw.js') files.push(path.relative(out, full).split(path.sep).join('/'));
  }
})(out);
const version = crypto.createHash('sha256').update(files.map(f => fs.readFileSync(path.join(out, f))).join('')).digest('hex').slice(0, 12);
const sw = fs.readFileSync(r('src/sw.js'), 'utf8')
  .replace('__VERSION__', version)
  .replace('__FILES__', JSON.stringify(['./', ...files]));
fs.writeFileSync(path.join(out, 'sw.js'), sw);

console.log(`Built www/ (${files.length + 1} files, version ${version})`);
