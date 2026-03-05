"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { SimulationResult, formatDollars } from "@/lib/monteCarlo";

export interface SensitivityRow {
  label: string;
  successRate: number;
  delta: number;
}

interface Props {
  result: SimulationResult;
  retirementAge: number;
  lifeExpectancy: number;
  annualRetirementSpend: number;
  sensitivityRows: SensitivityRow[];
}

// ── Success Gauge ──────────────────────────────────────────────────────────────
function SuccessGauge({ rate, lifeExpectancy }: { rate: number; lifeExpectancy: number }) {
  const isStrong   = rate >= 90;
  const isModerate = rate >= 70 && rate < 90;
  const color = isStrong ? "text-green-600" : isModerate ? "text-yellow-500" : "text-red-500";
  const bg    = isStrong ? "bg-green-50 border-green-200" : isModerate ? "bg-yellow-50 border-yellow-200" : "bg-red-50 border-red-200";
  const label = isStrong ? "Strong" : isModerate ? "Moderate Risk" : "Needs Attention";

  return (
    <div className={`rounded-2xl border-2 ${bg} p-8 flex flex-col items-center text-center`}>
      <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
        Probability of Success
      </p>
      <p className={`text-7xl font-black ${color} leading-none`}>{rate.toFixed(1)}%</p>
      <p className={`mt-3 text-base font-bold ${color}`}>{label}</p>
      <p className="text-xs text-gray-400 mt-2 max-w-xs">
        {rate.toFixed(0)}% of 1,000 simulations did not run out of money before age {lifeExpectancy}
      </p>
    </div>
  );
}

// ── SWR Badge ──────────────────────────────────────────────────────────────────
function SWRBadge({ annualSpend, medianAtRetirement }: { annualSpend: number; medianAtRetirement: number }) {
  if (medianAtRetirement <= 0) return null;
  const swr = (annualSpend / medianAtRetirement) * 100;
  const isGood = swr <= 4;
  const isOk   = swr <= 5;
  const color  = isGood ? "text-green-600" : isOk ? "text-yellow-500" : "text-red-500";
  const bg     = isGood ? "bg-green-50 border-green-200" : isOk ? "bg-yellow-50 border-yellow-200" : "bg-red-50 border-red-200";
  const verdict = isGood ? "Within the 4% rule" : isOk ? "Slightly above 4% rule" : "Above safe zone";

  return (
    <div className={`rounded-xl border ${bg} p-4 flex items-center justify-between`}>
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Safe Withdrawal Rate</p>
        <p className={`text-2xl font-black ${color} mt-0.5`}>{swr.toFixed(2)}%</p>
        <p className={`text-xs font-semibold ${color} mt-0.5`}>{verdict}</p>
      </div>
      <div className="text-right text-xs text-gray-400 max-w-[150px]">
        Annual spend as % of projected portfolio at retirement. ≤4% is the classic safe zone.
      </div>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-1 shadow-sm">
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-xl font-bold text-[#664930]">{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

// ── Sensitivity Table ─────────────────────────────────────────────────────────
function SensitivityTable({ rows, baseRate }: { rows: SensitivityRow[]; baseRate: number }) {
  if (rows.length === 0) return null;
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
      <h3 className="text-base font-bold text-[#664930] mb-1">What If?</h3>
      <p className="text-xs text-gray-500 mb-4">
        How your success rate changes by tweaking one variable at a time
      </p>
      <div className="flex flex-col divide-y divide-gray-100">
        {/* Base row */}
        <div className="flex items-center justify-between py-2">
          <span className="text-sm font-semibold text-gray-700">Current scenario</span>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-[#664930]">{baseRate.toFixed(1)}%</span>
            <span className="text-xs text-gray-300 w-14 text-right">baseline</span>
          </div>
        </div>
        {rows.map(({ label, successRate, delta }) => {
          const deltaColor = delta > 0 ? "text-green-600" : delta < 0 ? "text-red-500" : "text-gray-400";
          const deltaSign  = delta > 0 ? "+" : "";
          return (
            <div key={label} className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-600">{label}</span>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-800">{successRate.toFixed(1)}%</span>
                <span className={`text-xs font-bold w-14 text-right ${deltaColor}`}>
                  {deltaSign}{delta.toFixed(1)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Failure Histogram ─────────────────────────────────────────────────────────
function FailureHistogram({ failureAges, totalSims }: { failureAges: number[]; totalSims: number }) {
  if (failureAges.length === 0) return null;

  // Bucket by age
  const counts: Record<number, number> = {};
  for (const age of failureAges) {
    counts[age] = (counts[age] || 0) + 1;
  }
  const data = Object.entries(counts)
    .map(([age, count]) => ({ age: Number(age), count }))
    .sort((a, b) => a.age - b.age);

  const medianAge = failureAges.slice().sort((a, b) => a - b)[Math.floor(failureAges.length / 2)];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
      <h3 className="text-base font-bold text-[#664930] mb-1">When Do Portfolios Run Out?</h3>
      <p className="text-xs text-gray-500 mb-4">
        Distribution of the {failureAges.length} simulations ({((failureAges.length / totalSims) * 100).toFixed(0)}%) that ran out of money.
        Median failure age: <strong>{medianAge}</strong>.
      </p>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <XAxis dataKey="age" tick={{ fontSize: 10 }} tickLine={false} />
          <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={30} />
          <Tooltip
            formatter={(value: number) => [`${value} simulations`, "Failed"]}
            labelFormatter={(label) => `Age ${label}`}
            contentStyle={{ fontSize: 11, borderRadius: 8 }}
          />
          <Bar dataKey="count" radius={[3, 3, 0, 0]}>
            {data.map((entry) => (
              <Cell
                key={entry.age}
                fill={entry.age === medianAge ? "#ef4444" : "#fca5a5"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────
export default function ResultsSummary({
  result, retirementAge, lifeExpectancy, annualRetirementSpend, sensitivityRows,
}: Props) {
  const { successRate, medianAtRetirement, medianAtEnd, p10AtEnd, p90AtEnd, failureAges } = result;

  return (
    <div className="flex flex-col gap-6">
      <SuccessGauge rate={successRate} lifeExpectancy={lifeExpectancy} />

      <SWRBadge annualSpend={annualRetirementSpend} medianAtRetirement={medianAtRetirement} />

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label={`Median at Retirement (${retirementAge})`}
          value={formatDollars(medianAtRetirement)}
          sub="50th percentile portfolio"
        />
        <StatCard
          label={`Median at End of Life (${lifeExpectancy})`}
          value={formatDollars(medianAtEnd)}
          sub="How much is left over"
        />
        <StatCard
          label="Worst Likely Outcome"
          value={formatDollars(p10AtEnd)}
          sub={`10th percentile at age ${lifeExpectancy}`}
        />
        <StatCard
          label="Best Likely Outcome"
          value={formatDollars(p90AtEnd)}
          sub={`90th percentile at age ${lifeExpectancy}`}
        />
      </div>

      <SensitivityTable rows={sensitivityRows} baseRate={successRate} />

      {failureAges.length > 0 && (
        <FailureHistogram failureAges={failureAges} totalSims={1000} />
      )}

      {successRate < 95 && (
        <div className="bg-[#664930] text-white rounded-xl p-4 text-sm">
          <p className="font-bold mb-1">💡 How to improve your odds</p>
          <ul className="text-[#CCBEB1] flex flex-col gap-1 pl-4 list-disc">
            <li>Increase annual savings — even $5,000/year more has a large long-term impact</li>
            <li>Reduce retirement spending — dropping spend by 10% can raise success rate significantly</li>
            <li>Retire 1–2 years later — each extra year of savings and lower withdrawal duration helps</li>
            <li>Add Social Security income — even $1,000/month changes the math dramatically</li>
            {result.failureYear && (
              <li>Median failure age: ~{result.failureYear} — plan for spending flexibility after that</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
