import { RETURNS_DATA } from "./historicalReturns";

const INFLATION_RATE = 0.02; // Baked-in 2% annual inflation
const CASH_RETURN = 0.02;    // Fixed nominal return for cash (~0% real)

export interface SimulationInputs {
  currentAge: number;
  retirementAge: number;
  lifeExpectancy: number;
  currentPortfolio: number;
  annualSavings: number;
  annualRetirementSpend: number;
  stockPct: number; // 0–1
  bondPct: number;  // 0–1
  cashPct: number;  // 0–1  (ideally stockPct + bondPct + cashPct = 1)
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
  successRate: number; // 0–100
  percentiles: YearlyPercentiles[];
  medianAtRetirement: number;
  medianAtEnd: number;
  p10AtEnd: number;
  p90AtEnd: number;
  failureYear: number | null; // median failure year if successRate < 100
}

function randomReturn(stockPct: number, bondPct: number, cashPct: number): number {
  const idx = Math.floor(Math.random() * RETURNS_DATA.length);
  const { stocks, bonds } = RETURNS_DATA[idx];
  return stockPct * stocks + bondPct * bonds + cashPct * CASH_RETURN;
}

function percentile(sorted: number[], p: number): number {
  const idx = Math.floor((p / 100) * (sorted.length - 1));
  return sorted[idx];
}

export function runSimulation(inputs: SimulationInputs, numSimulations = 1000): SimulationResult {
  const {
    currentAge,
    retirementAge,
    lifeExpectancy,
    currentPortfolio,
    annualSavings,
    annualRetirementSpend,
    stockPct,
    bondPct,
    cashPct,
  } = inputs;

  // Normalize allocation in case it doesn't sum to 1
  const allocTotal = stockPct + bondPct + cashPct;
  const normStock = allocTotal > 0 ? stockPct / allocTotal : 1 / 3;
  const normBond  = allocTotal > 0 ? bondPct  / allocTotal : 1 / 3;
  const normCash  = allocTotal > 0 ? cashPct  / allocTotal : 1 / 3;

  const totalYears = lifeExpectancy - currentAge;
  const yearsToRetirement = retirementAge - currentAge;

  // portfoliosByYear[year][sim] = portfolio value
  const portfoliosByYear: number[][] = Array.from({ length: totalYears + 1 }, () =>
    new Array(numSimulations).fill(0)
  );

  let successes = 0;
  const failureYears: number[] = [];

  for (let sim = 0; sim < numSimulations; sim++) {
    let portfolio = currentPortfolio;
    let failed = false;

    portfoliosByYear[0][sim] = portfolio;

    for (let year = 1; year <= totalYears; year++) {
      if (failed) {
        portfoliosByYear[year][sim] = 0;
        continue;
      }

      const ret = randomReturn(normStock, normBond, normCash);
      const age = currentAge + year;

      if (age <= retirementAge) {
        // Accumulation: grow + add savings
        portfolio = portfolio * (1 + ret) + annualSavings;
      } else {
        // Distribution: grow - inflation-adjusted spend
        const yearsRetired = age - retirementAge;
        const inflatedSpend = annualRetirementSpend * Math.pow(1 + INFLATION_RATE, yearsRetired);
        portfolio = portfolio * (1 + ret) - inflatedSpend;
      }

      if (portfolio <= 0) {
        failed = true;
        portfolio = 0;
      }

      portfoliosByYear[year][sim] = portfolio;
    }

    if (!failed) {
      successes++;
    } else {
      const failedYear = portfoliosByYear.findIndex((yearVals, i) => i > 0 && yearVals[sim] === 0);
      if (failedYear > 0) failureYears.push(failedYear);
    }
  }

  // Compute percentiles at each year
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

  const retirementIdx = yearsToRetirement;
  const endIdx = totalYears;

  const retirementVals = [...portfoliosByYear[retirementIdx]].sort((a, b) => a - b);
  const endVals = [...portfoliosByYear[endIdx]].sort((a, b) => a - b);

  return {
    successRate: (successes / numSimulations) * 100,
    percentiles,
    medianAtRetirement: percentile(retirementVals, 50),
    medianAtEnd: Math.max(0, percentile(endVals, 50)),
    p10AtEnd: Math.max(0, percentile(endVals, 10)),
    p90AtEnd: Math.max(0, percentile(endVals, 90)),
    failureYear:
      failureYears.length > 0
        ? currentAge + Math.round(failureYears.sort((a, b) => a - b)[Math.floor(failureYears.length / 2)])
        : null,
  };
}

export function formatDollars(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}
