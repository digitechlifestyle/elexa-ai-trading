import { createClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/observability/api-handler";
import { NextResponse } from "next/server";

// Default universe — major stocks + ETFs
const DEFAULT_UNIVERSE = [
  "AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "META", "TSLA", "AVGO",
  "ORCL", "AMD", "INTC", "CRM", "ADBE", "NFLX", "CSCO", "QCOM",
  "PLTR", "COIN", "SHOP", "UBER", "ABNB", "SNOW", "MDB",
  "JPM", "BAC", "GS", "MS", "WFC",
  "JNJ", "PFE", "LLY", "UNH", "MRK",
  "SPY", "QQQ", "IWM", "DIA",
  "XLF", "XLK", "XLE", "XLV", "XLY", "XLP", "XLI", "XLU", "XLB", "XLRE",
  "GLD", "SLV", "USO", "UNG", "TLT",
];

interface ScanResult {
  symbol: string;
  current: number;
  high_52w: number;
  low_52w: number;
  pct_from_high: number;
  pct_from_low: number;
  range_position: number; // 0 = at low, 1 = at high
}

async function fetchYearBars(symbol: string): Promise<number[]> {
  const end = new Date();
  const start = new Date(end.getTime() - 365 * 86400 * 1000);
  const url = `https://data.alpaca.markets/v2/stocks/${symbol}/bars?timeframe=1Day&start=${start.toISOString()}&end=${end.toISOString()}&limit=400&adjustment=split`;
  const res = await fetch(url, {
    headers: {
      "APCA-API-KEY-ID": process.env.ALPACA_API_KEY ?? "",
      "APCA-API-SECRET-KEY": process.env.ALPACA_API_SECRET ?? "",
    },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data?.bars ?? []).map((b: { c: number }) => b.c);
}

export const GET = withApi(async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const universeParam = url.searchParams.get("symbols");
  const universe = universeParam
    ? universeParam.split(",").map((s) => s.trim().toUpperCase()).slice(0, 50)
    : DEFAULT_UNIVERSE;

  const results: ScanResult[] = [];
  await Promise.all(
    universe.map(async (sym) => {
      const closes = await fetchYearBars(sym);
      if (closes.length < 50) return;
      const high = Math.max(...closes);
      const low = Math.min(...closes);
      const current = closes[closes.length - 1];
      if (high <= low) return;
      results.push({
        symbol: sym,
        current,
        high_52w: high,
        low_52w: low,
        pct_from_high: ((current - high) / high) * 100,
        pct_from_low: ((current - low) / low) * 100,
        range_position: (current - low) / (high - low),
      });
    })
  );

  // Sort by proximity to 52w high (best to worst)
  results.sort((a, b) => b.range_position - a.range_position);

  return NextResponse.json({
    results,
    near_highs: results.filter((r) => r.pct_from_high >= -3),
    near_lows: results.filter((r) => r.pct_from_low <= 3),
  });
});
