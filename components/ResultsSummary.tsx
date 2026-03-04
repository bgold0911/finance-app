"use client";

import { SimulationResult, formatDollars } from "@/lib/monteCarlo";

interface Props {
  result: SimulationResult;
  retirementAge: number;
  lifeExpectancy: number;
}

function SuccessGauge({ rate, lifeExpectancy }: { rate: number; lifeExpectancy: number }) {
  const isStrong = rate >= 90;
  const isModerate = rate >= 70 && rate < 90;
  const color = isStrong ? "text-green-600" : isModerate ? "text-yellow-500" : "text-red-500";
  const bg = isStrong ? "bg-green-50 border-green-200" : isModerate ? "bg-yellow-50 border-yellow-200" : "bg-red-50 border-red-200";
  const label = isStrong ? "Strong" : isModerate ? "Moderate Risk" : "Needs Attention";

  return (
    <div className={`rounded-2xl border-2 ${bg} p-8 flex flex-col items-center text-center`}>
      <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
        Probability of Success
      </p>
      <p className={`text-7xl font-black ${color} leading-none`}>
        {rate.toFixed(1)}%
      </p>
      <p className={`mt-3 text-base font-bold ${color}`}>{label}</p>
      <p className="text-xs text-gray-400 mt-2 max-w-xs">
        {rate.toFixed(0)}% of 1,000 simulations did not run out of money
        before age {lifeExpectancy}
      </p>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-1 shadow-sm">
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-xl font-bold text-[#111F42]">{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

export default function ResultsSummary({ result, retirementAge, lifeExpectancy }: Props) {
  const { successRate, medianAtRetirement, medianAtEnd, p10AtEnd, p90AtEnd } = result;

  return (
    <div className="flex flex-col gap-6">
      <SuccessGauge rate={successRate} lifeExpectancy={lifeExpectancy} />

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

      {successRate < 95 && (
        <div className="bg-[#111F42] text-white rounded-xl p-4 text-sm">
          <p className="font-bold mb-1">💡 How to improve your odds</p>
          <ul className="text-gray-300 flex flex-col gap-1 pl-4 list-disc">
            <li>Increase annual savings — even $5,000/year more has a large long-term impact</li>
            <li>Reduce retirement spending — dropping spend by 10% can raise success rate significantly</li>
            <li>Retire 1–2 years later — each extra year of savings and lower withdrawal duration helps</li>
            {result.failureYear && (
              <li>Median failure age: ~{result.failureYear} — plan for spending flexibility after that</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
