<p align="center"><img src="brand/aurum-logo-on-dark.svg" alt="Aurum" width="240"></p>

# Aurum

A private wealth ledger for UK pensions and ISAs. Log each account's value over time and Aurum shows your net worth, growth, allocation, and a SIPP vs ISA tax-relief comparison.

- **Website:** https://lucky-lky3.github.io/Aura-Wealth/
- **Android app:** download the latest `.apk` from [Releases](https://github.com/LUCKY-LKY3/Aura-Wealth/releases).

Your figures are saved on your own device (browser storage on the website, app storage on Android). Nothing is sent to a server. Use **Settings → Export backup** before changing phone or clearing your browser, then **Import backup** on the new device. Backups from the old Aura Wealth app import too.

## Project layout

| Path | What it is |
| --- | --- |
| `src/app.html` | The whole app: markup, styles and script in one file |
| `src/sw.js` | Service worker template for offline use of the website |
| `public/` | Web app manifest and icons, copied into the build |
| `scripts/build.mjs` | Builds `www/` (bundles fonts, Capacitor runtime, service worker) |
| `scripts/icons.mjs` | Renders all icons and splash images from the logo |
| `android/` | Capacitor Android project |
| `brand/` | Logo files |

## Building

```bash
npm install
npm run build        # website into www/
npm run sync         # build, then copy into the Android project
```

GitHub Actions does the rest:

- **Website** workflow deploys `www/` to GitHub Pages on every push to `main`.
- **Android app** workflow builds an APK on every push. Pushing a tag such as `v1.0.1` publishes a signed release.

Android releases are signed with a private key held in the `AURUM_KEYSTORE_BASE64` and `AURUM_KEYSTORE_PASSWORD` repository secrets. Every release must use the same key, or Android will not install the update over the existing app.
