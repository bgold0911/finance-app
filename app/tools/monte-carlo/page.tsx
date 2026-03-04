"use client";

import { useState, useCallback } from "react";
import MonteCarloForm from "@/components/MonteCarloForm";
import MonteCarloChart from "@/components/MonteCarloChart";
import ResultsSummary from "@/components/ResultsSummary";
import { SimulationInputs, SimulationResult, runSimulation } from "@/lib/monteCarlo";

const DEFAULT_INPUTS: SimulationInputs = {
  currentAge: 30,
  retirementAge: 65,
  lifeExpectancy: 90,
  currentPortfolio: 100_000,
  annualSavings: 20_000,
  annualRetirementSpend: 60_000,
  inflationRate: 0.03,
  stockPct: 0.80,
};

export default function MonteCarloPage() {
  const [inputs, setInputs] = useState<SimulationInputs>(DEFAULT_INPUTS);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [running, setRunning] = useState(false);

  const handleRun = useCallback(() => {
    setRunning(true);
    // Defer to next frame so the button state updates before computation starts
    setTimeout(() => {
      const r = runSimulation(inputs, 1000);
      setResult(r);
      setRunning(false);
    }, 10);
  }, [inputs]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
          <span>Tools</span>
          <span>/</span>
          <span className="text-[#111F42] font-medium">Monte Carlo Simulator</span>
        </div>
        <h1 className="text-3xl font-bold text-[#111F42] mb-2">
          Retirement Monte Carlo Simulator
        </h1>
        <p className="text-gray-500 max-w-2xl">
          Enter your financial details below. We&apos;ll run 1,000 retirement scenarios using
          historical S&amp;P 500 and Treasury returns (1928–2024) to show the probability
          your money lasts through retirement.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8 items-start">
        {/* Left: Form */}
        <div className="lg:sticky lg:top-6">
          <MonteCarloForm
            inputs={inputs}
            onChange={setInputs}
            onRun={handleRun}
            running={running}
          />
        </div>

        {/* Right: Results */}
        <div className="flex flex-col gap-6">
          {result ? (
            <>
              <ResultsSummary
                result={result}
                retirementAge={inputs.retirementAge}
                lifeExpectancy={inputs.lifeExpectancy}
              />
              <MonteCarloChart
                percentiles={result.percentiles}
                retirementAge={inputs.retirementAge}
              />
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center flex flex-col items-center gap-4">
              <span className="text-6xl">📊</span>
              <h2 className="text-xl font-bold text-[#111F42]">Ready to simulate</h2>
              <p className="text-gray-500 max-w-sm text-sm">
                Adjust the sliders on the left to match your situation, then click{" "}
                <strong>Run Simulation</strong> to see your probability of a successful
                retirement across 1,000 possible futures.
              </p>
              <button
                onClick={handleRun}
                disabled={running}
                className="bg-[#111F42] text-white font-bold px-8 py-3 rounded-xl hover:bg-[#1F3568] transition-colors"
              >
                Run Simulation →
              </button>
            </div>
          )}

          {/* Methodology note */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 text-xs text-gray-500">
            <p className="font-semibold text-gray-700 mb-1">Methodology</p>
            <p>
              Each simulation randomly samples from 97 years of historical annual returns
              (S&P 500 + 10-year Treasuries, 1928–2024) using bootstrap resampling with replacement.
              Retirement spend is inflated annually by your chosen inflation rate.
              Success = portfolio never reaches $0 before your life expectancy.
              This is for educational purposes only and does not constitute financial advice.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
