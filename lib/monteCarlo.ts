import { RETURNS_DATA } from "./historicalReturns";

const INFLATION_RATE = 0.02; // Baked-in 2% annual inflation
const CASH_RETURN = 0.02;    // Fixed nominal return for cash (~0% real)
const BLOCK_SIZE = 5;        // Block bootstrap: sample 5 consecutive historical years at a time

// ── Simulation method ───────────────────────────────────────────────────────
export type SimMethod = "block5" | "fat-tailed" | "cape";

// Precomputed historical stats for parametric methods
const _n = RETURNS_DATA.length;
const _meanS = RETURNS_DATA.reduce((a, d) => a + d.stocks, 0) / _n;
const _meanB = RETURNS_DATA.reduce((a, d) => a + d.bonds,  0) / _n;
const _stdS  = Math.sqrt(RETURNS_DATA.reduce((a, d) => a + (d.stocks - _meanS) ** 2, 0) / _n);
const _stdB  = Math.sqrt(RETURNS_DATA.reduce((a, d) => a + (d.bonds  - _meanB) ** 2, 0) / _n);

// CAPE-adjusted constants (Shiller CAPE as of early 2026)
const CURRENT_CAPE = 36;
const REAL_EARNINGS_GROWTH = 0.015;
const CAPE_IMPLIED_NOMINAL = 1 / CURRENT_CAPE + INFLATION_RATE + REAL_EARNINGS_GROWTH;
const CAPE_ADJUSTMENT = CAPE_IMPLIED_NOMINAL - _meanS; // negative: reduces each year's stock return

// Box-Muller standard normal sample
function randn(): number {
  const u = 1 - Math.random(), v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// Student's t sample with given degrees of freedom (heavier tails than normal)
function studentT(df: number): number {
  const z = randn();
  let chi2 = 0;
  for (let i = 0; i < df; i++) { const n = randn(); chi2 += n * n; }
  return z / Math.sqrt(chi2 / df);
}

export interface SimulationInputs {
  currentAge: number;
  retirementAge: number;
  lifeExpectancy: number;
  currentPortfolio: number;
  annualSavings: number;
  annualRetirementSpend: number;
  stockPct: number;
  bondPct: number;
  cashPct: number;
  socialSecurityMonthly: number; // monthly SS benefit (fixed nominal)
  bridgeIncome: number;          // annual part-time income in early retirement
  bridgeUntilAge: number;        // age bridge income stops
  useGlidePath: boolean;         // gradually shift to conservative allocation
  // Tax modeling (all default 0 = opt-in, no behavior change when off)
  traditionalAmt: number;        // dollar amount in traditional 401k/IRA (taxed as ordinary income)
  rothAmt: number;               // dollar amount in Roth (tax-free withdrawals)
  taxableAmt: number;            // dollar amount in taxable brokerage (gains taxed at LTCG rate)
  ordinaryTaxRate: number;       // effective ordinary income tax rate in retirement
  ltcgRate: number;              // long-term capital gains tax rate
  gainFraction: number;          // fraction of taxable brokerage that is unrealized gains
}

export interface YearlyPercentiles {
  age: number;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
}

export interface SimulationResult {
  successRate: number;
  percentiles: YearlyPercentiles[];
  medianAtRetirement: number;
  medianAtEnd: number;
  p10AtEnd: number;
  p90AtEnd: number;
  failureYear: number | null;
  failureAges: number[]; // age at failure for each failed simulation
  annualTaxCostAtRetirement: number; // estimated first-year tax drag (0 when tax modeling off)
}

function glidedAlloc(
  year: number,
  totalYears: number,
  normS: number, normB: number, normC: number
): [number, number, number] {
  const t = Math.min(1, year / totalYears);
  return [
    normS * (1 - t) + 0.20 * t,
    normB * (1 - t) + 0.60 * t,
    normC * (1 - t) + 0.20 * t,
  ];
}

function percentile(sorted: number[], p: number): number {
  const idx = Math.floor((p / 100) * (sorted.length - 1));
  return sorted[idx];
}

export function runSimulation(
  inputs: SimulationInputs,
  numSimulations = 1000,
  method: SimMethod = "block5"
): SimulationResult {
  const {
    currentAge, retirementAge, lifeExpectancy,
    currentPortfolio, annualSavings, annualRetirementSpend,
    stockPct, bondPct, cashPct,
    socialSecurityMonthly, bridgeIncome, bridgeUntilAge,
    useGlidePath,
    traditionalAmt, rothAmt, taxableAmt,
    ordinaryTaxRate, ltcgRate, gainFraction,
  } = inputs;

  const ssAnnual = socialSecurityMonthly * 12;

  // Tax gross-up factor: how much extra must be withdrawn per $1 of desired net spend
  // Fractions derived from dollar amounts entered by user
  const taxAcctTotal = traditionalAmt + rothAmt + taxableAmt;
  const taxGrossFactor = taxAcctTotal > 0
    ? ((traditionalAmt / taxAcctTotal) / (1 - ordinaryTaxRate))
      + (rothAmt / taxAcctTotal)
      + ((taxableAmt / taxAcctTotal) / (1 - gainFraction * ltcgRate))
    : 1;

  // Normalize allocation
  const allocTotal = stockPct + bondPct + cashPct;
  const normS = allocTotal > 0 ? stockPct / allocTotal : 1 / 3;
  const normB = allocTotal > 0 ? bondPct  / allocTotal : 1 / 3;
  const normC = allocTotal > 0 ? cashPct  / allocTotal : 1 / 3;

  const totalYears = lifeExpectancy - currentAge;
  const yearsToRetirement = retirementAge - currentAge;

  const portfoliosByYear: number[][] = Array.from({ length: totalYears + 1 }, () =>
    new Array(numSimulations).fill(0)
  );

  const maxBlockStart = RETURNS_DATA.length - BLOCK_SIZE;
  let successes = 0;
  const failureAges: number[] = [];

  for (let sim = 0; sim < numSimulations; sim++) {
    let portfolio = currentPortfolio;
    let failedAtYear = -1;

    portfoliosByYear[0][sim] = portfolio;

    // Block bootstrap state
    let blockStart = Math.floor(Math.random() * (maxBlockStart + 1));
    let blockPos = 0;

    for (let year = 1; year <= totalYears; year++) {
      if (failedAtYear >= 0) {
        portfoliosByYear[year][sim] = 0;
        continue;
      }

      const [s, b, c] = useGlidePath
        ? glidedAlloc(year, totalYears, normS, normB, normC)
        : [normS, normB, normC];

      // Sample returns based on chosen method
      let stockRet: number, bondRet: number;
      if (method === "fat-tailed") {
        // Student's t (df=4): heavier tails than normal, more frequent extreme years
        stockRet = _meanS + _stdS * studentT(4);
        bondRet  = _meanB + _stdB * studentT(4);
      } else {
        // block5 or cape: 5-year block bootstrap from history
        if (blockPos >= BLOCK_SIZE) {
          blockStart = Math.floor(Math.random() * (maxBlockStart + 1));
          blockPos = 0;
        }
        const d = RETURNS_DATA[blockStart + blockPos];
        stockRet = d.stocks;
        bondRet  = d.bonds;
        blockPos++;
        if (method === "cape") {
          // Shift stock returns down to reflect current elevated valuations (CAPE ~36)
          stockRet += CAPE_ADJUSTMENT;
        }
      }
      const ret = s * stockRet + b * bondRet + c * CASH_RETURN;
      const age = currentAge + year;

      if (age <= retirementAge) {
        // Accumulation phase
        portfolio = portfolio * (1 + ret) + annualSavings;
      } else {
        // Distribution phase
        const yearsRetired = age - retirementAge;
        const inflatedSpend = annualRetirementSpend * Math.pow(1 + INFLATION_RATE, yearsRetired);
        const bridgeOffset = (bridgeIncome > 0 && age <= bridgeUntilAge) ? bridgeIncome : 0;
        const netSpend = Math.max(0, inflatedSpend - ssAnnual - bridgeOffset);
        const grossWithdrawal = netSpend * taxGrossFactor;
        portfolio = portfolio * (1 + ret) - grossWithdrawal;
      }

      if (portfolio <= 0) {
        failedAtYear = year;
        portfolio = 0;
      }

      portfoliosByYear[year][sim] = portfolio;
    }

    if (failedAtYear < 0) {
      successes++;
    } else {
      failureAges.push(currentAge + failedAtYear);
    }
  }

  const percentiles: YearlyPercentiles[] = portfoliosByYear.map((yearVals, yearIdx) => {
    const sorted = [...yearVals].sort((a, b) => a - b);
    return {
      age: currentAge + yearIdx,
      p10: Math.max(0, percentile(sorted, 10)),
      p25: Math.max(0, percentile(sorted, 25)),
      p50: Math.max(0, percentile(sorted, 50)),
      p75: Math.max(0, percentile(sorted, 75)),
      p90: Math.max(0, percentile(sorted, 90)),
    };
  });

  const retirementVals = [...portfoliosByYear[yearsToRetirement]].sort((a, b) => a - b);
  const endVals = [...portfoliosByYear[totalYears]].sort((a, b) => a - b);
  const sortedFailures = [...failureAges].sort((a, b) => a - b);

  const baseNetSpend = Math.max(0, annualRetirementSpend - ssAnnual);
  const annualTaxCostAtRetirement = baseNetSpend * (taxGrossFactor - 1);

  return {
    successRate: (successes / numSimulations) * 100,
    percentiles,
    medianAtRetirement: percentile(retirementVals, 50),
    medianAtEnd: Math.max(0, percentile(endVals, 50)),
    p10AtEnd: Math.max(0, percentile(endVals, 10)),
    p90AtEnd: Math.max(0, percentile(endVals, 90)),
    failureYear: sortedFailures.length > 0
      ? sortedFailures[Math.floor(sortedFailures.length / 2)]
      : null,
    failureAges,
    annualTaxCostAtRetirement,
  };
}

export function formatDollars(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}
