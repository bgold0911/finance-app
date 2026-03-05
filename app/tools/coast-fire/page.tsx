"use client";

import { useState, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from "recharts";
import { calcCoastFire, CoastInputs, CoastYearData } from "@/lib/coastFire";
import { formatDollars } from "@/lib/monteCarlo";

const DEFAULT_INPUTS: CoastInputs = {
  currentAge: 30,
  retirementAge: 65,
  currentPortfolio: 100_000,
  annualSavings: 20_000,
  annualRetirementSpend: 60_000,
  withdrawalRate: 0.04,
  nominalReturn: 0.07,
  inflationRate: 0.02,
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

function StatCard({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-1 shadow-sm ${highlight ? "bg-green-50 border-green-200" : "bg-white border-gray-200"}`}>
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
      <p className={`text-xl font-bold ${highlight ? "text-green-700" : "text-[#664930]"}`}>{value}</p>
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
      <p className="font-bold text-gray-700 mb-1.5">Age {label}</p>
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

export default function CoastFirePage() {
  const [inputs, setInputs] = useState<CoastInputs>(DEFAULT_INPUTS);
  const [showAssumptions, setShowAssumptions] = useState(false);

  const set = (key: keyof CoastInputs, value: number) =>
    setInputs((prev) => ({ ...prev, [key]: value }));

  const result = calcCoastFire(inputs);

  const progressColor =
    result.isCoasting ? "bg-green-500"
    : result.progressPct >= 75 ? "bg-yellow-400"
    : result.progressPct >= 50 ? "bg-orange-400"
    : "bg-red-400";

  // Thin chart data for large age ranges
  const chartData: CoastYearData[] = result.yearlyData.filter((_, i, arr) =>
    i === 0 || i === arr.length - 1 || i % Math.max(1, Math.floor(arr.length / 40)) === 0
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
          <span>Tools</span><span>/</span>
          <span className="text-[#664930] font-medium">Coast FIRE Calculator</span>
        </div>
        <h1 className="text-3xl font-bold text-[#664930] mb-2">Coast FIRE Calculator</h1>
        <p className="text-gray-500 max-w-2xl">
          Find the portfolio size where you can stop contributing and let compound growth carry you
          to retirement. Once you hit your Coast FIRE number, your money works — you don&apos;t have to.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8 items-start">
        {/* Form */}
        <div className="lg:sticky lg:top-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col gap-5">
            <h2 className="text-lg font-bold text-[#664930]">Your Situation</h2>

            <div className="grid grid-cols-2 gap-4">
              <InputRow label="Current Age" value={inputs.currentAge}
                min={18} max={75} step={1} suffix=" yrs" inputWidth="w-16"
                onChange={(v) => {
                  const next = { ...inputs, currentAge: v };
                  if (v >= inputs.retirementAge) next.retirementAge = v + 1;
                  setInputs(next);
                }} />
              <InputRow label="Retire Age" value={inputs.retirementAge}
                min={inputs.currentAge + 1} max={80} step={1} suffix=" yrs" inputWidth="w-16"
                onChange={(v) => set("retirementAge", v)} />
            </div>

            <InputRow label="Current Portfolio" value={inputs.currentPortfolio}
              min={0} max={10_000_000} step={5_000} prefix="$" inputWidth="w-28"
              onChange={(v) => set("currentPortfolio", v)} />

            <InputRow label="Annual Savings" value={inputs.annualSavings}
              min={0} max={500_000} step={1_000} prefix="$" suffix="/yr" inputWidth="w-24"
              onChange={(v) => set("annualSavings", v)} />

            <div className="border-t border-gray-100 pt-4 flex flex-col gap-2">
              <InputRow label="Annual Retirement Spending" value={inputs.annualRetirementSpend}
                min={0} max={1_000_000} step={1_000} prefix="$" suffix="/yr" inputWidth="w-24"
                onChange={(v) => set("annualRetirementSpend", v)} />
              <p className="text-xs text-gray-400">Used to calculate your FIRE number</p>
            </div>

            <div className="border-t border-gray-100 pt-4 flex flex-col gap-3">
              <button
                onClick={() => setShowAssumptions(!showAssumptions)}
                className="flex items-center gap-2 text-xs text-[#664930] font-semibold hover:underline w-fit"
              >
                <span>{showAssumptions ? "▼" : "▶"}</span> Assumptions
              </button>
              {showAssumptions && (
                <div className="flex flex-col gap-3 pl-3 border-l-2 border-[#CCBEB1]">
                  <InputRow label="Safe Withdrawal Rate"
                    value={inputs.withdrawalRate * 100}
                    min={2} max={10} step={0.5} suffix="%" inputWidth="w-16"
                    onChange={(v) => set("withdrawalRate", v / 100)} />
                  <p className="text-xs text-gray-400 -mt-2">4% is the classic benchmark</p>
                  <InputRow label="Expected Return (nominal)"
                    value={inputs.nominalReturn * 100}
                    min={1} max={15} step={0.5} suffix="%" inputWidth="w-16"
                    onChange={(v) => set("nominalReturn", v / 100)} />
                  <InputRow label="Inflation Rate"
                    value={inputs.inflationRate * 100}
                    min={0} max={10} step={0.5} suffix="%" inputWidth="w-16"
                    onChange={(v) => set("inflationRate", v / 100)} />
                  <p className="text-xs text-gray-400 -mt-2">
                    Real return = {((inputs.nominalReturn - inputs.inflationRate) * 100).toFixed(1)}%
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="flex flex-col gap-6">
          {result.isCoasting ? (
            <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 text-center">
              <p className="text-4xl mb-2">🎉</p>
              <p className="text-xl font-black text-green-700">You&apos;re Already Coasting!</p>
              <p className="text-sm text-green-600 mt-1 max-w-md mx-auto">
                Your {formatDollars(inputs.currentPortfolio)} portfolio exceeds your Coast FIRE number
                of {formatDollars(result.coastFireNumber)}. You can stop contributing and still retire on schedule.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-semibold text-gray-700">Progress to Coast FIRE</p>
                <p className="text-sm font-bold text-[#664930]">{result.progressPct.toFixed(1)}%</p>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${progressColor}`}
                  style={{ width: `${result.progressPct}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {formatDollars(inputs.currentPortfolio)} of {formatDollars(result.coastFireNumber)} needed
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="FIRE Number"
              value={formatDollars(result.fireNumber)}
              sub={`${(inputs.annualRetirementSpend / 1000).toFixed(0)}K/yr ÷ ${(inputs.withdrawalRate * 100).toFixed(0)}% SWR`}
            />
            <StatCard
              label="Coast FIRE Number"
              value={formatDollars(result.coastFireNumber)}
              sub="Minimum portfolio to coast from today"
            />
            {result.ageAtCoastFire !== null && (
              <StatCard
                label={result.isCoasting ? "Already Coasting" : "Coast FIRE Age"}
                value={`Age ${result.ageAtCoastFire}`}
                sub={result.isCoasting ? "You're there!" : `${result.yearsToCoastFire} years away`}
                highlight={result.isCoasting}
              />
            )}
            <StatCard
              label="Real Return"
              value={`${((inputs.nominalReturn - inputs.inflationRate) * 100).toFixed(1)}%`}
              sub={`${(inputs.nominalReturn * 100).toFixed(1)}% nominal − ${(inputs.inflationRate * 100).toFixed(1)}% inflation`}
            />
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-base font-bold text-[#664930] mb-1">Portfolio vs. Coast FIRE Threshold</h3>
            <p className="text-xs text-gray-500 mb-4">
              Your portfolio growth vs. the minimum needed to coast at each age — they cross when you&apos;ve hit Coast FIRE
            </p>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 16, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="age" tick={{ fontSize: 10 }}
                  label={{ value: "Age", position: "insideBottom", offset: -8, fontSize: 10, fill: "#9ca3af" }} />
                <YAxis
                  tickFormatter={(v: number | undefined) => v !== undefined ? formatDollars(v) : ""}
                  tick={{ fontSize: 10 }} width={64}
                />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                {result.ageAtCoastFire !== null && (
                  <ReferenceLine
                    x={result.ageAtCoastFire}
                    stroke="#22c55e" strokeDasharray="4 2"
                    label={{ value: "Coast FIRE", position: "insideTopRight", fontSize: 9, fill: "#22c55e" }}
                  />
                )}
                <Line type="monotone" dataKey="portfolio" name="Your Portfolio"
                  stroke="#664930" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="coastThreshold" name="Coast FIRE Minimum"
                  stroke="#d97706" strokeWidth={2} strokeDasharray="5 3" dot={false} />
                <Line type="monotone" dataKey="fireTarget" name="FIRE Target"
                  stroke="#9ca3af" strokeWidth={1.5} strokeDasharray="3 3" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-[#FAF6F2] rounded-xl border border-[#CCBEB1] p-4 text-xs text-gray-500">
            <p className="font-semibold text-[#664930] mb-1">How Coast FIRE Works</p>
            <p>
              Coast FIRE is the portfolio size that will grow to your full FIRE number by retirement
              using only investment returns — no further contributions needed. Once you hit it, you can
              work less, switch careers, or take time off, knowing retirement is mathematically secure.
              Your FIRE number = annual spending ÷ safe withdrawal rate (e.g., $60K ÷ 4% = $1.5M).
              For educational purposes only — not financial advice.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
