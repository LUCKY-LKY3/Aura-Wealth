# Tax return helper — engine spec (from owner, drafted with ChatGPT/Gemini)

Status: saved for a future release, not built. See "Implementation notes" at the end before building.

## Scope
England (rest-of-UK rates, which also apply in Wales/NI), tax years 2025-26 and 2026-27. Inputs: gross salary, PAYE
deducted, untaxed UK interest, UK dividends, relief-at-source pension (net), CGT disposals count, proceeds, allowable
costs, losses in year. Outputs: estimated adjusted net income, personal allowance, taxable income by type, income tax,
CGT, total, tax already paid, estimated additional tax due, a breakdown and HMRC box mappings.

## Engine (reference TypeScript, as supplied)

```typescript
export type TaxYear = '2025-26' | '2026-27';
export type Jurisdiction = 'England';

export interface TaxInputData {
  taxYear: TaxYear; jurisdiction: Jurisdiction;
  salaryGross: number; payeTaxDeducted: number; untaxedUKInterest: number; UKDividends: number;
  reliefAtSourcePensionNet: number; cgtDisposalsCount: number; cgtProceeds: number;
  cgtAllowableCosts: number; cgtLossesInYear: number;
}

const BANDS = { PERSONAL_ALLOWANCE: 12570, BASIC_LIMIT: 37700, HIGHER_LIMIT_TOTAL: 125140 };
const TAX_CONFIG = {
  '2025-26': { divBasic: 0.0875, divHigher: 0.3375, divAdd: 0.3935, cgtBasic: 0.18, cgtHigher: 0.24, cgtAEA: 3000 },
  '2026-27': { divBasic: 0.1075, divHigher: 0.3575, divAdd: 0.3935, cgtBasic: 0.18, cgtHigher: 0.24, cgtAEA: 3000 }
};

export function calculateUKTax(input: TaxInputData) {
  const config = TAX_CONFIG[input.taxYear];
  const grossPension = input.reliefAtSourcePensionNet * 1.25;
  const totalGrossIncome = input.salaryGross + input.untaxedUKInterest + input.UKDividends;
  const ani = Math.max(0, totalGrossIncome - grossPension);
  let personalAllowance = BANDS.PERSONAL_ALLOWANCE;
  if (ani > 100000) personalAllowance = Math.max(0, BANDS.PERSONAL_ALLOWANCE - Math.ceil((ani - 100000) / 2));
  const basicLimit = BANDS.BASIC_LIMIT + grossPension;
  const higherLimit = Math.max(basicLimit, (BANDS.HIGHER_LIMIT_TOTAL + grossPension) - personalAllowance);

  // Personal allowance used against salary, then savings, then dividends.
  let remainingPA = personalAllowance;
  const taxableSalary = Math.max(0, input.salaryGross - remainingPA);
  remainingPA = Math.max(0, remainingPA - input.salaryGross);
  const taxableSavings = Math.max(0, input.untaxedUKInterest - remainingPA);
  remainingPA = Math.max(0, remainingPA - input.untaxedUKInterest);
  const taxableDividends = Math.max(0, input.UKDividends - remainingPA);
  const totalTaxableIncome = taxableSalary + taxableSavings + taxableDividends;

  let acc = 0, incomeTax = 0;
  const breakdown = { startingRateForSavingsUsed: 0, personalSavingsAllowanceUsed: 0, dividendAllowanceUsed: 0,
    taxableSavingsAtBasicRate: 0, taxableSavingsAtHigherRate: 0, taxableSavingsAtAdditionalRate: 0,
    taxableDividendsAtBasicRate: 0, taxableDividendsAtHigherRate: 0, taxableDividendsAtAdditionalRate: 0 };
  function allocateBand(amount) {
    const basicAmount = Math.max(0, Math.min(amount, basicLimit - acc));
    const higherAmount = Math.max(0, Math.min(amount - basicAmount, higherLimit - acc - basicAmount));
    const additionalAmount = Math.max(0, amount - basicAmount - higherAmount);
    return { basicAmount, higherAmount, additionalAmount };
  }
  // Stacking order: non-savings, then savings, then dividends. 0% slices still use up band.
  if (taxableSalary > 0) {
    const b = allocateBand(taxableSalary);
    incomeTax += b.basicAmount * 0.20 + b.higherAmount * 0.40 + b.additionalAmount * 0.45;
    acc += taxableSalary;
  }
  if (taxableSavings > 0) {
    breakdown.startingRateForSavingsUsed = Math.min(taxableSavings, Math.max(0, 5000 - taxableSalary));
    let psa = 0;
    if (totalTaxableIncome <= basicLimit) psa = 1000; else if (totalTaxableIncome <= higherLimit) psa = 500;
    breakdown.personalSavingsAllowanceUsed = Math.min(taxableSavings - breakdown.startingRateForSavingsUsed, psa);
    const full = taxableSavings - breakdown.startingRateForSavingsUsed - breakdown.personalSavingsAllowanceUsed;
    acc += breakdown.startingRateForSavingsUsed + breakdown.personalSavingsAllowanceUsed;
    const b = allocateBand(full);
    breakdown.taxableSavingsAtBasicRate = b.basicAmount; breakdown.taxableSavingsAtHigherRate = b.higherAmount;
    breakdown.taxableSavingsAtAdditionalRate = b.additionalAmount;
    incomeTax += b.basicAmount * 0.20 + b.higherAmount * 0.40 + b.additionalAmount * 0.45;
    acc += full;
  }
  if (taxableDividends > 0) {
    breakdown.dividendAllowanceUsed = Math.min(taxableDividends, 500);
    const full = taxableDividends - breakdown.dividendAllowanceUsed;
    acc += breakdown.dividendAllowanceUsed;
    const b = allocateBand(full);
    breakdown.taxableDividendsAtBasicRate = b.basicAmount; breakdown.taxableDividendsAtHigherRate = b.higherAmount;
    breakdown.taxableDividendsAtAdditionalRate = b.additionalAmount;
    incomeTax += b.basicAmount * config.divBasic + b.higherAmount * config.divHigher + b.additionalAmount * config.divAdd;
    acc += full;
  }
  const gainsBeforeLosses = Math.max(0, input.cgtProceeds - input.cgtAllowableCosts);
  const netGains = Math.max(0, gainsBeforeLosses - input.cgtLossesInYear);
  const taxableGains = Math.max(0, netGains - config.cgtAEA);
  let cgt = 0;
  if (taxableGains > 0) {
    const unusedBasic = Math.max(0, basicLimit - acc);
    const at18 = Math.min(taxableGains, unusedBasic);
    cgt = at18 * config.cgtBasic + (taxableGains - at18) * config.cgtHigher;
  }
  const total = incomeTax + cgt;
  return {
    estimatedAdjustedNetIncome: ani, personalAllowance,
    taxableNonSavingsIncome: taxableSalary, taxableSavingsIncome: taxableSavings, taxableDividendIncome: taxableDividends,
    incomeTaxLiability: incomeTax, capitalGainsTaxLiability: cgt, totalTaxLiability: total,
    taxAlreadyPaid: input.payeTaxDeducted, estimatedAdditionalTaxDue: Math.max(0, total - input.payeTaxDeducted),
    breakdown,
    hmrcBoxes: {
      SA102: { box1: input.salaryGross, box2: input.payeTaxDeducted },
      SA100_TR3: { box2: input.untaxedUKInterest, box4: input.UKDividends },
      SA100_TR4: { box1: grossPension },
      SA108: { box23: input.cgtDisposalsCount, box24: input.cgtProceeds, box25: input.cgtAllowableCosts,
               box26: gainsBeforeLosses, box27: input.cgtLossesInYear }
    }
  };
}
```

## UI wording (required)
- Adjusted Net Income: label "Estimated Adjusted Net Income based on the income sources entered." Not a full SA ANI calculation.
- CGT: label "Estimated Capital Gains Tax", sub-text exactly: "This is an estimate based on the proceeds, allowable costs
  and losses you entered. Complex share matching, Section 104 pooling and historic losses are not currently calculated."

## HMRC box mappings
- SA102 Box 1: Pay from this employment · Box 2: UK tax taken off pay
- SA100 TR3 Box 2: Untaxed UK interest · Box 4: UK dividends
- SA100 TR4 Box 1: Payments to registered pension schemes (gross)
- SA108 Box 23: Number of disposals · 24: Disposal proceeds · 25: Allowable costs · 26: Gains before losses · 27: Losses in the year

## Test cases (2026-27 rates) — all must pass
| # | Inputs | Expected |
|---|---|---|
| 1 | Salary £10k | Tax £0 |
| 2 | Salary £30k | £3,486.00 |
| 3 | Salary £60k | £11,432.00 |
| 4 | Salary £100k | PA £12,570, taxable £87,430, tax £27,432.00 |
| 5 | Salary £100,001 | PA £12,569, taxable £87,432, tax £27,432.80 |
| 6 | Salary £125,140 | PA £0, taxable £125,140, tax £42,516.00 |
| 7 | Salary £150k | PA £0, taxable £150,000, tax £53,703.00 |
| 8 | Salary £10k, interest £4k | £0 (starting rate for savings) |
| 9 | Salary £15k, interest £4k | £572.00 (£486 + £86) |
| 10 | Salary £17,570, interest £1k | £1,000.00 (PSA covers interest) |
| 11 | Salary £60k, interest £1k | £11,632.00 (PSA £500, 40% on £500) |
| 12 | Salary £150k, interest £1k | £54,153.00 (no PSA, 45% on £1k) |
| 13 | Salary £30k, dividends £500 | £3,486.00 |
| 14 | Salary £30k, dividends £1.5k | £3,593.50 |
| 15 | Salary £60k, dividends £1.5k | £11,789.50 |
| 16 | Salary £150k, dividends £1.5k | £54,096.50 |
| 17 | Salary £50k, SIPP gross £10k | £7,486.00 (basic limit £47,700) |
| 18 | Salary £60k, SIPP gross £10k | £9,486.00 |
| 19 | Salary £100k, SIPP gross £20k | £23,432.00 (ANI £80k, basic limit £57,700) |
| 20 | Salary £45k, gain £13k | Income tax £6,486.00, CGT £2,083.80, total £8,569.80 |
| 21 | Salary £30k, gain £13k | £3,486.00 + CGT £1,800.00 = £5,286.00 |
| 22 | Salary £60k, gain £13k | £11,432.00 + CGT £2,400.00 = £13,832.00 |
| 23 | Salary £50k, dividends £1k | £7,664.75 |
| 24 | Proceeds £20k, cost £5k, loss £5k | Box 26 £15k, Box 27 £5k, taxable gain £7k |
| 25 | Salary £45k, gain £13k, SIPP gross £5k | £6,486.00 + CGT £1,800.00 = £8,286.00 |

## Implementation notes (Claude, before building)
- Aurum has no TypeScript or Jest (single-file vanilla JS, no bundler). Port the engine to plain JS inside
  `src/app.html` with the same logic, constants and names, and run the 25 cases with Node's built-in test runner
  (`node --test`), extracting the engine the same way the syntax check does. No behaviour change from the spec.
- Hand-checked: all 25 expected results match the engine's arithmetic.
- The existing tax helper already does more than this spec (P60 refund estimate, second job, Gift Aid, marriage
  allowance, High Income Child Benefit Charge, work expenses). Plan: add this engine for dividends/savings stacking,
  CGT and HMRC box numbers, and keep those existing features rather than dropping them. Owner to confirm.
- `estimatedAdditionalTaxDue` is floored at £0, so refunds would not show; the current helper shows refunds. Suggest
  showing a signed figure ("refund due" / "to pay"). Owner to confirm.
- Things to double-check against HMRC before release (not changed without owner agreement):
  - Personal allowance taper rounding (`Math.ceil`) — affects results by under £1.
  - SA108 box numbers for 2025-26 onward (the form layout has changed between years).
  - Gift Aid also extends the basic band, like pension contributions; the spec doesn't include it.
