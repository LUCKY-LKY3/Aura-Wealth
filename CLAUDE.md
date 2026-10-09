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

Planned work by version lives in `ROADMAP.md` — keep it updated when the owner adds, moves or drops items.

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

- State (v2): `{ version: 2, example, profile: {name,dob,retireAge,band,growth,inflation,drawRate,people:[{id,name}],sources:[…],p60,lastBackup,setupDone},
  accounts: [{id,name,provider,type,color,owner,fee,rate,notes,archived,priorPaid,since,regular:{amount,day,relief,since,last}|null}],
  logs: [{id,accountId,date:'YYYY-MM-DD',value,note}], flows: [{id,accountId,date,amount,own,note,auto,employer}],
  income: [{id,accountId,date,amount,kind:'dividend'|'interest'|'prize'}], goals: [{id,name,target,date,scope}],
  pay: [{id,date,source,net,…}] }` (sources/pay: see 1.9.5 below)
- "Paid in this tax year" is a flow with `ytd: true` dated on the account's first balance: it counts for allowances
  (dated this tax year) but not as money in for growth (flows on/before the first balance are ignored). SIPP stores gross
  (`own` = amount/1.25), LISA stores own + 25% bonus. Only offered for accounts first logged this tax year.
- Year by year (`yearRows`): values at 5 April are saved as real balances (`upsertLog`). For all-time figures, `yearlyExtra`
  adds yearly amounts for tax years after the first balance (less what was logged) to money in.
- `account.yearly` = reference amounts paid in per tax year (`{'2024': 20000}`), used by allowances, the yearly chart and
  carry-forward via `yearPaid()`; never by balances/growth. `profile.p60[year] = {pay, tax, pay2, tax2, other, giftAid, marriage:'none'|'receive'|'give', code}` drives `incomeTax()` (E/W/NI rates
  in `taxRules(y)`) for the tax helper's band and refund estimate.
- Estimated balances: a payment logged without a balance (and each regular payment) adds a log `{estimated:true, flowIds}`
  = last balance + amount (`addEstimate`); deleting/editing the payment reverses it (`dropEstimate`); a real balance the
  same day replaces it (`upsertLog`). Only when the payment is on/after the latest balance.
- Notifications (bell): `computeNotes()` derives them from data on each render (`refreshBell()`); only `ui.notes.{read,gone,on,move}`
  is stored (in `aurum_ui`). Ids encode the date/version so a new occurrence shows again. Value moves are growth only (flows excluded, estimated logs ignored).
- Collapsible sections use `foldOpen(key,title,sub)`/`foldClose` (round chevron); open state in `ui.folds`.
- `income` (interest/dividends/prizes) feeds the tax helper and is shown on Income; not money in or the savings rate. Since 1.9.9, entries
  marked `added` raise the balance via an estimated log (so they show as growth). Employer pension payments are flows with `employer: true, own: 0`.
- Device-only keys (not in backups): `aurum_lock` (PIN hash), `aurum_bio`, `aurum_reminder` (day), `aurum_update` (cached release), `aurum_taxrem` (June P60 / January SA reminders), `aurum_palette` (2.0.13), `aurum_autobackup`/`_last` (weekly copy to Documents/Aurum).
- `archived` accounts stay in totals/charts but are hidden from pickers, Update all, reminders and the planner.
- Native plugins: Preferences, Filesystem, Share, LocalNotifications (monthly reminder), NativeBiometric (@capgo, fingerprint), Haptics.
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
- No `alert/confirm/prompt`. Entries, goals and people delete straight away with an Undo toast (`snapshot()`);
  removing an account and deleting all data still confirm inline (pendingRemoveAcct / pendingReset).
- Motion (1.9.1): bell panel pops from the bell (`placeNotes`/`closeNotes`), `countUp()` for `[data-count]` figures,
  `.grab` drag handles on phone sheets, `.tab-pill`, `body.scrolled` shrinks the sticky header, `.statement.shine` on a new high.
  Everything respects `reduceMotion()`.

- 1.9.2: `monthReview()`/`reviewCard()` (last calendar month; Overview days 1–10 until dismissed via `ui.reviewSeen`, always on Changes);
  `streakOf(a)` = consecutive months with money paid in; `account.pinned` + `pinFirst()` order lists; drag handles `.drag-h` reorder
  within a group; long-press (500ms) on account rows/chips opens `#menu-sheet`. Encrypted backups: `aurum_bkpass` (device-only)
  makes `backupOut()` produce `{app:'Aurum',encrypted:1,kdf:'PBKDF2-SHA256',iter,salt,iv,data}` (AES-GCM); `importText()` asks
  for the password. `aurum_locktime` = PIN re-lock delay in minutes ('0','5','15','never'; default 1).

- 1.9.3: `visitStrip()` compares my net worth with `ui.lastVisit` ({date,total}, saved on each Overview render) once per app start;
  `dateChips()` in Log value; `html{overflow-x:hidden}` + `overflow-x:clip` stop tab swipes widening the page; Settings reorder is
  per-group boxes (`.reorder-grp`); backup password needs confirm, and the current one to change/turn off; `save-phone` action.

## Design rules (owner-approved — don't drift)

- **Black and gold, dark by default.** Dark tokens live on bare `:root`; Light is opt-in only via
  `data-aurum="light"` (Settings). Don't reintroduce `prefers-color-scheme` switching.
  Since 2.0.13 the user may pick another dark palette (Green/Navy/Copper) via `:root[data-pal=…]:not([data-aurum="light"])`
  token blocks; gold stays the default and the brand.
- Palette: bg `#080807`, surfaces `#121110`/`#1B1916`, gold `#D4AF5A`/`#D9B666`, ink `#F3EFE6`.
  Account colours `--c1..c6` = gold, ivory, copper, … Semantic green/red only for gains/losses.
- Fonts: Geist (UI) + Geist Mono (table figures, chart axes). Bundled, no external font requests.
- Logo: gold coin with an "A" on a black rounded tile (`brand/aurum-mark.svg`). Name is **Aurum**.
- Safe areas: use `var(--sa-top)` / `var(--sa-bottom)` (Capacitor insets with `env()` fallback).
- Switches (`.check.tgl`, `input.switch`) for anything that applies straight away (settings, chart options); checkboxes only
  inside forms saved with a button and for picking items in a list.
- Keep it professional and restrained: one bold element (the net-worth card), tables over cards.

## Domain notes (UK)

GBP only, `en-GB` formatting. Tax year starts 6 April. ISA allowance £20,000/yr. SIPP relief at source
(net ÷ 0.8), higher/additional-rate reclaim 20%/25% of gross. 25% tax-free lump sum capped by the
Lump Sum Allowance £268,275. Pension access age 57 from April 2028. Calculator output is illustration,
not advice — keep that disclaimer.

- 1.9.4: keypad lock (`showLock(intro)`, `pressKey`, `checkPin`, `unlock()` coin-to-header animation; `onUnlock` callback).
  Device-only `aurum_lockn` (PIN length, so it checks on the last digit; old PINs without it check silently from 4 digits and
  need OK to count a miss) and `aurum_lockfail` `{n,until}` (5 misses → 30s wait, doubling). `pwWrong(input, after)` shows
  "Incorrect password". Demo mode: `demo = {state, ui}` holds the real data; `save()`/`saveUi()` no-op, `computeNotes()` empty,
  backups/import/auto backup blocked; `endDemo()` asks for the PIN. Lock screen colours are fixed dark in both themes.
  Splash drawables in `android/app/src/main/res/drawable*/splash.png` match the lock screen (glow + `#aurum-coin`).


- 1.9.5 Income tab (`renderIncome`): `profile.sources` `[{id,name,kind,regular:{net,day}|null,archived}]` (kinds in `SOURCE_KINDS`,
  `ONE_OFF` = bonus/gift/windfall) and top-level `pay` `[{id,date,source,net,gross,tax,ni,pension,studentLoan,other,note,oneOff,flowId?}]`.
  `payStats(from,to)`: saved = Σ `own` of my non-employer, non-ytd flows (withdrawals net off); rate = saved/net; `coreRate` leaves
  out one-offs (assumed saved first); `fullRate` adds employer flows. Interest/dividends shown but not in the rate. Only "me".
  A pension deduction can create a linked employer flow (`flowId`, own 0) only when ticked; `removePay()` drops it. Notes kind `pay`.

- 1.9.6: `openTy(id)`/`#ty-sheet` splits a first balance dated after 6 April (`canSplit(a)`): adds a 5 April balance (`upsertLog`)
  and real monthly flows (an old `ytd` flow is dropped, or turned into a normal flow if no months were entered); new accounts offer it via
  `#acct-split` (`splitNext`). Flows can carry `transfer: true` (money moved between own accounts or from existing savings, in or out: excluded from `payStats`) and
  `isaTransfer: true` (also excluded from ISA allowance in `allowanceUsed`/`yearPaid`/`loggedPaid`). `payslipPanel()` on Income
  (from pay entries with `gross > 0`; `SLIP_ROWS`). `missingPay(src)` gives bell note `paymiss-*` and an Income line; `fillPay()` adds usual net (Undo).

- 1.9.7: `FAQ` array `[id, question, answerHtml]` rendered in Settings (`#faq`, `details.faq#faq-<id>`); `openFaq(id)` closes open
  dialogs, goes to Settings and opens/scrolls; `why(id,ariaLabel,text?)` builds the gold circled "?" help button (`.why`, `data-action="faq"`), placed next to the label it explains, also a link in the bell.
  Add a question when a new feature needs explaining. `balanceJump()` in the Log value submit shows `#log-jump` (Paid in / Moved /
  growth → `jumpAnswer`, `jumpOk`). `copySlip()`/`lastSlip()` in Log pay. Income: still to come (This month), `multi` "Of income"
  column + ≥80% note, one-offs this tax year, same-months YoY on `core` take-home (needs pay from the previous tax year's start).

- 1.9.8: `chart()` takes `notes` (text per point, gold `.note-dot` ring on the first series); the account chart passes balance notes
  (not 'Opening balance') and shows them in the readout (`.rn`). Colour picker = `input[name="acct-color"]` swatches in `#acct-sheet`.
  Net worth card: 30-day change + growth (`periodTotals`), all-time paid in/growth, `.stmt-stale` (balances >30 days → open-bulk);
  `bindTrend()` makes `totalTrend()` scrubbable (`trendPts`, figure shows the date's total, restores on release).
  `payStrip()` on Overview shows saved so far this month (also without pay logged), plus last month's and the tax year's rate when pay exists.
  2.0.5: it also shows this month's rate so far (vs pay logged this month, else vs the sum of non-archived sources' `regular.net`, labelled "vs usual pay").

- 1.9.9: income entries can carry `note` and `added` (paid into the account; default on). `added` interest/dividends/prizes logged without a
  balance go through `addEstimate`/`dropEstimate` like flows (their id in `flowIds`), so the balance rises as growth. History table has no
  Note column: notes (and extras like "You paid £x") go on a `tr.hn-row` line under the entry (`.hn`, ellipsis, tap `hnote` to expand).
  Don't give table cells the class `note`: it clashes with the bell's `.note` styles. FAQ entries are `[id, q, a, section]`, rendered
  grouped in `FAQ_SECS` order (first appearance); add new questions inside their section. The `est.` badge opens FAQ `est`. `#faq-q` filters in place (`faqSearch`, opens up to 3 matches).

- 2.0.0: `ui.nwRange` ('1M'|'1Y'|'All', `NW_RANGES`, `nwChips()`) drives the net worth card's change line and trend (`totalTrend` thins
  to ~120 points) and `wealthSources(t, r, sinceMs)` on Overview (paid in vs growth, by group, top 5 movers; FAQ `sources`).
  Settings is a menu (`settingsMenu`, `SET_ICONS`) of pages: `renderSettings` builds `secs` = [pageKey, html]; `setPage` (not saved)
  picks one; `openSetPage(k)` pushes history on phone so back returns to the menu; ≥1000px shows menu + page (default `you`).
  `goTab('settings')` resets to the menu; `openFaq` opens page `help`. New Settings sections must go in `secs` with a page key.

- 2.0.1: `wealthPath()` (Planner `#path-panel`, called from `updatePlan`): timeline of included accounts + `project()` from today,
  always in today's money, `ui.pathSpan` ('all'|'10'). `chart()` series/band values may be `null` (gaps) and `cfg.divider {t,label}`
  draws a dashed line; non-fit axes use `niceScale`; markers closer than 12px are skipped. `seedExample()` = 24 months of every
  account type, flows (employer, relief, transfer, isaTransfer, withdrawal), income, pay, P60, goals, child `demo_kid` with a JISA,
  fixed seed. Demo always starts fresh and is never saved: first-run "Try the demo" and the PIN screen's `lock-demo` call `startDemo`
  (from setup with `{name,dob}`; exit returns to setup); from the PIN screen your data stays locked and Exit asks for the PIN.
  New first runs no longer save example data (`example: true` only remains for old saves; `clearExample` still handles it).

- 2.0.2: `chartScope(accts)` = accounts feeding the net worth card / `wealthSources` (selected person's accounts with a balance, closed
  included) and `out` (other people's, no balance yet, with reason). `scopeList()` renders `details#ws-scope` (fold `ws-scope`) under the
  panel head; the card's "Includes N of M accounts" link (`scope-open`) opens and scrolls to it.
  Tick boxes (`data-scope`) set device-only `ui.chartOut` {id:true} (`chartOff(a)`): renderOverview splits `all` (Holdings, ISA allowance,
  activity) from `accts` (card, KPIs, wealth sources, Performance, Allocation, monthly bars). The last included account can't be unticked.

- 2.0.3: goals may carry `accounts: [ids]` (scope `'pick'`), which `goalAccounts()` prefers; `goalScopeName(g)`; `goalPicker(g)` in
  Planner's goal list (`data-goal-acct` boxes, fold `goal-<id>`) and `#goal-picks` in the goal form. Removing an account drops it from
  goals (and goals left empty). FAQ `pick`.

- 2.0.5 Planner: `PLAN_PAGES` sections ('plan'|'goals'|'calc', `ui.planPage`, `.page-seg`; `data-tab="planner" data-page="goals"` links open one).
  Retirement = `#plan-results` (filled by `updatePlan`: headline pot, `plan-real` Today's money/Future pounds pills, `path-stops` milestones,
  one chart of history + projection + range + paid in, `ui.pathSpan`, split tiles, notes, one disclaimer) then fold `plan-set`
  ("Adjust your plan", `#plan-sum` = `planSummary()`): sliders in `.plan-form`, ticked accounts in `#plan-accts`, unticked under
  `details.plan-more`. `wealthPath()`/`#path-panel` are gone. Goals: `#goal-sheet` (`openGoal()`, fields built on open, `goal-add`/`goal-for`);
  `goalPicker(g, st)`'s summary is the goal's meta line (accounts, date, status).

- 2.0.6 Insights: `INSIGHT_PAGES` ('now'|'year'|'tax', `ui.insightPage`, `insight-page` action, `.page-seg`; hidden unless `ui.person==='me'`).
  Summary = "What changed" panel (`.ins-grid` tiles, tips with `.ins-go` link buttons, fold `ins-acct` table), `reviewFold()` (fold
  `month-review`; `reviewCard` and it share `reviewBody`), milestones as `.ms-chip`. Tax year = allowances, `yearsPanel` (fold `ins-years`),
  `reviewPanel`. Tax return = `taxPanel`. Bell `note-go` acts take `page`; `data-tab="insights" data-page=…` links open a page.

- 2.0.7: `reviewPanel()` keeps its year buttons when the year has no balances (empty state; it used to return '' and the buttons
  vanished). `monthReview(key)` takes 'YYYY-MM' (default last month = `reviewMonths(0)[0]`); `reviewMonths()` lists last month back to
  the first balance's month; `reviewPicker(r)` (‹ › `review-month` + `#review-month` select) sits in the Insights fold only; the pick
  is `reviewPick` (not saved). Older months: `streakOf(a, ym)` counts back from that month, goals left out.
  2.0.11: the picker is a `.month-strip` of month tiles (first balance's month to this month, which is disabled; green/red mark = that
  month's change) plus `.month-row` with a Latest button off the latest month; `placeMonthStrip()` (after render) glides from `stripFrom`.

- 2.0.8: Insights/Planner section switches are `pageTabs(label, action, pages, cur, extra)` (`nav.ptabs`, icons in `PAGE_ICONS`, open
  page `aria-current="page"`): boxed icon tiles, sticky under the phone header (`--ptabs-top` set by `placePageTabs()` on render/scroll/resize);
  2.0.9: icon beside label (one row, 40px); `.ptabs.stuck` only trims padding and `body.tabs-stuck` drops the header shadow. Use it for any new page with sections.

- 2.0.10 Planner inputs + result: Retirement is `#plan-panel` (`.calc-grid` like SIPP vs ISA): "1 Your inputs" (sliders, then
  `details#plan-acct-fold` fold `plan-accts`, closed line `planAcctLine()`), "2 Result" = `#plan-results` (`updatePlan(changed)`: `.calc-echo`
  of the assumptions, then pot, pills, stops, chart, tiles, notes). `plan-set`/`planSummary` are gone. Goals use `goalCards()` (Planner only;
  `goalList()` is Overview's compact list): inputs `data-goal-target`/`data-goal-date` save to the goal, `data-goal-mon` is a device-only
  what-if in `ui.goalMon` (`goalMon(g)`, reset `goal-mon-reset`); `goalStatus(g, mon)` also returns `usual`, `eta` (`monthsToReach`);
  `goalResult()` = echo + bars with a dashed `.cb-target` marker + verdict; `refreshGoal(id)` updates in place. Each card is
  `details.fold2.goal-fold` (fold `goal-c<id>`, open by default only when there is one goal) with `goalSum()` (ring, amounts, status) as its closed line.

- 2.0.12 Overview tidy: `reviewLine(r)` (slim `.visit.review-line`, `review-open` opens Insights with fold `month-review`) replaces the card;
  `.kpis` two across on phones; Holdings groups are `tbody.hg` (`hold-grp` toggles `.open`, saved as fold `hold-<group>`, `holdOpen(g)`
  defaults open only ≥1000px); `wealthSources` folds its table and movers (fold `ws-more`); Performance is `perfPanel(accts)`/`drawPerf(accts, tl)`
  inside the All accounts card (no longer on Overview); activity 3 rows (`hist-all` opens All accounts history); `goalList()` = `goalSum` rows.

- 2.0.13 colour palettes: `PALETTES` [key,name,bg,accent,c1..c6 names], `applyPalette(k)` sets `data-pal` (none for gold), the
  theme-color meta and the account swatch labels; device-only `aurum_palette`; picker `.pal-pick` (`name="palette"`) in Settings
  Appearance. Gold tints use `rgba(var(--gold-rgb),a)`; new colours must come from tokens so every palette follows. Lock screen stays fixed dark gold.

- 2.0.14 card titles: `h2.tt` = bold 16px title with a gold icon tile `ti(key)` (`.t-ic`, paths in `TITLE_ICONS`, falls back to `SET_ICONS`).
  `foldOpen` picks its icon from `FOLD_ICONS[key]`. Give every new card title `class="tt"` and `${ti('…')}`. `.kpi .k` labels are gold.

## Status (latest)

- 1.9.9 merged to main (PR #23); owner publishes the v1.9.9 release. Owner says when to merge.
  Next planned work is 2.0 in `ROADMAP.md` (polish, charts, wealth insights); 2.x Future Me, 3.0 DB/State Pension/property/debts, 4.0 tax helper.
- Ideas discussed but parked: savings counted payday to payday (ROADMAP "Later"). When a new feature needs explaining, add an
  `FAQ` entry and, if it's a common question, a `why()` button next to it.
- Helper mode ("?" explainer bubbles) is in ROADMAP "Later" — owner said not for now; don't build until asked.
