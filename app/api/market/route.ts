import { NextResponse } from "next/server";

export const revalidate = 300; // 5 minutes

interface YahooQuote {
  symbol: string;
  shortName?: string;
  longName?: string;
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
}

export async function GET() {
  try {
    const symbols = ["^GSPC", "^DJI", "^IXIC", "^RUT"].join(",");
    const fields = "shortName,regularMarketPrice,regularMarketChange,regularMarketChangePercent";
    const url = `https://query1.finance.yahoo.com/v8/finance/quote?symbols=${encodeURIComponent(symbols)}&fields=${fields}`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept": "application/json",
      },
      next: { revalidate: 300 },
    });

    if (!res.ok) throw new Error(`Yahoo Finance returned ${res.status}`);

    const data = await res.json();
    const results: YahooQuote[] = data?.quoteResponse?.result ?? [];

    const DISPLAY_NAMES: Record<string, string> = {
      "^GSPC": "S&P 500",
      "^DJI": "Dow Jones",
      "^IXIC": "NASDAQ",
      "^RUT": "Russell 2000",
    };

    const quotes = results.map((q) => ({
      symbol: q.symbol,
      name: DISPLAY_NAMES[q.symbol] ?? q.shortName ?? q.symbol,
      price: q.regularMarketPrice ?? 0,
      change: q.regularMarketChange ?? 0,
      changePct: q.regularMarketChangePercent ?? 0,
    }));

    return NextResponse.json(quotes);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
