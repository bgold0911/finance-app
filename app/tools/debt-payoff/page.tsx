"use client";

import { useState, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { calcDebtPayoff, Debt, DebtPayoffResult } from "@/lib/debtPayoff";
import { formatDollars } from "@/lib/monteCarlo";
import AffiliateCTA from "@/components/AffiliateCTA";

let nextId = 3;
const DEFAULT_DEBTS: Debt[] = [
  { id: "1", name: "Credit Card", balance: 8_500, apr: 0.219, minPayment: 170 },
  { id: "2", name: "Car Loan", balance: 12_000, apr: 0.069, minPayment: 250 },
];

function formatMonths(m: number): string {
  const yr = Math.floor(m / 12);
  const mo = m % 12;
  if (yr === 0) return `${mo} mo`;
  if (mo === 0) return `${yr} yr`;
  return `${yr} yr ${mo} mo`;
}

function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: number;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg text-xs">
      <p className="font-bold text-gray-700 mb-1.5">Month {label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-1.5 mb-0.5">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
          <span className="text-gray-600">{p.name}:</span>
          <span className="font-bold" style={{ color: p.color }}>{formatDollars(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

function ResultCard({
  label, result, minimumResult, color, badge,
}: {
  label: string;
  result: DebtPayoffResult;
  minimumResult: DebtPayoffResult;
  color: string;
  badge?: string;
}) {
  const interestSaved = minimumResult.totalInterestPaid - result.totalInterestPaid;
  return (
    <div className={`bg-white rounded-xl border-2 p-4 flex flex-col gap-2 shadow-sm`} style={{ borderColor: color }}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold" style={{ color }}>{label}</p>
        {badge && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFDBBB] text-[#664930]">{badge}</span>
        )}
      </div>
      <p className="text-2xl font-black text-gray-800">{formatMonths(result.monthsToPayoff)}</p>
      <div className="flex flex-col gap-1 text-xs text-gray-500 border-t border-gray-100 pt-2 mt-1">
        <div className="flex justify-between">
          <span>Total interest</span>
          <span className="font-semibold text-gray-700">{formatDollars(result.totalInterestPaid)}</span>
        </div>
        {interestSaved > 0 && (
          <div className="flex justify-between">
            <span>Interest saved</span>
            <span className="font-semibold text-green-600">−{formatDollars(interestSaved)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DebtPayoffPage() {
  const [debts, setDebts] = useState<Debt[]>(DEFAULT_DEBTS);
  const [extra, setExtra] = useState(200);
  const [extraDraft, setExtraDraft] = useState("200");
  const [extraFocused, setExtraFocused] = useState(false);

  function updateDebt(id: string, field: keyof Debt, raw: string) {
    setDebts((prev) => prev.map((d) => {
      if (d.id !== id) return d;
      if (field === "name") return { ...d, name: raw };
      const n = parseFloat(raw);
      if (isNaN(n) || n < 0) return d;
      if (field === "apr") return { ...d, apr: Math.min(1, n / 100) };
      return { ...d, [field]: n };
    }));
  }

  function addDebt() {
    setDebts((prev) => [
      ...prev,
      { id: String(nextId++), name: `Debt ${prev.length + 1}`, balance: 5_000, apr: 0.15, minPayment: 100 },
    ]);
  }

  function removeDebt(id: string) {
    setDebts((prev) => prev.filter((d) => d.id !== id));
  }

  const avalanche = useMemo(() => calcDebtPayoff(debts, extra, "avalanche"), [debts, extra]);
  const snowball  = useMemo(() => calcDebtPayoff(debts, extra, "snowball"),  [debts, extra]);
  const minimum   = useMemo(() => calcDebtPayoff(debts, extra, "minimum"),   [debts, extra]);

  // Merge chart data across strategies
  const maxMonth = Math.max(avalanche.monthsToPayoff, snowball.monthsToPayoff, minimum.monthsToPayoff);
  const avalancheMap = new Map(avalanche.monthlyData.map((d) => [d.month, d.totalBalance]));
  const snowballMap  = new Map(snowball.monthlyData.map((d) => [d.month, d.totalBalance]));
  const minimumMap   = new Map(minimum.monthlyData.map((d) => [d.month, d.totalBalance]));

  // Sample months
  const chartMonths = new Set<number>([0]);
  [avalanche.monthlyData, snowball.monthlyData, minimum.monthlyData].forEach((data) =>
    data.forEach((d) => chartMonths.add(d.month))
  );
  const chartData = [...chartMonths].sort((a, b) => a - b).filter((m) => m <= maxMonth).map((m) => ({
    month: m,
    Avalanche: avalancheMap.get(m) ?? (m > avalanche.monthsToPayoff ? 0 : undefined),
    Snowball:  snowballMap.get(m)  ?? (m > snowball.monthsToPayoff  ? 0 : undefined),
    "Min. Only": minimumMap.get(m) ?? (m > minimum.monthsToPayoff   ? 0 : undefined),
  }));

  const totalDebt = debts.reduce((s, d) => s + d.balance, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
          <span>Tools</span><span>/</span>
          <span className="text-[#664930] font-medium">Debt Payoff Planner</span>
        </div>
        <h1 className="text-3xl font-bold text-[#664930] mb-2">Debt Payoff Planner</h1>
        <p className="text-gray-500 max-w-2xl">
          Compare the Avalanche (highest interest first) vs. Snowball (smallest balance first) strategies
          side-by-side. See exactly when you&apos;ll be debt-free and how much interest you&apos;ll save.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-8 items-start">
        {/* Form */}
        <div className="lg:sticky lg:top-6 flex flex-col gap-4">
          {/* Extra payment */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-[#664930] mb-4">Extra Monthly Payment</h2>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-700">Amount above minimums</p>
                <p className="text-xs text-gray-400 mt-0.5">Applied strategically to pay debt faster</p>
              </div>
              <div className="flex items-center gap-0.5">
                <span className="text-sm font-semibold text-[#664930]">$</span>
                <input
                  type="number" value={extraFocused ? extraDraft : extra}
                  onFocus={() => { setExtraFocused(true); setExtraDraft(String(extra)); }}
                  onChange={(e) => setExtraDraft(e.target.value)}
                  onBlur={() => {
                    setExtraFocused(false);
                    const n = parseFloat(extraDraft);
                    const v = isNaN(n) ? extra : Math.max(0, Math.min(10_000, n));
                    setExtra(v); setExtraDraft(String(v));
                  }}
                  onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                  className="w-24 text-right border border-gray-200 rounded-md px-2 py-1 text-sm font-bold text-[#664930] focus:outline-none focus:ring-1 focus:ring-[#664930] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-sm font-semibold text-[#664930]">/mo</span>
              </div>
            </div>
          </div>

          {/* Debt list */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#664930]">Your Debts</h2>
              <span className="text-sm font-semibold text-gray-500">{formatDollars(totalDebt)} total</span>
            </div>

            {/* Column headers */}
            <div className="grid grid-cols-[1fr_80px_60px_72px_24px] gap-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-1">
              <span>Name</span><span className="text-right">Balance</span>
              <span className="text-right">APR</span><span className="text-right">Min/mo</span><span />
            </div>

            {debts.map((debt) => (
              <div key={debt.id} className="grid grid-cols-[1fr_80px_60px_72px_24px] gap-2 items-center">
                <input
                  value={debt.name}
                  onChange={(e) => updateDebt(debt.id, "name", e.target.value)}
                  className="border border-gray-200 rounded-md px-2 py-1 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#664930] min-w-0"
                />
                <input
                  type="number" value={debt.balance} min={0} max={10_000_000} step={100}
                  onChange={(e) => updateDebt(debt.id, "balance", e.target.value)}
                  className="w-full text-right border border-gray-200 rounded-md px-2 py-1 text-sm font-semibold text-[#664930] focus:outline-none focus:ring-1 focus:ring-[#664930] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <div className="flex items-center gap-0.5">
                  <input
                    type="number" value={(debt.apr * 100).toFixed(1)} min={0} max={100} step={0.1}
                    onChange={(e) => updateDebt(debt.id, "apr", e.target.value)}
                    className="w-full text-right border border-gray-200 rounded-md px-2 py-1 text-sm font-semibold text-[#664930] focus:outline-none focus:ring-1 focus:ring-[#664930] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-xs text-gray-400">%</span>
                </div>
                <input
                  type="number" value={debt.minPayment} min={1} max={100_000} step={10}
                  onChange={(e) => updateDebt(debt.id, "minPayment", e.target.value)}
                  className="w-full text-right border border-gray-200 rounded-md px-2 py-1 text-sm font-semibold text-[#664930] focus:outline-none focus:ring-1 focus:ring-[#664930] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                {debts.length > 1 ? (
                  <button onClick={() => removeDebt(debt.id)} className="text-gray-300 hover:text-red-400 font-bold text-lg leading-none">×</button>
                ) : <span />}
              </div>
            ))}

            <button
              onClick={addDebt}
              className="mt-1 text-sm text-[#664930] font-semibold border border-dashed border-[#CCBEB1] rounded-lg py-2 hover:bg-[#FAF6F2] transition-colors"
            >
              + Add Debt
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="flex flex-col gap-6">
          {/* Strategy comparison */}
          <div className="grid grid-cols-3 gap-3">
            <ResultCard label="Avalanche" result={avalanche} minimumResult={minimum} color="#664930" badge="Best for interest" />
            <ResultCard label="Snowball"  result={snowball}  minimumResult={minimum} color="#d97706" />
            <ResultCard label="Min. Only" result={minimum}   minimumResult={minimum} color="#9ca3af" />
          </div>

          {/* Chart */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-base font-bold text-[#664930] mb-1">Total Debt Balance Over Time</h3>
            <p className="text-xs text-gray-500 mb-4">All three strategies compared month by month</p>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 16, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }}
                  label={{ value: "Month", position: "insideBottom", offset: -8, fontSize: 10, fill: "#9ca3af" }} />
                <YAxis tickFormatter={(v: number | undefined) => v !== undefined ? formatDollars(v) : ""}
                  tick={{ fontSize: 10 }} width={64} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                <Line type="monotone" dataKey="Avalanche" stroke="#664930" strokeWidth={2.5} dot={false} connectNulls />
                <Line type="monotone" dataKey="Snowball"  stroke="#d97706" strokeWidth={2}   dot={false} connectNulls />
                <Line type="monotone" dataKey="Min. Only" stroke="#9ca3af" strokeWidth={1.5} dot={false} connectNulls strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Payoff order table */}
          {avalanche.payoffOrder.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <h3 className="text-base font-bold text-[#664930] mb-1">Avalanche Payoff Order</h3>
              <p className="text-xs text-gray-500 mb-4">Highest-interest debt tackled first — minimizes total interest paid</p>
              <div className="flex flex-col divide-y divide-gray-100">
                <div className="grid grid-cols-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2">
                  <span>Debt</span><span className="text-center">Paid off</span><span className="text-right">Interest paid</span>
                </div>
                {avalanche.payoffOrder.map((item, i) => (
                  <div key={item.name} className="grid grid-cols-3 py-2.5 items-center">
                    <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#664930] text-white text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                      {item.name}
                    </span>
                    <span className="text-sm text-center text-gray-600">{formatMonths(item.payoffMonth)}</span>
                    <span className="text-sm text-right font-semibold text-gray-700">{formatDollars(item.interestPaid)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-[#FAF6F2] rounded-xl border border-[#CCBEB1] p-4 text-xs text-gray-500">
            <p className="font-semibold text-[#664930] mb-1">Avalanche vs. Snowball</p>
            <p>
              <strong>Avalanche</strong> targets the highest-interest debt first — mathematically optimal, saves the most money.
              <strong> Snowball</strong> targets the smallest balance first — pays off debts faster for a psychological win, but costs more in interest.
              Both strategies roll freed-up minimum payments into the next debt.
              For educational purposes only — not financial advice.
            </p>
          </div>
          <AffiliateCTA context="debt" />
        </div>
      </div>
    </div>
  );
}
