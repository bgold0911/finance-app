export interface RentVsBuyInputs {
  homePrice: number;
  downPaymentPct: number;       // e.g. 0.20
  mortgageRatePct: number;      // e.g. 0.065
  mortgageTermYears: number;    // 30
  propertyTaxRate: number;      // annual % of home value, e.g. 0.012
  maintenancePct: number;       // annual % of home value, e.g. 0.01
  homeInsurancePerMonth: number;
  monthlyRent: number;
  rentIncreasePct: number;      // e.g. 0.03
  homeAppreciationPct: number;  // e.g. 0.035
  investmentReturnPct: number;  // opportunity cost rate for down payment
  marginalTaxRate: number;      // for mortgage interest deduction
}

export interface RentVsBuyYearData {
  year: number;
  netBuyCost: number;         // true cost of buying net of equity & opportunity cost
  cumulativeRentCost: number;
  homeEquity: number;
}

export interface RentVsBuyResult {
  breakEvenYear: number | null;
  yearlyData: RentVsBuyYearData[];
  monthlyMortgagePayment: number;
  downPaymentAmount: number;
  totalInterestPaid30yr: number;
  totalEquity30yr: number;
}

export function calcRentVsBuy(inputs: RentVsBuyInputs): RentVsBuyResult {
  const {
    homePrice, downPaymentPct, mortgageRatePct, mortgageTermYears,
    propertyTaxRate, maintenancePct, homeInsurancePerMonth,
    monthlyRent, rentIncreasePct, homeAppreciationPct,
    investmentReturnPct, marginalTaxRate,
  } = inputs;

  const downPayment = homePrice * downPaymentPct;
  const loanAmount = homePrice - downPayment;
  const monthlyRate = mortgageRatePct / 12;
  const totalMonths = mortgageTermYears * 12;

  const monthlyPayment =
    loanAmount > 0 && monthlyRate > 0
      ? (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
        (Math.pow(1 + monthlyRate, totalMonths) - 1)
      : loanAmount > 0 ? loanAmount / totalMonths : 0;

  const yearlyData: RentVsBuyYearData[] = [];
  let remainingBalance = loanAmount;
  let homeValue = homePrice;
  let monthlyRentCurrent = monthlyRent;

  // Cumulative trackers
  let cumInterestPaid = 0;
  let cumRunningCosts = 0; // property tax + maintenance + insurance − tax savings
  let cumulativeRentCost = 0;
  let breakEvenYear: number | null = null;

  for (let yr = 1; yr <= 30; yr++) {
    homeValue *= 1 + homeAppreciationPct;

    let yearInterest = 0;
    for (let m = 0; m < 12; m++) {
      if (remainingBalance > 0.01) {
        const ip = remainingBalance * monthlyRate;
        const pp = Math.min(monthlyPayment - ip, remainingBalance);
        yearInterest += ip;
        remainingBalance = Math.max(0, remainingBalance - pp);
      }
    }

    cumInterestPaid += yearInterest;
    const yearTaxSavings = yearInterest * marginalTaxRate;
    cumRunningCosts +=
      homeValue * propertyTaxRate +
      homeValue * maintenancePct +
      homeInsurancePerMonth * 12 -
      yearTaxSavings;

    cumulativeRentCost += monthlyRentCurrent * 12;
    monthlyRentCurrent *= 1 + rentIncreasePct;

    const principalPaid = loanAmount - remainingBalance;
    const appreciation = homeValue - homePrice;
    const homeEquity = downPayment + principalPaid + appreciation;

    // Opportunity cost: what the down payment would have grown to if invested
    const oppCost = downPayment * (Math.pow(1 + investmentReturnPct, yr) - 1);

    // True cost of buying = interest + running costs − appreciation gained + opportunity cost
    const netBuyCost = cumInterestPaid + cumRunningCosts - appreciation + oppCost;

    if (breakEvenYear === null && netBuyCost < cumulativeRentCost) {
      breakEvenYear = yr;
    }

    yearlyData.push({
      year: yr,
      netBuyCost: Math.round(netBuyCost),
      cumulativeRentCost: Math.round(cumulativeRentCost),
      homeEquity: Math.round(homeEquity),
    });
  }

  return {
    breakEvenYear,
    yearlyData,
    monthlyMortgagePayment: Math.round(monthlyPayment),
    downPaymentAmount: Math.round(downPayment),
    totalInterestPaid30yr: Math.round(cumInterestPaid),
    totalEquity30yr: yearlyData[yearlyData.length - 1].homeEquity,
  };
}
