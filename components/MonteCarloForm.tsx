"use client";

import { useState, useEffect } from "react";
import { SimulationInputs } from "@/lib/monteCarlo";

interface Props {
  inputs: SimulationInputs;
  onChange: (inputs: SimulationInputs) => void;
  running: boolean;
}

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

function SliderField({
  label, value, min, max, step, prefix, suffix, inputWidth, minLabel, maxLabel, onChange,
}: {
  label: string; value: number; min: number; max: number; step: number;
  prefix?: string; suffix?: string; inputWidth?: string; minLabel?: string; maxLabel?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <NumberInput value={value} min={min} max={max} step={step}
          prefix={prefix} suffix={suffix} inputWidth={inputWidth} onChange={onChange} />
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[#664930] h-2 rounded-full cursor-pointer" />
      <div className="flex justify-between text-xs text-gray-400">
        <span>{minLabel ?? min.toLocaleString()}</span>
        <span>{maxLabel ?? max.toLocaleString()}</span>
      </div>
    </div>
  );
}

export default function MonteCarloForm({ inputs, onChange, running }: Props) {
  const [showBridge, setShowBridge] = useState(inputs.bridgeIncome > 0);
  const set = (key: keyof SimulationInputs, value: number | boolean) =>
    onChange({ ...inputs, [key]: value });

  const stockInt = Math.round(inputs.stockPct * 100);
  const bondInt  = Math.round(inputs.bondPct  * 100);
  const cashInt  = Math.round(inputs.cashPct  * 100);
  const total    = stockInt + bondInt + cashInt;
  const totalOk  = total === 100;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-[#664930]">Your Situation</h2>
        {running && (
          <span className="text-xs text-gray-400 animate-pulse">Recalculating…</span>
        )}
      </div>

      {/* Ages */}
      <div className="grid grid-cols-2 gap-4">
        <SliderField label="Current Age" value={inputs.currentAge}
          min={18} max={75} step={1} suffix=" yrs" inputWidth="w-16"
          onChange={(v) => {
            const n = { ...inputs, currentAge: v };
            if (v >= inputs.retirementAge) n.retirementAge = v + 1;
            onChange(n);
          }} />
        <SliderField label="Retirement Age" value={inputs.retirementAge}
          min={inputs.currentAge + 1} max={80} step={1} suffix=" yrs" inputWidth="w-16"
          onChange={(v) => {
            const n = { ...inputs, retirementAge: v };
            if (v >= inputs.lifeExpectancy) n.lifeExpectancy = v + 1;
            onChange(n);
          }} />
      </div>

      <SliderField label="Life Expectancy" value={inputs.lifeExpectancy}
        min={inputs.retirementAge + 1} max={105} step={1} suffix=" yrs" inputWidth="w-16"
        onChange={(v) => set("lifeExpectancy", v)} />

      {/* Portfolio */}
      <div className="border-t border-gray-100 pt-4">
        <SliderField label="Current Portfolio" value={inputs.currentPortfolio}
          min={0} max={2_000_000} step={5_000} prefix="$" inputWidth="w-28"
          minLabel="$0" maxLabel="$2M" onChange={(v) => set("currentPortfolio", v)} />
      </div>

      <SliderField label="Annual Savings" value={inputs.annualSavings}
        min={0} max={200_000} step={1_000} prefix="$" suffix="/yr" inputWidth="w-24"
        minLabel="$0" maxLabel="$200K" onChange={(v) => set("annualSavings", v)} />

      <SliderField label="Annual Retirement Spend" value={inputs.annualRetirementSpend}
        min={10_000} max={300_000} step={1_000} prefix="$" suffix="/yr" inputWidth="w-24"
        minLabel="$10K" maxLabel="$300K" onChange={(v) => set("annualRetirementSpend", v)} />

      {/* Income in Retirement */}
      <div className="border-t border-gray-100 pt-4 flex flex-col gap-4">
        <p className="text-sm font-semibold text-gray-700">Income in Retirement</p>

        <SliderField label="Monthly Social Security" value={inputs.socialSecurityMonthly}
          min={0} max={5_000} step={50} prefix="$" suffix="/mo" inputWidth="w-24"
          minLabel="$0" maxLabel="$5K"
          onChange={(v) => set("socialSecurityMonthly", v)} />
        <p className="text-xs text-gray-400 -mt-2">Reduces spending your portfolio needs to cover</p>

        {/* Bridge income toggle */}
        <button
          onClick={() => setShowBridge(!showBridge)}
          className="flex items-center gap-2 text-xs text-[#664930] font-semibold hover:underline w-fit"
        >
          <span>{showBridge ? "▼" : "▶"}</span>
          Part-time bridge income
        </button>

        {showBridge && (
          <div className="flex flex-col gap-4 pl-3 border-l-2 border-[#CCBEB1]">
            <SliderField label="Annual bridge income" value={inputs.bridgeIncome}
              min={0} max={150_000} step={1_000} prefix="$" suffix="/yr" inputWidth="w-24"
              minLabel="$0" maxLabel="$150K" onChange={(v) => set("bridgeIncome", v)} />
            <SliderField label="Until age" value={inputs.bridgeUntilAge}
              min={inputs.retirementAge} max={inputs.lifeExpectancy - 1} step={1}
              suffix=" yrs" inputWidth="w-16" onChange={(v) => set("bridgeUntilAge", v)} />
            <p className="text-xs text-gray-400 -mt-2">Part-time work income in early retirement</p>
          </div>
        )}
      </div>

      {/* Asset Allocation */}
      <div className="border-t border-gray-100 pt-4 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <p className="text-sm font-semibold text-gray-700">Asset Allocation</p>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            totalOk ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
          }`}>
            Total: {total}%
          </span>
        </div>
        <SliderField label="Stocks" value={stockInt} min={0} max={100} step={5}
          suffix="%" inputWidth="w-16" onChange={(v) => set("stockPct", v / 100)} />
        <SliderField label="Bonds"  value={bondInt}  min={0} max={100} step={5}
          suffix="%" inputWidth="w-16" onChange={(v) => set("bondPct",  v / 100)} />
        <SliderField label="Cash"   value={cashInt}   min={0} max={100} step={5}
          suffix="%" inputWidth="w-16" onChange={(v) => set("cashPct",  v / 100)} />
        {!totalOk && (
          <p className="text-xs text-red-500 -mt-1">Allocations must sum to 100%</p>
        )}

        {/* Glide path toggle */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={inputs.useGlidePath}
            onChange={(e) => set("useGlidePath", e.target.checked)}
            className="accent-[#664930] w-4 h-4"
          />
          <span className="text-sm text-gray-700">Enable glide path</span>
        </label>
        {inputs.useGlidePath && (
          <p className="text-xs text-gray-400 -mt-2 pl-6">
            Allocation gradually shifts to 20/60/20 (stocks/bonds/cash) by end of life
          </p>
        )}
      </div>

      <p className="text-xs text-gray-400 -mt-2">
        Inflation assumed at 2% annually · Cash earns ~2% nominal
      </p>
    </div>
  );
}
