# Aurum — project guide for Claude

Aurum (formerly "Aura Wealth") is a personal wealth ledger for UK pensions, ISAs, savings and investments.
It started as the owner's app but is now for anyone: no personal data is built in, and a first-run setup
asks for name and date of birth (optional example data). Users log balances and money paid in/out; the app
shows net worth, paid-in vs growth, allocation, a retirement planner, goals, a "What's changed" summary,
and a SIPP vs ISA calculator. It ships as a **website** (GitHub Pages) and an
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
- Ask the owner before pushing tags/releases. Tag pushes are blocked from Claude's cloud sessions (HTTP 403), so
  the owner publishes a release in the GitHub UI (new tag `vX.Y.Z` on `main`); the workflow then attaches the APK.
- Update `RELEASE_NOTES.md` (short `- ` bullets) for each release: it becomes the release body and the app's
  "What's new" in its update banner. The Android app checks the GitHub releases API and offers the APK link.

## App architecture (src/app.html)

- State (v2): `{ version: 2, example, profile: {name,dob,retireAge,band,growth,inflation,drawRate,people:[{id,name}],lastBackup,setupDone},
  accounts: [{id,name,provider,type,color,owner,fee,rate,notes,archived,priorPaid,since,regular:{amount,day,relief,since,last}|null}],
  logs: [{id,accountId,date:'YYYY-MM-DD',value,note}], flows: [{id,accountId,date,amount,own,note,auto,employer}],
  income: [{id,accountId,date,amount,kind:'dividend'|'interest'|'prize'}], goals: [{id,name,target,date,scope}] }`
- "Paid in this tax year" is a flow with `ytd: true` dated on the account's first balance: it counts for allowances
  (dated this tax year) but not as money in for growth (flows on/before the first balance are ignored). SIPP stores gross
  (`own` = amount/1.25), LISA stores own + 25% bonus. Only offered for accounts first logged this tax year.
- `account.yearly` = reference amounts paid in per tax year (`{'2024': 20000}`), used by allowances, the yearly chart and
  carry-forward via `yearPaid()`; never by balances/growth. `profile.p60[year] = {pay, tax}` drives `incomeTax()` (E/W/NI rates
  in `taxRules(y)`) for the tax helper's band and refund estimate.
- `income` is for the tax helper only (doesn't affect growth). Employer pension payments are flows with `employer: true, own: 0`.
- Device-only keys (not in backups): `aurum_lock` (PIN hash), `aurum_bio`, `aurum_reminder` (day), `aurum_update` (cached release), `aurum_autobackup`/`_last` (weekly copy to Documents/Aurum).
- `archived` accounts stay in totals/charts but are hidden from pickers, Update all, reminders and the planner.
- Native plugins: Preferences, Filesystem, Share, LocalNotifications (monthly reminder), NativeBiometric (@capgo, fingerprint).
  saved to `localStorage['aurum_v1']` (key name kept). UI prefs in `aurum_ui`, theme in `aurum_theme`, PIN hash in `aurum_lock`.
- `logs` are balances; `flows` are money in (+) / out (−). `amount` is what reached the account (incl. 25% pension relief /
  LISA bonus), `own` is what the user paid (used for ISA allowances). An account's first balance counts as money in.
  Growth = change − money in (`periodStats`). `priorPaid` ("Total paid in so far") replaces the opening balance as money in
  for all-time figures only (start = -Infinity), so ranged views and monthly bars don't show a fake jump. Account types live in `TYPES` (group, allowance, top-up).
- `owner` is `'me'` or a `profile.people` id (e.g. a child's JISA); others are excluded from "my" net worth by default.
- **Backwards compatibility matters** — `normalize()` must keep importing:
  v1 and v2 of the current format, older key `aura_wealth_v2`, and the original Gemini app's v1 backups
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
