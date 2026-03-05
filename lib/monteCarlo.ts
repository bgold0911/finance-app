import { RETURNS_DATA } from "./historicalReturns";

const INFLATION_RATE = 0.02; // Baked-in 2% annual inflation
const CASH_RETURN = 0.02;    // Fixed nominal return for cash (~0% real)
const BLOCK_SIZE = 5;        // Block bootstrap: sample 5 consecutive historical years at a time

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
  traditionalPct: number;        // fraction in traditional 401k/IRA (taxed as ordinary income)
  rothPct: number;               // fraction in Roth (tax-free withdrawals)
  taxablePct: number;            // fraction in taxable brokerage (gains taxed at LTCG rate)
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

export function runSimulation(inputs: SimulationInputs, numSimulations = 1000): SimulationResult {
  const {
    currentAge, retirementAge, lifeExpectancy,
    currentPortfolio, annualSavings, annualRetirementSpend,
    stockPct, bondPct, cashPct,
    socialSecurityMonthly, bridgeIncome, bridgeUntilAge,
    useGlidePath,
    traditionalPct, rothPct, taxablePct,
    ordinaryTaxRate, ltcgRate, gainFraction,
  } = inputs;

  const ssAnnual = socialSecurityMonthly * 12;

  // Tax gross-up factor: how much extra must be withdrawn per $1 of desired net spend
  const taxAcctTotal = traditionalPct + rothPct + taxablePct;
  const taxGrossFactor = taxAcctTotal > 0
    ? (traditionalPct / (1 - ordinaryTaxRate))
      + rothPct
      + (taxablePct / (1 - gainFraction * ltcgRate))
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

      // Advance block bootstrap: pick new block when current one is exhausted
      if (blockPos >= BLOCK_SIZE) {
        blockStart = Math.floor(Math.random() * (maxBlockStart + 1));
        blockPos = 0;
      }
      const { stocks, bonds } = RETURNS_DATA[blockStart + blockPos];
      blockPos++;
      const ret = s * stocks + b * bonds + c * CASH_RETURN;
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
