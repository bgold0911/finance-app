"use client";

import { useState, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from "recharts";
import { calcRentVsBuy, RentVsBuyInputs } from "@/lib/rentVsBuy";
import { formatDollars } from "@/lib/monteCarlo";

const DEFAULT_INPUTS: RentVsBuyInputs = {
  homePrice: 500_000,
  downPaymentPct: 0.20,
  mortgageRatePct: 0.065,
  mortgageTermYears: 30,
  propertyTaxRate: 0.012,
  maintenancePct: 0.01,
  homeInsurancePerMonth: 150,
  monthlyRent: 2_500,
  rentIncreasePct: 0.03,
  homeAppreciationPct: 0.035,
  investmentReturnPct: 0.07,
  marginalTaxRate: 0.22,
};

function NumberInput({
  value, min, max, step, prefix, suffix, inputWidth = "w-24", onChange,
}: {
  value: number; min: number; max: number; step: number;
  prefix?: string; suffix?: string; inputWidth?: string;
  onChange: (v: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setDraft(String(value));
  }, [value, focused]);

  function commit(raw: string) {
    const n = parseFloat(raw);
    const clamped = isNaN(n) ? value : Math.max(min, Math.min(max, n));
    onChange(clamped);
    setDraft(String(clamped));
  }

  return (
    <div className="flex items-center gap-0.5">
      {prefix && <span className="text-sm font-semibold text-[#664930]">{prefix}</span>}
      <input
        type="number" value={draft} step={step}
        onFocus={() => { setFocused(true); setDraft(String(value)); }}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => { setFocused(false); commit(draft); }}
        onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
        className={`${inputWidth} text-right border border-gray-200 rounded-md px-2 py-1 text-sm font-bold text-[#664930] focus:outline-none focus:ring-1 focus:ring-[#664930] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
      />
      {suffix && <span className="text-sm font-semibold text-[#664930]">{suffix}</span>}
    </div>
  );
}

function InputRow({
  label, value, min, max, step, prefix, suffix, inputWidth, onChange,
}: {
  label: string; value: number; min: number; max: number; step: number;
  prefix?: string; suffix?: string; inputWidth?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex justify-between items-center">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <NumberInput value={value} min={min} max={max} step={step}
        prefix={prefix} suffix={suffix} inputWidth={inputWidth} onChange={onChange} />
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-1 shadow-sm">
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-xl font-bold text-[#664930]">{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: number;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg text-xs">
      <p className="font-bold text-gray-700 mb-1.5">Year {label}</p>
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

export default function RentVsBuyPage() {
  const [inputs, setInputs] = useState<RentVsBuyInputs>(DEFAULT_INPUTS);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const set = (key: keyof RentVsBuyInputs, value: number) =>
    setInputs((prev) => ({ ...prev, [key]: value }));

  const result = calcRentVsBuy(inputs);

  const buyWins = result.breakEvenYear !== null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
          <span>Tools</span><span>/</span>
          <span className="text-[#664930] font-medium">Rent vs. Buy</span>
        </div>
        <h1 className="text-3xl font-bold text-[#664930] mb-2">Rent vs. Buy Calculator</h1>
        <p className="text-gray-500 max-w-2xl">
          Compare the true 30-year cost of renting vs. buying — including opportunity cost of your
          down payment, appreciation, tax benefits, and rising rent.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8 items-start">
        {/* Form */}
        <div className="lg:sticky lg:top-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col gap-5">
            <h2 className="text-lg font-bold text-[#664930]">The Home</h2>

            <InputRow label="Home Price" value={inputs.homePrice}
              min={50_000} max={5_000_000} step={10_000} prefix="$" inputWidth="w-28"
              onChange={(v) => set("homePrice", v)} />
            <InputRow label="Down Payment" value={inputs.downPaymentPct * 100}
              min={3} max={50} step={1} suffix="%" inputWidth="w-16"
              onChange={(v) => set("downPaymentPct", v / 100)} />
            <p className="text-xs text-gray-400 -mt-3">
              = {formatDollars(inputs.homePrice * inputs.downPaymentPct)} down
            </p>
            <InputRow label="Mortgage Rate" value={inputs.mortgageRatePct * 100}
              min={1} max={15} step={0.125} suffix="%" inputWidth="w-16"
              onChange={(v) => set("mortgageRatePct", v / 100)} />
            <p className="text-xs text-gray-400 -mt-3">
              Monthly P&amp;I: {formatDollars(result.monthlyMortgagePayment)}/mo
            </p>

            <div className="border-t border-gray-100 pt-4">
              <h2 className="text-base font-semibold text-[#664930] mb-3">Renting</h2>
              <div className="flex flex-col gap-4">
                <InputRow label="Monthly Rent" value={inputs.monthlyRent}
                  min={0} max={20_000} step={50} prefix="$" suffix="/mo" inputWidth="w-24"
                  onChange={(v) => set("monthlyRent", v)} />
                <InputRow label="Annual Rent Increases" value={inputs.rentIncreasePct * 100}
                  min={0} max={10} step={0.5} suffix="%" inputWidth="w-16"
                  onChange={(v) => set("rentIncreasePct", v / 100)} />
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 flex flex-col gap-3">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-xs text-[#664930] font-semibold hover:underline w-fit"
              >
                <span>{showAdvanced ? "▼" : "▶"}</span> Advanced Assumptions
              </button>
              {showAdvanced && (
                <div className="flex flex-col gap-3 pl-3 border-l-2 border-[#CCBEB1]">
                  <InputRow label="Home Appreciation" value={inputs.homeAppreciationPct * 100}
                    min={0} max={15} step={0.5} suffix="%" inputWidth="w-16"
                    onChange={(v) => set("homeAppreciationPct", v / 100)} />
                  <InputRow label="Property Tax Rate" value={inputs.propertyTaxRate * 100}
                    min={0} max={5} step={0.1} suffix="%" inputWidth="w-16"
                    onChange={(v) => set("propertyTaxRate", v / 100)} />
                  <InputRow label="Maintenance" value={inputs.maintenancePct * 100}
                    min={0} max={5} step={0.1} suffix="%" inputWidth="w-16"
                    onChange={(v) => set("maintenancePct", v / 100)} />
                  <p className="text-xs text-gray-400 -mt-2">% of home value per year</p>
                  <InputRow label="Home Insurance" value={inputs.homeInsurancePerMonth}
                    min={0} max={2_000} step={10} prefix="$" suffix="/mo" inputWidth="w-20"
                    onChange={(v) => set("homeInsurancePerMonth", v)} />
                  <InputRow label="Investment Return" value={inputs.investmentReturnPct * 100}
                    min={0} max={20} step={0.5} suffix="%" inputWidth="w-16"
                    onChange={(v) => set("investmentReturnPct", v / 100)} />
                  <p className="text-xs text-gray-400 -mt-2">Return if down payment stayed invested</p>
                  <InputRow label="Marginal Tax Rate" value={inputs.marginalTaxRate * 100}
                    min={0} max={50} step={1} suffix="%" inputWidth="w-16"
                    onChange={(v) => set("marginalTaxRate", v / 100)} />
                  <p className="text-xs text-gray-400 -mt-2">For mortgage interest deduction benefit</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="flex flex-col gap-6">
          {/* Break-even banner */}
          <div className={`rounded-2xl border-2 p-6 text-center ${buyWins ? "bg-[#FAF6F2] border-[#CCBEB1]" : "bg-blue-50 border-blue-200"}`}>
            {buyWins ? (
              <>
                <p className="text-sm font-semibold text-gray-500 mb-1">Break-Even Point</p>
                <p className="text-5xl font-black text-[#664930]">Year {result.breakEvenYear}</p>
                <p className="text-sm text-gray-500 mt-2">
                  Buying becomes cheaper than renting after {result.breakEvenYear} year{result.breakEvenYear !== 1 ? "s" : ""}
                </p>
              </>
            ) : (
              <>
                <p className="text-4xl mb-2">🏠</p>
                <p className="text-xl font-black text-blue-700">Renting Wins Over 30 Years</p>
                <p className="text-sm text-blue-600 mt-1">
                  With these assumptions, buying never breaks even within 30 years.
                  Try adjusting appreciation, rent growth, or return rate.
                </p>
              </>
            )}
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Monthly Mortgage (P&I)"
              value={formatDollars(result.monthlyMortgagePayment) + "/mo"}
              sub={`${formatDollars(inputs.homePrice * inputs.downPaymentPct)} down payment`} />
            <StatCard label="30-Year Home Equity"
              value={formatDollars(result.totalEquity30yr)}
              sub="Down payment + principal + appreciation" />
            <StatCard label="30-Year Interest Paid"
              value={formatDollars(result.totalInterestPaid30yr)}
              sub="Total interest to lender" />
            <StatCard label="Opp. Cost of Down Payment"
              value={formatDollars(inputs.homePrice * inputs.downPaymentPct * (Math.pow(1 + inputs.investmentReturnPct, 30) - 1))}
              sub={`At ${(inputs.investmentReturnPct * 100).toFixed(1)}% return over 30 years`} />
          </div>

          {/* Chart */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-base font-bold text-[#664930] mb-1">Cumulative Cost Comparison</h3>
            <p className="text-xs text-gray-500 mb-4">
              Net cost of buying (after equity &amp; opportunity cost) vs. cumulative rent paid
            </p>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={result.yearlyData} margin={{ top: 8, right: 16, bottom: 16, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="year" tick={{ fontSize: 10 }}
                  label={{ value: "Year", position: "insideBottom", offset: -8, fontSize: 10, fill: "#9ca3af" }} />
                <YAxis tickFormatter={(v: number | undefined) => v !== undefined ? formatDollars(v) : ""}
                  tick={{ fontSize: 10 }} width={68} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                {result.breakEvenYear !== null && (
                  <ReferenceLine x={result.breakEvenYear} stroke="#22c55e" strokeDasharray="4 2"
                    label={{ value: "Break-Even", position: "insideTopRight", fontSize: 9, fill: "#22c55e" }} />
                )}
                <Line type="monotone" dataKey="netBuyCost" name="Net Cost of Buying"
                  stroke="#664930" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="cumulativeRentCost" name="Cumulative Rent"
                  stroke="#3b82f6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="homeEquity" name="Home Equity"
                  stroke="#22c55e" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-[#FAF6F2] rounded-xl border border-[#CCBEB1] p-4 text-xs text-gray-500">
            <p className="font-semibold text-[#664930] mb-1">How Net Cost of Buying is Calculated</p>
            <p>
              Net cost of buying = cumulative interest paid + running costs (taxes, maintenance, insurance, minus tax savings)
              − home appreciation + opportunity cost of the down payment (what it would have earned invested).
              When this drops below cumulative rent paid, buying becomes the better financial choice.
              Does not include closing costs (~2–5%). For educational purposes only — not financial advice.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
