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
  income share by source, one-offs this year, same-months year on year, balance-jump prompt, copy last payslip ·
  1.9.8 tidy-ups, account colour picker, notes on charts, saved this month, net worth card upgrades ·
  1.9.9 interest/dividends/prizes add to the balance, History notes on a line under each entry, FAQ in sections with search

## Later
- Two-column layout for the unfolded foldable screen
- Privacy screen: blank Aurum card in Android recent apps, optional block on screenshots (Settings switch)
- Savings counted payday to payday: optional Income setting so the savings rate follows pay periods, not calendar months

## Direction (owner, 4 Oct 2026)
Aurum is a personal wealth simulator, not just a net-worth tracker: show where wealth is, where it is going, and why.
Order: 2.0 polish and charts → 2.x Future Me → 3.0 pensions, property and debts → 4.0 tax.

## 2.0 (next): polish, charts and wealth insights
- Net worth card range chips (1M · 1Y · All) setting both the change line and the trend (trend now shows the last 24 points)
- "Where your wealth came from" for the chosen range: paid in vs growth, split by group (pensions, ISAs, investments,
  cash), with property and debt reduction joining once they exist (3.0)
- Growth attribution: which accounts drove this year's growth
- Actual vs projected wealth chart: history so far, then the planner's projection (today, 5, 10, 20 years, retirement)
- Chart polish across the app (one consistent look, readouts, ranges)
- Cash drag warning: lots of cash in a low-interest account (user enters rate)
- Interest checker: savings rate vs a benchmark rate the user sets
- Income follow-ups: household / partner income (owner per source), goal dates from current savings rate

## 2.x: Future Me and "what your saving means" (owner idea)
Turns the planner into a simulator from the user's own data (planner growth, inflation, retirement age, goals, pay).
Always in today's money and marked "illustration, not advice".
- Headline: "On your current path, about £X by 60" on Overview / Planner
- What-if scenarios, each showing the change at retirement, goal dates and the earliest age you could stop: invest £X more
  a month, retire N years earlier, raise pension contribution by N%, growth 5% instead of 7% (later: pay the mortgage off
  earlier, once debts exist)
- Extra this month: when a month beats your usual saving, "£150 more than usual → about £1,900 at 60 in today's money"
- Time bought: extra saved as days of your own take-home pay ("that £500 = 6 days of work"), or as retirement time
  ("this year's saving funds about 7 months of retirement at your planned income")
- Goals pulled closer: "your extra £200 brings House deposit forward 3 weeks"
- Your own units: set personal yardsticks (a holiday = £2,000, a month's rent = £1,200); "growth this year paid for 1.5 holidays"
- Growth as wages: "your money earned £3,200 this year, like 9 extra days at work" (hourly from logged pay)
- Gentle flip side (off by default): a lighter month shows what it costs at retirement, without nagging

## 3.0: pensions, property and debts ("Financial wealth")
- Defined benefit pensions:
  - Record each DB pension as yearly income (scheme name, owner, expected £/yr in today's money, scheme pension age), kept out
    of the accounts ledger: no balances, no money in, no growth, not in allowances
  - Estimated value = yearly income × multiplier, default 20× ("balanced estimate"); choices 16× conservative, 20× balanced,
    25× income replacement, or custom
  - Optional actual CETV from the scheme (with its date) overrides the multiplier and is marked "CETV"
  - Shown separately: Net worth (accounts) + "Pension wealth (estimated)" = Total financial wealth; each DB row shows
    "Based on 20× yearly pension" or "CETV dated …"
  - Wording: an illustrative capital-equivalent estimate, never "HMRC valuation" or "actual value"; FAQ entry + why() button
    explaining CETV and that the real value depends on the scheme's benefits
  - Suggested with it: planner adds DB income from the scheme pension age alongside the pot's drawdown income; optional
    automatic lump sum (e.g. NHS 1995 section) added to the value; shares the "yearly income from an age" model with State Pension
- State Pension: yearly amount (from the user's forecast) from State Pension age, same "yearly income from an age" model
  as DB; in the planner, and optionally in pension wealth
- Property and debts: home/property values and liabilities (mortgage, loans, cards), so net worth = assets − liabilities
  and debt reduction shows in "where your wealth came from"
- Workplace DC pensions shown properly (employer vs own contributions, salary sacrifice vs relief at source)
- Tax-free cash tracker (25%, Lump Sum Allowance £268,275), drawdown

## 4.0: tax helper ("Aurum Tax", likely the Pro feature)
- Tax return helper upgrade: build the engine + 25 test cases in `docs/tax-helper-spec.md` (dividend/savings stacking,
  starting rate for savings, PSA, CGT 18%/24% with losses and AEA, HMRC box numbers, required UI wording); keep the
  existing P60/Gift Aid/marriage allowance/HICBC features and show refunds as well as tax to pay
- Estimated interest for the tax helper: for taxable cash accounts (not Cash ISA/LISA, not Premium Bonds, not investments),
  use logged interest where there is some, otherwise balance growth in the tax year, marked "estimated from balances" with a
  "Log as interest" button; Personal Savings Allowance meter by band (£1,000 / £500 / £0); flag growth far above the account's
  advertised rate as a probably unlogged payment rather than interest
- Personal allowance taper (£100k–£125,140) shown clearly
- Tax what-ifs: "what if I pay another £5k into my pension?", "what if I realise these gains next tax year?"

## Live prices (version to decide)
- Holdings with live prices: enter ticker + quantity, app fetches price on-device (only the ticker leaves the phone)
  - Crypto first via CoinGecko (free, no key); read-only crypto wallet balances from public addresses (never private keys)
  - Stocks/ETFs later once a price source is chosen (free tiers have limits; UK OEIC funds patchy)
  - Not planned: broker/Open Banking linking (needs paid, FCA-regulated partner and servers)

## Ideas to decide on (suggested, not yet chosen)
- Small: "since last visit" strip on Overview; duplicate last entry;
  quick date chips in Log value (Today, 1st, 5 April); account icon picker
- Insights extras: emergency fund in months (enter monthly outgoings); goal buckets (split an account across goals);
  future events (expected lump sums/costs in the planner, fits Future Me); today's-money switch everywhere;
  custom account types; printable one-page PDF net-worth report
- 3.x+: couple mode (shared via backup file); estate summary for family; documents vault;
  home-screen widget; Wear OS tile; shareable year-in-review each April

## Monetisation (owner to decide; tax helper is now 4.0)
- Plan: free core + one-off "Aurum Pro" unlock (~£5–£15) via Google Play; optional tip jar on the website
- Pro candidates: encrypted backup, monthly review, Future Me scenarios (2.x), pension tools (3.0), tax helper (4.0)
- Steps: Google Play developer account ($25), Play Billing in the app (on-device licence check, no servers),
  privacy policy + terms, keep "illustration, not advice" wording, decide on repo privacy/licence first,
  accountant for UK tax on income. Website stays free (or becomes a demo)
- While testing (before billing): every possibly-paid feature goes behind one `isPro()` check that returns true for
  everyone; a hidden developer switch (e.g. tap the version in Settings 7 times) previews the free view. Charging later
  only changes `isPro()`
- When billing lands: test purchases with Play Console licence testers (real flow, no charge)
- Limits: with a public repo and no server, a technical user can switch Pro on from source; Play Billing stops casual APK
  copying only. Decide repo privacy before charging. Play Billing is Android-only, so the website stays free or is a demo
- Avoid: adverts (tracking, off-brand), selling data (we never have it), affiliate links to platforms
  (FCA financial promotion risk; conflicts with "no advice")

## Later (not scheduled)
- Helper mode: a Settings switch that adds small "?" bubbles next to sections and figures (net worth, paid in vs
  growth, savings rate, allowances, planner, tax helper…); tapping one pops up a short plain-English explanation of what
  it means and how it's worked out. Off by default, can dismiss each tip, and a first-time hint offers to turn it on

## Parked / not wanted
- Search, home-screen shortcuts, larger text option, Scottish tax rates, live data, "advice" features
- Fees impact — suggested, not yet chosen
