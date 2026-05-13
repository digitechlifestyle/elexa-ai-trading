import { createClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/observability/api-handler";
import { NextResponse } from "next/server";

// Curated S&P 100 constituents tagged by GICS sector.
// Hardcoded mcap weight buckets (relative size for visual).
const UNIVERSE: { symbol: string; sector: string; weight: number }[] = [
  { symbol: "AAPL", sector: "Technology", weight: 100 },
  { symbol: "MSFT", sector: "Technology", weight: 95 },
  { symbol: "NVDA", sector: "Technology", weight: 100 },
  { symbol: "GOOGL", sector: "Communication", weight: 80 },
  { symbol: "AMZN", sector: "Consumer Disc.", weight: 75 },
  { symbol: "META", sector: "Communication", weight: 65 },
  { symbol: "TSLA", sector: "Consumer Disc.", weight: 55 },
  { symbol: "AVGO", sector: "Technology", weight: 55 },
  { symbol: "BRK.B", sector: "Financials", weight: 55 },
  { symbol: "ORCL", sector: "Technology", weight: 45 },
  { symbol: "JPM", sector: "Financials", weight: 50 },
  { symbol: "WMT", sector: "Consumer Staples", weight: 45 },
  { symbol: "LLY", sector: "Healthcare", weight: 45 },
  { symbol: "V", sector: "Financials", weight: 40 },
  { symbol: "MA", sector: "Financials", weight: 35 },
  { symbol: "XOM", sector: "Energy", weight: 40 },
  { symbol: "UNH", sector: "Healthcare", weight: 40 },
  { symbol: "JNJ", sector: "Healthcare", weight: 35 },
  { symbol: "PG", sector: "Consumer Staples", weight: 30 },
  { symbol: "HD", sector: "Consumer Disc.", weight: 30 },
  { symbol: "BAC", sector: "Financials", weight: 25 },
  { symbol: "ABBV", sector: "Healthcare", weight: 25 },
  { symbol: "COST", sector: "Consumer Staples", weight: 30 },
  { symbol: "CVX", sector: "Energy", weight: 25 },
  { symbol: "KO", sector: "Consumer Staples", weight: 25 },
  { symbol: "MRK", sector: "Healthcare", weight: 25 },
  { symbol: "PEP", sector: "Consumer Staples", weight: 22 },
  { symbol: "CRM", sector: "Technology", weight: 25 },
  { symbol: "ADBE", sector: "Technology", weight: 22 },
  { symbol: "AMD", sector: "Technology", weight: 35 },
  { symbol: "NFLX", sector: "Communication", weight: 28 },
  { symbol: "QCOM", sector: "Technology", weight: 20 },
  { symbol: "INTC", sector: "Technology", weight: 18 },
  { symbol: "CSCO", sector: "Technology", weight: 22 },
  { symbol: "DIS", sector: "Communication", weight: 18 },
  { symbol: "TMUS", sector: "Communication", weight: 22 },
  { symbol: "MCD", sector: "Consumer Disc.", weight: 22 },
  { symbol: "NKE", sector: "Consumer Disc.", weight: 15 },
  { symbol: "SBUX", sector: "Consumer Disc.", weight: 12 },
  { symbol: "PFE", sector: "Healthcare", weight: 15 },
  { symbol: "GS", sector: "Financials", weight: 18 },
  { symbol: "MS", sector: "Financials", weight: 18 },
  { symbol: "WFC", sector: "Financials", weight: 22 },
  { symbol: "BLK", sector: "Financials", weight: 15 },
  { symbol: "AMAT", sector: "Technology", weight: 18 },
  { symbol: "TXN", sector: "Technology", weight: 18 },
  { symbol: "IBM", sector: "Technology", weight: 18 },
  { symbol: "BA", sector: "Industrials", weight: 15 },
  { symbol: "CAT", sector: "Industrials", weight: 18 },
  { symbol: "GE", sector: "Industrials", weight: 18 },
  { symbol: "UPS", sector: "Industrials", weight: 12 },
  { symbol: "RTX", sector: "Industrials", weight: 15 },
  { symbol: "F", sector: "Consumer Disc.", weight: 8 },
  { symbol: "GM", sector: "Consumer Disc.", weight: 8 },
  { symbol: "NEE", sector: "Utilities", weight: 15 },
  { symbol: "DUK", sector: "Utilities", weight: 10 },
  { symbol: "SO", sector: "Utilities", weight: 10 },
  { symbol: "LIN", sector: "Materials", weight: 18 },
  { symbol: "SHW", sector: "Materials", weight: 10 },
  { symbol: "AMT", sector: "Real Estate", weight: 12 },
  { symbol: "PLD", sector: "Real Estate", weight: 12 },
];

interface Cell {
  symbol: string;
  sector: string;
  weight: number;
  change_pct: number | null;
  price: number | null;
}

async function fetchTwoBars(symbol: string): Promise<{ price: number; change: number } | null> {
  const end = new Date();
  const start = new Date(end.getTime() - 7 * 86400 * 1000);
  const url = `https://data.alpaca.markets/v2/stocks/${symbol}/bars?timeframe=1Day&start=${start.toISOString()}&end=${end.toISOString()}&limit=5&adjustment=split`;
  try {
    const res = await fetch(url, {
      headers: {
        "APCA-API-KEY-ID": process.env.ALPACA_API_KEY ?? "",
        "APCA-API-SECRET-KEY": process.env.ALPACA_API_SECRET ?? "",
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const bars: { c: number }[] = data?.bars ?? [];
    if (bars.length < 2) return null;
    const last = bars[bars.length - 1].c;
    const prev = bars[bars.length - 2].c;
    return { price: last, change: ((last - prev) / prev) * 100 };
  } catch {
    return null;
  }
}

export const GET = withApi(async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cells: Cell[] = await Promise.all(
    UNIVERSE.map(async (u) => {
      const r = await fetchTwoBars(u.symbol);
      return {
        symbol: u.symbol,
        sector: u.sector,
        weight: u.weight,
        price: r?.price ?? null,
        change_pct: r?.change ?? null,
      };
    })
  );

  // Group by sector + compute sector avg change
  const sectorMap = new Map<string, { cells: Cell[]; total_weight: number; weighted_change: number }>();
  for (const c of cells) {
    const cur = sectorMap.get(c.sector) ?? {
      cells: [],
      total_weight: 0,
      weighted_change: 0,
    };
    cur.cells.push(c);
    if (c.change_pct != null) {
      cur.total_weight += c.weight;
      cur.weighted_change += c.weight * c.change_pct;
    }
    sectorMap.set(c.sector, cur);
  }
  const sectors = Array.from(sectorMap.entries())
    .map(([name, v]) => ({
      sector: name,
      avg_change_pct: v.total_weight > 0 ? v.weighted_change / v.total_weight : 0,
      cells: v.cells.sort((a, b) => b.weight - a.weight),
    }))
    .sort((a, b) => b.avg_change_pct - a.avg_change_pct);

  return NextResponse.json({ sectors });
});
