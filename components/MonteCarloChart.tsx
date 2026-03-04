"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { YearlyPercentiles } from "@/lib/monteCarlo";

interface Props {
  percentiles: YearlyPercentiles[];
  retirementAge: number;
}

function fmtDollars(v: number) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

// Recharts data format for stacked area bands:
// Each point needs: age, p10, p10_25 (p25-p10), p25_50 (p50-p25), etc.
function buildChartData(percentiles: YearlyPercentiles[]) {
  return percentiles.map((d) => ({
    age: d.age,
    // Lowest band (0 → p10): just p10
    p10: d.p10,
    // Band p10 → p25
    band_10_25: Math.max(0, d.p25 - d.p10),
    // Band p25 → p50
    band_25_50: Math.max(0, d.p50 - d.p25),
    // Band p50 → p75
    band_50_75: Math.max(0, d.p75 - d.p50),
    // Band p75 → p90
    band_75_90: Math.max(0, d.p90 - d.p75),
    // Tooltip values
    _p10: d.p10,
    _p25: d.p25,
    _p50: d.p50,
    _p75: d.p75,
    _p90: d.p90,
  }));
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{payload: Record<string, number>}>; label?: number }) {
  if (!active || !payload || !payload[0]) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-bold text-[#664930] mb-2">Age {label}</p>
      <div className="flex flex-col gap-1">
        <div className="flex justify-between gap-4">
          <span className="text-gray-500">90th %ile</span>
          <span className="font-semibold text-green-600">{fmtDollars(d._p90)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-500">75th %ile</span>
          <span className="font-semibold text-green-500">{fmtDollars(d._p75)}</span>
        </div>
        <div className="flex justify-between gap-4 border-t border-gray-100 pt-1">
          <span className="text-gray-500">Median (50th)</span>
          <span className="font-bold text-[#664930]">{fmtDollars(d._p50)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-500">25th %ile</span>
          <span className="font-semibold text-orange-500">{fmtDollars(d._p25)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-500">10th %ile</span>
          <span className="font-semibold text-red-500">{fmtDollars(d._p10)}</span>
        </div>
      </div>
    </div>
  );
}

export default function MonteCarloChart({ percentiles, retirementAge }: Props) {
  const data = buildChartData(percentiles);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <h3 className="text-base font-bold text-[#664930] mb-1">Portfolio Value Over Time</h3>
      <p className="text-xs text-gray-500 mb-4">
        Shaded bands show the range of 1,000 simulated outcomes (10th–90th percentile)
      </p>
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="age" tick={{ fontSize: 11 }} tickLine={false} />
          <YAxis
            tickFormatter={fmtDollars}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={52}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            x={retirementAge}
            stroke="#664930"
            strokeDasharray="4 4"
            label={{ value: "Retirement", position: "top", fontSize: 10, fill: "#664930" }}
          />
          {/* Stacked from bottom: p10 base, then bands */}
          <Area type="monotone" dataKey="p10" stackId="1" stroke="none" fill="transparent" />
          <Area type="monotone" dataKey="band_10_25" stackId="1" stroke="none" fill="#ef4444" fillOpacity={0.25} />
          <Area type="monotone" dataKey="band_25_50" stackId="1" stroke="none" fill="#f97316" fillOpacity={0.2} />
          <Area type="monotone" dataKey="band_50_75" stackId="1" stroke="#997E67" strokeWidth={1.5} fill="#997E67" fillOpacity={0.2} />
          <Area type="monotone" dataKey="band_75_90" stackId="1" stroke="none" fill="#664930" fillOpacity={0.25} />
        </AreaChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-4 mt-4 text-xs text-gray-500 justify-center">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm inline-block" style={{background:"#664930", opacity:0.6}} /> 75th–90th %ile</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm inline-block" style={{background:"#997E67", opacity:0.5}} /> 50th–75th %ile (median up)</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-orange-400 opacity-50 inline-block" /> 25th–50th %ile</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-400 opacity-50 inline-block" /> 10th–25th %ile</span>
      </div>
    </div>
  );
}
