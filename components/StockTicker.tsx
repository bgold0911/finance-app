"use client";

import { useEffect, useRef } from "react";

const WIDGET_CONFIG = {
  symbols: [
    { proName: "FOREXCOM:SPXUSD", title: "S&P 500" },
    { proName: "FOREXCOM:DJI",    title: "Dow Jones" },
    { proName: "NASDAQ:NDX",      title: "NASDAQ 100" },
    { proName: "TVC:RUT",         title: "Russell 2000" },
    { proName: "BITSTAMP:BTCUSD", title: "Bitcoin" },
  ],
  showSymbolLogo: false,
  colorTheme: "dark",
  isTransparent: true,
  displayMode: "compact",
  locale: "en",
};

export default function StockTicker() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    // Clear any previous widget (e.g. strict mode double-mount)
    ref.current.innerHTML = '<div class="tradingview-widget-container__widget"></div>';

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    script.async = true;
    script.innerHTML = JSON.stringify(WIDGET_CONFIG);
    ref.current.appendChild(script);
  }, []);

  return (
    <div className="bg-[#1c1c1e] border-b border-white/5" style={{ height: 46, overflow: "hidden" }}>
      <div ref={ref} className="tradingview-widget-container" style={{ height: 46 }}>
        <div className="tradingview-widget-container__widget" />
      </div>
    </div>
  );
}
