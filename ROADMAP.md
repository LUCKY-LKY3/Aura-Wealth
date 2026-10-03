# Aurum roadmap

Agreed with the owner. Nothing here is built until the owner says "go" for that version.

## Shipped
- 1.9.0 notification bell · 1.9.1 motion and feel · 1.9.2 monthly review, streaks, encrypted backup, backup health,
  auto-lock timer, drag/pin accounts, long-press quick actions, polish · 1.9.3 welcome-back strip, quick dates,
  Insights rename, still tab bar, grouped reorder, password confirm, export fix + Save to phone ·
  1.9.4 new lock screen + keypad, unlock animation, PIN lockout, wrong-password feedback, splash restyle, demo mode ·
  1.9.5 Income tab: income sources, pay log (net first, payslip optional), savings rate (total, typical without one-offs,
  including work pension), where it went, payday/pay-change/best-rate notifications, P60 fill from payslips ·
  1.9.6 split a mid-year first balance (5 April balance + monthly payments), "moved from savings" and ISA transfer flags,
  payslip breakdown, missing-pay reminder · 1.9.7 Help and FAQ (Settings, bell, "Why?" links), still to come this month,
  income share by source, one-offs this year, same-months year on year, balance-jump prompt, copy last payslip

## 1.9.8 (built, not yet released)
- Interface tidy-ups: Overview folds for Allocation and the monthly chart, chart subtitles, fade on scrolling ranges,
  fewer font sizes, larger tap targets, 12px minimum text (owner checked buttons on the phone)
- Account colour picker (six swatches in Add/Edit account)
- Notes on charts: gold ring on the account chart for balances with a note; the note shows in the readout
- Overview strip: saved so far this month, next to last month's savings rate
- Net worth card: 30-day change with growth (not a total-change %), all-time paid in vs growth, "balances over a month old"
  link to Update all, drag the trend to see past totals, smaller corner ring on phones, allocation bar only with 2+ groups

## Later
- Privacy screen: blank Aurum card in Android recent apps, optional block on screenshots (Settings switch)
- Savings counted payday to payday: optional Income setting so the savings rate follows pay periods, not calendar months

## 2.0 (next)
- Net worth card range chips (1M · 1Y · All) setting both the change line and the trend (trend now shows the last 24 points)
- Tax return helper upgrade: build the engine + 25 test cases in `docs/tax-helper-spec.md` (dividend/savings stacking,
  starting rate for savings, PSA, CGT 18%/24% with losses and AEA, HMRC box numbers, required UI wording); keep the
  existing P60/Gift Aid/marriage allowance/HICBC features and show refunds as well as tax to pay
- Estimated interest for the tax helper: for taxable cash accounts (not Cash ISA/LISA, not Premium Bonds, not investments),
  use logged interest where there is some, otherwise balance growth in the tax year, marked "estimated from balances" with a
  "Log as interest" button; Personal Savings Allowance meter by band (£1,000 / £500 / £0); flag growth far above the account's
  advertised rate as a probably unlogged payment rather than interest
- State Pension, debts, property
- Income follow-ups: household / partner income (owner per source), goal dates from current savings rate
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
- Small: "since last visit" strip on Overview; duplicate last entry;
  quick date chips in Log value (Today, 1st, 5 April); account icon picker
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
- Helper mode: a Settings switch that adds small "?" bubbles next to sections and figures (net worth, paid in vs
  growth, savings rate, allowances, planner, tax helper…); tapping one pops up a short plain-English explanation of what
  it means and how it's worked out. Off by default, can dismiss each tip, and a first-time hint offers to turn it on

## Parked / not wanted
- Search, home-screen shortcuts, larger text option, Scottish tax rates, live data, "advice" features
- Fees impact — suggested, not yet chosen
