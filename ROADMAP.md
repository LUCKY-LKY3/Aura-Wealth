# Aurum roadmap

Agreed with the owner. Nothing here is built until the owner says "go" for that version.

## Shipped
- 1.9.0 notification bell · 1.9.1 motion and feel · 1.9.2 monthly review, streaks, encrypted backup, backup health,
  auto-lock timer, drag/pin accounts, long-press quick actions, polish · 1.9.3 welcome-back strip, quick dates,
  Insights rename, still tab bar, grouped reorder, password confirm, export fix + Save to phone

## 1.9.4 (next)
- Wrong password feedback: a clear red "Incorrect password" right under the password box (with a small shake and buzz)
  when changing or turning off the backup password, unlocking an encrypted backup, and on the PIN lock screen
- New lock screen (mock-up A): gold glow behind a large gradient coin, spaced "AURUM" + "Your wealth, privately",
  PIN dots that fill gold (shake and turn red on a wrong PIN), round gold-outlined keypad with Forgot and ⌫,
  "Use fingerprint" below; optionally a "Good evening, Sam" greeting
- Unlock animation: the coin shrinks up into the header and the app fades in (~0.5s)
- Too many wrong PINs: after 5, wait 30 seconds, doubling after each further miss
- Keypad feel: light buzz + gold ripple per key, one firm buzz on a correct PIN
- Splash screen restyled to match the new lock screen (gold glow + coin, lined up so it flows into the lock screen)
- Demo mode: Settings switch / bell-area shortcut swaps in example data in memory only;
  real data untouched, nothing saved, backups/reminders/notifications paused; gold "Demo mode · Exit" bar;
  exiting asks for the PIN if one is set

## 2.0
- State Pension, debts, property
- Savings rate: % of income put away each month (user enters income) — locked in by owner
- Growth attribution: which accounts drove this year's growth
- Cash drag warning: lots of cash in a low-interest account (user enters rate)
- Interest checker: savings rate vs a benchmark rate the user sets

## 3.x
- Two-column layout for the unfolded foldable screen
- Everything pension-related: tax-free cash tracker (25%, Lump Sum Allowance £268,275), salary sacrifice vs
  relief at source, drawdown, defined benefit / NHS pensions

## Live prices (version to decide)
- Holdings with live prices: enter ticker + quantity, app fetches price on-device (only the ticker leaves the phone)
  - Crypto first via CoinGecko (free, no key); read-only crypto wallet balances from public addresses (never private keys)
  - Stocks/ETFs later once a price source is chosen (free tiers have limits; UK OEIC funds patchy)
  - Not planned: broker/Open Banking linking (needs paid, FCA-regulated partner and servers)

## Ideas to decide on (suggested, not yet chosen)
- Small: notes on balances shown on charts; "since last visit" strip on Overview; duplicate last entry;
  quick date chips in Log value (Today, 1st, 5 April); account colour and icon picker
- 2.x: emergency fund in months (enter monthly outgoings); goal buckets (split an account across goals);
  future events (expected lump sums/costs in the planner); today's-money switch everywhere;
  custom account types; printable one-page PDF net-worth report
- 3.x+: couple mode (shared via backup file); estate summary for family; documents vault;
  home-screen widget; Wear OS tile; shareable year-in-review each April

## Monetisation (after 2.0 — owner to decide)
- Plan: free core + one-off "Aurum Pro" unlock (~£5–£15) via Google Play; optional tip jar on the website
- Pro candidates: encrypted backup, monthly review, tax helper, future pension tools (3.x)
- Steps: Google Play developer account ($25), Play Billing in the app (on-device licence check, no servers),
  privacy policy + terms, keep "illustration, not advice" wording, decide on repo privacy/licence first,
  accountant for UK tax on income. Website stays free (or becomes a demo)
- Avoid: adverts (tracking, off-brand), selling data (we never have it), affiliate links to platforms
  (FCA financial promotion risk; conflicts with "no advice")

## Later (not scheduled)
- Privacy screen: blank Aurum card in Android recent apps; blocks screenshots (with a Settings switch)

## Parked / not wanted
- Search, home-screen shortcuts, larger text option, Scottish tax rates, live data, "advice" features
- Fees impact — suggested, not yet chosen
