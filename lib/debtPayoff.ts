export interface Debt {
  id: string;
  name: string;
  balance: number;
  apr: number;        // e.g. 0.189
  minPayment: number;
}

export type PayoffStrategy = "avalanche" | "snowball" | "minimum";

export interface PayoffOrderItem {
  name: string;
  payoffMonth: number;
  interestPaid: number;
}

export interface DebtPayoffResult {
  monthsToPayoff: number;
  totalInterestPaid: number;
  totalPaid: number;
  payoffOrder: PayoffOrderItem[];
  monthlyData: { month: number; totalBalance: number }[];
}

export function calcDebtPayoff(
  debts: Debt[],
  extraMonthlyPayment: number,
  strategy: PayoffStrategy
): DebtPayoffResult {
  const empty: DebtPayoffResult = {
    monthsToPayoff: 0, totalInterestPaid: 0, totalPaid: 0, payoffOrder: [], monthlyData: [{ month: 0, totalBalance: 0 }],
  };
  const activeDebts = debts.filter((d) => d.balance > 0 && d.minPayment > 0);
  if (activeDebts.length === 0) return empty;

  const state = activeDebts.map((d) => ({
    ...d, balance: d.balance, interestPaid: 0, payoffMonth: -1,
  }));

  const monthlyData: { month: number; totalBalance: number }[] = [];
  monthlyData.push({ month: 0, totalBalance: Math.round(state.reduce((s, d) => s + d.balance, 0)) });

  let rolledMinimums = 0;
  let month = 0;

  while (state.some((d) => d.payoffMonth < 0) && month < 600) {
    month++;

    // Accrue interest
    for (const d of state) {
      if (d.payoffMonth < 0) {
        const interest = d.balance * (d.apr / 12);
        d.interestPaid += interest;
        d.balance += interest;
      }
    }

    // Apply minimum payments
    for (const d of state) {
      if (d.payoffMonth < 0) {
        const payment = Math.min(d.minPayment, d.balance);
        d.balance = Math.max(0, d.balance - payment);
        if (d.balance < 0.01) {
          d.balance = 0;
          d.payoffMonth = month;
          if (strategy !== "minimum") rolledMinimums += d.minPayment;
        }
      }
    }

    // Apply extra payment to target debt
    if (strategy !== "minimum") {
      const totalExtra = extraMonthlyPayment + rolledMinimums;
      const remaining = state.filter((d) => d.payoffMonth < 0);
      if (remaining.length > 0 && totalExtra > 0) {
        const target =
          strategy === "avalanche"
            ? remaining.reduce((best, d) => d.apr > best.apr ? d : best)
            : remaining.reduce((best, d) => d.balance < best.balance ? d : best);
        target.balance = Math.max(0, target.balance - totalExtra);
        if (target.balance < 0.01) {
          target.balance = 0;
          if (target.payoffMonth < 0) {
            target.payoffMonth = month;
            rolledMinimums += target.minPayment;
          }
        }
      }
    }

    const totalBalance = state.reduce((s, d) => s + d.balance, 0);
    monthlyData.push({ month, totalBalance: Math.round(totalBalance) });
    if (totalBalance < 0.01) break;
  }

  for (const d of state) {
    if (d.payoffMonth < 0) d.payoffMonth = month;
  }

  const totalInterestPaid = state.reduce((s, d) => s + d.interestPaid, 0);
  const totalPrincipal = activeDebts.reduce((s, d) => s + d.balance, 0);

  // Downsample for chart: every month up to 24, then every 3
  const sampled = monthlyData.filter((d, i) =>
    i === 0 || d.totalBalance === 0 || d.month <= 24 || d.month % 3 === 0
  );

  return {
    monthsToPayoff: month,
    totalInterestPaid: Math.round(totalInterestPaid),
    totalPaid: Math.round(totalPrincipal + totalInterestPaid),
    payoffOrder: state
      .map((d) => ({ name: d.name, payoffMonth: d.payoffMonth, interestPaid: Math.round(d.interestPaid) }))
      .sort((a, b) => a.payoffMonth - b.payoffMonth),
    monthlyData: sampled,
  };
}
