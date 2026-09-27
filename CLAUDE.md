# Aurum — project guide for Claude

Aurum (formerly "Aura Wealth") is the owner's personal wealth ledger for UK pensions and ISAs.
The user logs each account's value over time; the app shows net worth, performance, allocation,
and a SIPP vs ISA tax-relief calculator. It ships as a **website** (GitHub Pages) and an
**Android APK** (Capacitor), built from the same source.

- Website: https://lucky-lky3.github.io/Aura-Wealth/
- APK: GitHub Releases (`Aurum-<version>.apk`), e.g. .../releases/download/v1.0.0/Aurum-1.0.0.apk
- Owner uses an Honor Magic V2 (Android) — test layouts at phone width, including the unfolded ~7.9" inner screen.

## Layout

| Path | Purpose |
| --- | --- |
| `src/app.html` | **The whole app** — one file: `<title>`, `<style>`, markup, one inline `<script>`. No framework, no bundler. |
| `src/sw.js` | Service worker template (`__VERSION__`, `__FILES__` filled in by the build) |
| `public/` | `manifest.webmanifest` + `icons/` (generated), copied into `www/` |
| `scripts/build.mjs` | Builds `www/` from `src/app.html`: adds `<!doctype>/<head>`, swaps Google Fonts for bundled Geist woff2, copies `capacitor.js`, writes `sw.js` |
| `scripts/icons.mjs` | Renders all icons/splash from the coin mark (needs `sharp`) |
| `android/` | Capacitor 8 Android project (appId `io.github.luckylky3.aurum`) |
| `resources/` | Icon/splash sources for `npm run icons` (@capacitor/assets) |
| `brand/` | Logo SVGs |
| `www/`, `dist/`, `node_modules/` | Generated — gitignored, never edit |

## Commands

```bash
npm ci --ignore-scripts      # install (scripts only needed for sharp/icons)
npm run build                # src -> www/
npm run sync                 # build + npx cap sync android
node scripts/icons.mjs && npm run icons   # only when the logo changes
```

Quick JS syntax check of the inline script:
```bash
sed -n '/^<script>$/,/^<\/script>$/p' src/app.html | sed '1d;$d' > /tmp/app.js && node --check /tmp/app.js
```

There is no local Java/Android SDK on the owner's PC — **APKs are only built by GitHub Actions.**

## Releasing

- Push to `main` → **Website** workflow deploys `www/` to Pages; **Android app** workflow builds an APK artifact.
- Push a tag `vX.Y.Z` → signed APK published as a GitHub Release. Bump `version` in `package.json` to match.
  `versionCode` = the workflow run number (always increases).
- Signing uses repo secrets `AURUM_KEYSTORE_BASE64` + `AURUM_KEYSTORE_PASSWORD` (PKCS12, alias `aurum`).
  The key file lives only on the owner's PC. **Never generate a new key, never commit key files, never
  change `appId`** — any of these breaks updates and would force an uninstall (which wipes the user's data).
- Ask the owner before pushing tags/releases.

## App architecture (src/app.html)

- State: `{ version: 1, example, accounts: [{id,name,provider,type,color}], logs: [{id,accountId,date:'YYYY-MM-DD',value,note}] }`
  saved to `localStorage['aurum_v1']`. UI prefs in `aurum_ui`, theme in `aurum_theme`.
- **Backwards compatibility matters** — `normalize()` must keep importing:
  the current format, older key `aura_wealth_v2`, and the original Gemini app's v1 backups
  (`{ hl_sipp:[], hl_isa:[], aegon:[] }` / localStorage keys `aura_v1_*`). Don't break these.
- First run shows seeded **example data** (`example: true`); the first real logged value clears it.
- Native (Android) is detected via `window.capacitorExports.Capacitor.isNativePlatform()`; plugins via
  `capacitorExports.registerPlugin('Preferences'|'Filesystem'|'Share')`. In the app, data is mirrored to
  Preferences and restored from it if WebView storage is empty. Export = write file to CACHE + share sheet
  (browser `<a download>` does not work in the WebView). All native code must no-op in a normal browser.
- Rendering: each tab has a `renderX()` that sets `view.innerHTML`; events are delegated via `data-action`.
  Charts are hand-written SVG (`chart()`, `sparkline()`, `donut()`, `totalTrend()`) — no chart library.
- Always escape user text with `esc()` when building HTML.
- No `alert/confirm/prompt` — confirmations are inline (pendingDelete / pendingReset / pendingRemoveAcct).

## Design rules (owner-approved — don't drift)

- **Black and gold, dark by default.** Dark tokens live on bare `:root`; Light is opt-in only via
  `data-aurum="light"` (Settings). Don't reintroduce `prefers-color-scheme` switching.
- Palette: bg `#080807`, surfaces `#121110`/`#1B1916`, gold `#D4AF5A`/`#D9B666`, ink `#F3EFE6`.
  Account colours `--c1..c6` = gold, ivory, copper, … Semantic green/red only for gains/losses.
- Fonts: Geist (UI) + Geist Mono (table figures, chart axes). Bundled, no external font requests.
- Logo: gold coin with an "A" on a black rounded tile (`brand/aurum-mark.svg`). Name is **Aurum**.
- Safe areas: use `var(--sa-top)` / `var(--sa-bottom)` (Capacitor insets with `env()` fallback).
- Keep it professional and restrained: one bold element (the net-worth card), tables over cards.

## Domain notes (UK)

GBP only, `en-GB` formatting. Tax year starts 6 April. ISA allowance £20,000/yr. SIPP relief at source
(net ÷ 0.8), higher/additional-rate reclaim 20%/25% of gross. 25% tax-free lump sum capped by the
Lump Sum Allowance £268,275. Pension access age 57 from April 2028. Calculator output is illustration,
not advice — keep that disclaimer.
