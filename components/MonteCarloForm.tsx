"use client";

import { useState, useEffect } from "react";
import { SimulationInputs } from "@/lib/monteCarlo";

interface Props {
  inputs: SimulationInputs;
  onChange: (inputs: SimulationInputs) => void;
  onRun: () => void;
  running: boolean;
}

// Number input with local draft state so the user can type freely
// without mid-entry clamping. Commits (and clamps) on blur or Enter.
function NumberInput({
  value,
  min,
  max,
  step,
  prefix,
  suffix,
  inputWidth = "w-24",
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  prefix?: string;
  suffix?: string;
  inputWidth?: string;
  onChange: (v: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));
  const [focused, setFocused] = useState(false);

  // Keep draft in sync with external value changes (e.g. slider moving)
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
        type="number"
        value={draft}
        step={step}
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

interface SliderFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  prefix?: string;
  suffix?: string;
  inputWidth?: string;
  minLabel?: string;
  maxLabel?: string;
  onChange: (v: number) => void;
}

function SliderField({
  label,
  value,
  min,
  max,
  step,
  prefix,
  suffix,
  inputWidth,
  minLabel,
  maxLabel,
  onChange,
}: SliderFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <NumberInput
          value={value}
          min={min}
          max={max}
          step={step}
          prefix={prefix}
          suffix={suffix}
          inputWidth={inputWidth}
          onChange={onChange}
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[#664930] h-2 rounded-full cursor-pointer"
      />
      <div className="flex justify-between text-xs text-gray-400">
        <span>{minLabel ?? min.toLocaleString()}</span>
        <span>{maxLabel ?? max.toLocaleString()}</span>
      </div>
    </div>
  );
}

export default function MonteCarloForm({ inputs, onChange, onRun, running }: Props) {
  const set = (key: keyof SimulationInputs, value: number) =>
    onChange({ ...inputs, [key]: value });

  const stockInt = Math.round(inputs.stockPct * 100);
  const bondInt  = Math.round(inputs.bondPct  * 100);
  const cashInt  = Math.round(inputs.cashPct  * 100);
  const total    = stockInt + bondInt + cashInt;
  const totalOk  = total === 100;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col gap-6">
      <h2 className="text-lg font-bold text-[#664930]">Your Situation</h2>

      {/* Ages */}
      <div className="grid grid-cols-2 gap-4">
        <SliderField
          label="Current Age"
          value={inputs.currentAge}
          min={18} max={75} step={1}
          suffix=" yrs"
          inputWidth="w-16"
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
          suffix=" yrs"
          inputWidth="w-16"
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
        suffix=" yrs"
        inputWidth="w-16"
        onChange={(v) => set("lifeExpectancy", v)}
      />

      {/* Portfolio */}
      <div className="border-t border-gray-100 pt-4">
        <SliderField
          label="Current Portfolio"
          value={inputs.currentPortfolio}
          min={0} max={2_000_000} step={5_000}
          prefix="$"
          inputWidth="w-28"
          minLabel="$0"
          maxLabel="$2M"
          onChange={(v) => set("currentPortfolio", v)}
        />
      </div>

      <SliderField
        label="Annual Savings"
        value={inputs.annualSavings}
        min={0} max={200_000} step={1_000}
        prefix="$"
        suffix="/yr"
        inputWidth="w-24"
        minLabel="$0"
        maxLabel="$200K"
        onChange={(v) => set("annualSavings", v)}
      />

      <SliderField
        label="Annual Retirement Spend"
        value={inputs.annualRetirementSpend}
        min={10_000} max={300_000} step={1_000}
        prefix="$"
        suffix="/yr"
        inputWidth="w-24"
        minLabel="$10K"
        maxLabel="$300K"
        onChange={(v) => set("annualRetirementSpend", v)}
      />

      {/* Asset Allocation */}
      <div className="border-t border-gray-100 pt-4 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <p className="text-sm font-semibold text-gray-700">Asset Allocation</p>
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              totalOk
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-600"
            }`}
          >
            Total: {total}%
          </span>
        </div>

        <SliderField
          label="Stocks"
          value={stockInt}
          min={0} max={100} step={5}
          suffix="%"
          inputWidth="w-16"
          onChange={(v) => set("stockPct", v / 100)}
        />
        <SliderField
          label="Bonds"
          value={bondInt}
          min={0} max={100} step={5}
          suffix="%"
          inputWidth="w-16"
          onChange={(v) => set("bondPct", v / 100)}
        />
        <SliderField
          label="Cash"
          value={cashInt}
          min={0} max={100} step={5}
          suffix="%"
          inputWidth="w-16"
          onChange={(v) => set("cashPct", v / 100)}
        />

        {!totalOk && (
          <p className="text-xs text-red-500 -mt-1">
            Allocations must sum to 100% before running
          </p>
        )}
      </div>

      <p className="text-xs text-gray-400 -mt-2">
        Inflation assumed at 2% annually · Cash earns ~2% nominal
      </p>

      <button
        onClick={onRun}
        disabled={running || !totalOk}
        className="w-full bg-[#664930] text-white font-bold py-3.5 rounded-xl hover:bg-[#4d3520] transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-base"
      >
        {running ? "Running 1,000 simulations…" : "Run Simulation →"}
      </button>
    </div>
  );
}
