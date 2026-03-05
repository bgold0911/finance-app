export interface CoastInputs {
  currentAge: number;
  retirementAge: number;
  currentPortfolio: number;
  annualSavings: number;
  annualRetirementSpend: number;
  withdrawalRate: number;   // e.g. 0.04
  nominalReturn: number;    // e.g. 0.07
  inflationRate: number;    // e.g. 0.02
}

export interface CoastYearData {
  age: number;
  portfolio: number;       // growing with savings
  coastThreshold: number;  // minimum needed at this age to coast to retirement
  fireTarget: number;      // constant FIRE number
}

export interface CoastResult {
  fireNumber: number;
  coastFireNumber: number;
  isCoasting: boolean;
  yearsToCoastFire: number | null;
  ageAtCoastFire: number | null;
  progressPct: number;
  yearlyData: CoastYearData[];
}

export function calcCoastFire(inputs: CoastInputs): CoastResult {
  const {
    currentAge, retirementAge, currentPortfolio, annualSavings,
    annualRetirementSpend, withdrawalRate, nominalReturn, inflationRate,
  } = inputs;

  const realReturn = Math.max(0.001, nominalReturn - inflationRate);
  const fireNumber = withdrawalRate > 0 ? annualRetirementSpend / withdrawalRate : 0;
  const yearsToRetirement = Math.max(1, retirementAge - currentAge);
  const coastFireNumber = fireNumber / Math.pow(1 + realReturn, yearsToRetirement);
  const isCoasting = currentPortfolio >= coastFireNumber;
  const progressPct = coastFireNumber > 0
    ? Math.min(100, (currentPortfolio / coastFireNumber) * 100)
    : 100;

  const yearlyData: CoastYearData[] = [];
  let portfolio = currentPortfolio;
  let ageAtCoastFire: number | null = isCoasting ? currentAge : null;

  for (let yr = 0; yr <= yearsToRetirement; yr++) {
    const age = currentAge + yr;
    const yearsLeft = retirementAge - age;
    const coastThreshold = yearsLeft >= 0
      ? fireNumber / Math.pow(1 + realReturn, yearsLeft)
      : fireNumber;

    if (!isCoasting && ageAtCoastFire === null && portfolio >= coastThreshold) {
      ageAtCoastFire = age;
    }

    yearlyData.push({
      age,
      portfolio: Math.round(portfolio),
      coastThreshold: Math.round(coastThreshold),
      fireTarget: Math.round(fireNumber),
    });

    portfolio = portfolio * (1 + nominalReturn) + annualSavings;
  }

  return {
    fireNumber,
    coastFireNumber,
    isCoasting,
    yearsToCoastFire: ageAtCoastFire !== null ? ageAtCoastFire - currentAge : null,
    ageAtCoastFire,
    progressPct,
    yearlyData,
  };
}
