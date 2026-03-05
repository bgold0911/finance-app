"use client";

import { useState, useEffect } from "react";
import MonteCarloForm from "@/components/MonteCarloForm";
import MonteCarloChart from "@/components/MonteCarloChart";
import ResultsSummary, { SensitivityRow } from "@/components/ResultsSummary";
import { SimulationInputs, SimulationResult, runSimulation } from "@/lib/monteCarlo";

const DEFAULT_INPUTS: SimulationInputs = {
  currentAge: 30,
  retirementAge: 65,
  lifeExpectancy: 90,
  currentPortfolio: 100_000,
  annualSavings: 20_000,
  annualRetirementSpend: 60_000,
  stockPct: 0.70,
  bondPct: 0.20,
  cashPct: 0.10,
  socialSecurityMonthly: 0,
  bridgeIncome: 0,
  bridgeUntilAge: 70,
  useGlidePath: false,
};

function loadFromURL(): SimulationInputs {
  if (typeof window === "undefined") return DEFAULT_INPUTS;
  const params = new URLSearchParams(window.location.search);
  if (!params.has("currentAge")) return DEFAULT_INPUTS;
  const result = { ...DEFAULT_INPUTS };
  for (const key of Object.keys(DEFAULT_INPUTS) as (keyof SimulationInputs)[]) {
    const val = params.get(key);
    if (val === null) continue;
    if (typeof DEFAULT_INPUTS[key] === "boolean") {
      (result as Record<string, unknown>)[key] = val === "true";
    } else {
      const n = Number(val);
      if (!isNaN(n)) (result as Record<string, unknown>)[key] = n;
    }
  }
  return result;
}

export default function MonteCarloPage() {
  const [inputs, setInputs] = useState<SimulationInputs>(DEFAULT_INPUTS);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [sensitivityRows, setSensitivityRows] = useState<SensitivityRow[]>([]);
  const [running, setRunning] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load URL state on mount
  useEffect(() => {
    setInputs(loadFromURL());
  }, []);

  // Auto-run with 400ms debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setRunning(true);
      setTimeout(() => {
        const r = runSimulation(inputs, 1000);
        setResult(r);

        // Sensitivity scenarios (500 sims each for speed)
        const base = r.successRate;
        const scenarios: [string, Partial<SimulationInputs>][] = [
          ["Retire 2 yrs later",   { retirementAge: Math.min(79, inputs.retirementAge + 2) }],
          ["Retire 2 yrs earlier", { retirementAge: Math.max(inputs.currentAge + 1, inputs.retirementAge - 2) }],
          ["Spend $10K/yr less",   { annualRetirementSpend: Math.max(0, inputs.annualRetirementSpend - 10_000) }],
          ["Spend $10K/yr more",   { annualRetirementSpend: inputs.annualRetirementSpend + 10_000 }],
          ["Save $5K/yr more",     { annualSavings: inputs.annualSavings + 5_000 }],
          ["100% stocks",          { stockPct: 1, bondPct: 0, cashPct: 0 }],
        ];
        const rows: SensitivityRow[] = scenarios.map(([label, overrides]) => {
          const sr = runSimulation({ ...inputs, ...overrides }, 500).successRate;
          return { label, successRate: sr, delta: sr - base };
        });
        setSensitivityRows(rows);
        setRunning(false);
      }, 10);
    }, 400);
    return () => clearTimeout(timer);
  }, [inputs]);

  // Sync inputs to URL
  useEffect(() => {
    const params = new URLSearchParams();
    (Object.entries(inputs) as [string, string | number | boolean][]).forEach(([k, v]) =>
      params.set(k, String(v))
    );
    window.history.replaceState(null, "", `?${params}`);
  }, [inputs]);

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Page header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
            <span>Tools</span>
            <span>/</span>
            <span className="text-[#664930] font-medium">Monte Carlo Simulator</span>
          </div>
          <h1 className="text-3xl font-bold text-[#664930] mb-2">
            Retirement Monte Carlo Simulator
          </h1>
          <p className="text-gray-500 max-w-2xl">
            Enter your financial details below. We&apos;ll run 1,000 retirement scenarios using
            historical S&amp;P 500 and Treasury returns (1928–2024) to show the probability
            your money lasts through retirement.
          </p>
        </div>
        <button
          onClick={copyLink}
          className="hidden sm:flex shrink-0 items-center gap-2 border border-[#CCBEB1] text-[#664930] text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#FFDBBB] transition-colors mt-1"
        >
          {copied ? "✓ Copied!" : "⎘ Share"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8 items-start">
        {/* Left: Form */}
        <div className="lg:sticky lg:top-6">
          <MonteCarloForm inputs={inputs} onChange={setInputs} running={running} />
        </div>

        {/* Right: Results */}
        <div className="flex flex-col gap-6">
          {result ? (
            <>
              <ResultsSummary
                result={result}
                sensitivityRows={sensitivityRows}
                retirementAge={inputs.retirementAge}
                lifeExpectancy={inputs.lifeExpectancy}
                annualRetirementSpend={inputs.annualRetirementSpend}
              />
              <MonteCarloChart
                percentiles={result.percentiles}
                retirementAge={inputs.retirementAge}
              />
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center flex flex-col items-center gap-4">
              <span className="text-6xl animate-pulse">📊</span>
              <h2 className="text-xl font-bold text-[#664930]">Calculating…</h2>
            </div>
          )}

          {/* Methodology */}
          <div className="bg-[#FAF6F2] rounded-xl border border-[#CCBEB1] p-4 text-xs text-gray-500">
            <p className="font-semibold text-[#664930] mb-1">Methodology</p>
            <p>
              Each simulation randomly samples from 97 years of historical annual returns
              (S&P 500 + 10-year Treasuries, 1928–2024) using bootstrap resampling with replacement.
              Retirement spend is inflated at 2% annually. Social Security and bridge income are
              fixed nominal amounts. Success = portfolio never reaches $0 before your life expectancy.
              Sensitivity scenarios each run 500 simulations. For educational purposes only — not financial advice.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
