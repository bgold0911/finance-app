"use client";

import { useEffect, useState } from "react";

interface Quote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
}

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function QuoteItem({ q }: { q: Quote }) {
  const up = q.change >= 0;
  return (
    <span className="inline-flex items-center gap-2 px-5 shrink-0">
      <span className="text-white/70 text-xs font-medium">{q.name}</span>
      <span className="text-white text-xs font-bold">{fmt(q.price)}</span>
      <span className={`text-xs font-semibold ${up ? "text-green-400" : "text-red-400"}`}>
        {up ? "▲" : "▼"} {Math.abs(q.changePct).toFixed(2)}%
      </span>
    </span>
  );
}

export default function StockTicker() {
  const [quotes, setQuotes] = useState<Quote[]>([]);

  async function load() {
    try {
      const res = await fetch("/api/market");
      if (res.ok) {
        const data: Quote[] = await res.json();
        setQuotes(data);
      }
    } catch {
      // silently hide on error
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  if (quotes.length === 0) return null;

  // Duplicate for seamless loop
  const items = [...quotes, ...quotes];

  return (
    <div className="bg-[#1c1c1e] h-9 overflow-hidden flex items-center border-b border-white/5">
      <style>{`
        @keyframes ticker-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ticker-track {
          display: flex;
          white-space: nowrap;
          animation: ticker-scroll 30s linear infinite;
        }
        .ticker-track:hover {
          animation-play-state: paused;
        }
      `}</style>
      <div className="ticker-track">
        {items.map((q, i) => (
          <span key={i} className="inline-flex items-center">
            <QuoteItem q={q} />
            <span className="text-white/20 text-xs select-none">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}
