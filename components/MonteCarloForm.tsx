"use client";

import { SimulationInputs } from "@/lib/monteCarlo";

interface Props {
  inputs: SimulationInputs;
  onChange: (inputs: SimulationInputs) => void;
  onRun: () => void;
  running: boolean;
}

function formatNum(n: number) {
  return n.toLocaleString();
}

interface SliderFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (v: number) => void;
}

function SliderField({ label, value, min, max, step, display, onChange }: SliderFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <span className="text-sm font-bold text-[#111F42]">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[#111F42] h-2 rounded-full cursor-pointer"
      />
      <div className="flex justify-between text-xs text-gray-400">
        <span>{min.toLocaleString()}</span>
        <span>{max.toLocaleString()}</span>
      </div>
    </div>
  );
}

export default function MonteCarloForm({ inputs, onChange, onRun, running }: Props) {
  const set = (key: keyof SimulationInputs, value: number) =>
    onChange({ ...inputs, [key]: value });

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col gap-6">
      <h2 className="text-lg font-bold text-[#111F42]">Your Situation</h2>

      {/* Ages */}
      <div className="grid grid-cols-2 gap-4">
        <SliderField
          label="Current Age"
          value={inputs.currentAge}
          min={18} max={75} step={1}
          display={`${inputs.currentAge}`}
          onChange={(v) => {
            const newInputs = { ...inputs, currentAge: v };
            if (v >= inputs.retirementAge) newInputs.retirementAge = v + 1;
            onChange(newInputs);
          }}
        />
        <SliderField
          label="Retirement Age"
          value={inputs.retirementAge}
          min={inputs.currentAge + 1} max={80} step={1}
          display={`${inputs.retirementAge}`}
          onChange={(v) => {
            const newInputs = { ...inputs, retirementAge: v };
            if (v >= inputs.lifeExpectancy) newInputs.lifeExpectancy = v + 1;
            onChange(newInputs);
          }}
        />
      </div>

      <SliderField
        label="Life Expectancy"
        value={inputs.lifeExpectancy}
        min={inputs.retirementAge + 1} max={105} step={1}
        display={`${inputs.lifeExpectancy}`}
        onChange={(v) => set("lifeExpectancy", v)}
      />

      {/* Portfolio */}
      <div className="border-t border-gray-100 pt-4">
        <SliderField
          label="Current Portfolio"
          value={inputs.currentPortfolio}
          min={0} max={2_000_000} step={5_000}
          display={`$${formatNum(inputs.currentPortfolio)}`}
          onChange={(v) => set("currentPortfolio", v)}
        />
      </div>

      <SliderField
        label="Annual Savings (until retirement)"
        value={inputs.annualSavings}
        min={0} max={200_000} step={1_000}
        display={`$${formatNum(inputs.annualSavings)}/yr`}
        onChange={(v) => set("annualSavings", v)}
      />

      <SliderField
        label="Annual Retirement Spend"
        value={inputs.annualRetirementSpend}
        min={10_000} max={300_000} step={1_000}
        display={`$${formatNum(inputs.annualRetirementSpend)}/yr`}
        onChange={(v) => set("annualRetirementSpend", v)}
      />

      {/* Advanced */}
      <div className="border-t border-gray-100 pt-4 grid grid-cols-2 gap-4">
        <SliderField
          label="Inflation Rate"
          value={inputs.inflationRate * 100}
          min={0} max={8} step={0.5}
          display={`${(inputs.inflationRate * 100).toFixed(1)}%`}
          onChange={(v) => set("inflationRate", v / 100)}
        />
        <SliderField
          label="Stock Allocation"
          value={inputs.stockPct * 100}
          min={0} max={100} step={5}
          display={`${Math.round(inputs.stockPct * 100)}/${Math.round((1 - inputs.stockPct) * 100)}`}
          onChange={(v) => set("stockPct", v / 100)}
        />
      </div>

      <button
        onClick={onRun}
        disabled={running}
        className="w-full bg-[#111F42] text-white font-bold py-3.5 rounded-xl hover:bg-[#1F3568] transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-base"
      >
        {running ? "Running 1,000 simulations…" : "Run Simulation →"}
      </button>
    </div>
  );
}
