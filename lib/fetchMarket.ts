export interface Quote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
}

const DISPLAY_NAMES: Record<string, string> = {
  "^GSPC": "S&P 500",
  "^DJI": "Dow Jones",
  "^IXIC": "NASDAQ",
  "^RUT": "Russell 2000",
};

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function parseCookies(headers: Headers): string {
  // Node 18+ supports getSetCookie(); fall back to get() for older runtimes
  const raw: string[] =
    typeof (headers as unknown as { getSetCookie?: () => string[] }).getSetCookie === "function"
      ? (headers as unknown as { getSetCookie: () => string[] }).getSetCookie()
      : (headers.get("set-cookie") ?? "").split(/,(?=[^ ])/).filter(Boolean);
  return raw.map((c) => c.split(";")[0]).join("; ");
}

export async function fetchMarketQuotes(): Promise<Quote[]> {
  const symbols = ["^GSPC", "^DJI", "^IXIC", "^RUT"];

  // ── Step 1: hit fc.yahoo.com to acquire session cookies ──────────────────
  const cookieRes = await fetch("https://fc.yahoo.com", {
    headers: { "User-Agent": UA },
    redirect: "follow",
  });
  const cookieStr = parseCookies(cookieRes.headers);

  // ── Step 2: get crumb ─────────────────────────────────────────────────────
  const crumbRes = await fetch(
    "https://query2.finance.yahoo.com/v1/test/getcrumb",
    { headers: { "User-Agent": UA, Cookie: cookieStr } }
  );
  if (!crumbRes.ok) throw new Error("crumb fetch failed");
  const crumb = (await crumbRes.text()).trim();
  if (!crumb || crumb.length > 20) throw new Error("invalid crumb");

  // ── Step 3: fetch quotes ──────────────────────────────────────────────────
  const url =
    `https://query2.finance.yahoo.com/v8/finance/quote` +
    `?symbols=${encodeURIComponent(symbols.join(","))}` +
    `&crumb=${encodeURIComponent(crumb)}` +
    `&fields=shortName,regularMarketPrice,regularMarketChange,regularMarketChangePercent`;

  const res = await fetch(url, {
    headers: { "User-Agent": UA, Cookie: cookieStr },
  });
  if (!res.ok) throw new Error(`quote fetch failed: ${res.status}`);

  const data = await res.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const results: any[] = data?.quoteResponse?.result ?? [];

  return results.map((q) => ({
    symbol: q.symbol,
    name: DISPLAY_NAMES[q.symbol] ?? q.shortName ?? q.symbol,
    price: q.regularMarketPrice ?? 0,
    change: q.regularMarketChange ?? 0,
    changePct: q.regularMarketChangePercent ?? 0,
  }));
}
