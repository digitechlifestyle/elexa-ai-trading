import { createClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/observability/api-handler";
import { NextResponse } from "next/server";

// Same broad classification used in stress test
const CRYPTO_SYMBOLS = new Set([
  "BTC","ETH","SOL","XRP","DOGE","SHIB","PEPE","AAVE","ADA","ARB","AVAX",
  "BCH","BONK","CRV","DOT","FIL","GRT","LDO","LINK","LTC","MATIC","ONDO",
  "PAXG","POL","RENDER","SKY","SUSHI","TRUMP","UNI","USDC","USDG","USDT",
  "WIF","XLM","HBAR","ATOM","ALGO","ICP","NEAR","KAVA","XTZ","YFI","BAT","HYPE",
]);
const BOND = new Set(["TLT", "IEF", "SHY", "BND", "AGG", "HYG", "LQD"]);
const GOLD = new Set(["GLD", "IAU", "SGOL", "PAXG"]);
const COMMODITY = new Set(["USO", "BNO", "UNG", "DBA", "DBC", "CPER", "SLV"]);
const DOLLAR = new Set(["UUP"]);

// Crude sector map for top stocks (extendable)
const SECTOR: Record<string, string> = {
  AAPL: "Technology", MSFT: "Technology", NVDA: "Technology", AMD: "Technology",
  GOOGL: "Communication", META: "Communication", NFLX: "Communication", DIS: "Communication",
  AMZN: "Consumer Disc.", TSLA: "Consumer Disc.", HD: "Consumer Disc.", MCD: "Consumer Disc.", NKE: "Consumer Disc.",
  WMT: "Consumer Staples", COST: "Consumer Staples", KO: "Consumer Staples", PG: "Consumer Staples",
  JPM: "Financials", BAC: "Financials", GS: "Financials", MS: "Financials", WFC: "Financials", V: "Financials", MA: "Financials",
  JNJ: "Healthcare", PFE: "Healthcare", LLY: "Healthcare", UNH: "Healthcare", MRK: "Healthcare", ABBV: "Healthcare",
  XOM: "Energy", CVX: "Energy", COP: "Energy",
  BA: "Industrials", CAT: "Industrials", GE: "Industrials", UPS: "Industrials",
  LIN: "Materials", SHW: "Materials",
  AMT: "Real Estate", PLD: "Real Estate",
};

function classify(symbol: string): string {
  const s = symbol.toUpperCase();
  if (CRYPTO_SYMBOLS.has(s) || s.includes("/")) return "Crypto";
  if (BOND.has(s)) return "Bonds";
  if (GOLD.has(s)) return "Gold";
  if (COMMODITY.has(s)) return "Commodities";
  if (DOLLAR.has(s)) return "Dollar";
  if (SECTOR[s]) return SECTOR[s];
  // ETFs heuristics
  if (s === "SPY" || s === "QQQ" || s === "IWM" || s === "DIA" || s.startsWith("XL")) return "Broad ETF";
  return "Other";
}

export const GET = withApi(async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: trades } = await supabase
    .from("trades")
    .select("symbol, side, qty, filled_price, status")
    .eq("user_id", user.id)
    .eq("status", "filled");

  if (!trades || trades.length === 0) {
    return NextResponse.json({ empty: true });
  }

  const positions = new Map<string, { qty: number; cost: number }>();
  for (const t of trades) {
    const cur = positions.get(t.symbol) ?? { qty: 0, cost: 0 };
    const sign = t.side === "buy" ? 1 : -1;
    cur.qty += sign * Number(t.qty);
    cur.cost += sign * Number(t.qty) * Number(t.filled_price ?? 0);
    positions.set(t.symbol, cur);
  }
  const holdings = Array.from(positions.entries())
    .filter(([, p]) => Math.abs(p.qty) > 1e-9)
    .map(([symbol, p]) => ({
      symbol,
      value: Math.abs(p.cost),
      sector: classify(symbol),
    }));

  if (holdings.length === 0) {
    return NextResponse.json({ empty: true });
  }

  const totalValue = holdings.reduce((s, h) => s + h.value, 0);

  // Per-position weights
  const byPosition = holdings
    .map((h) => ({ symbol: h.symbol, sector: h.sector, value: h.value, weight_pct: (h.value / totalValue) * 100 }))
    .sort((a, b) => b.weight_pct - a.weight_pct);

  // Per-sector aggregation
  const bySector = new Map<string, { value: number; positions: number }>();
  for (const h of holdings) {
    const cur = bySector.get(h.sector) ?? { value: 0, positions: 0 };
    cur.value += h.value;
    cur.positions += 1;
    bySector.set(h.sector, cur);
  }
  const sectorRows = Array.from(bySector.entries())
    .map(([sector, v]) => ({ sector, value: v.value, positions: v.positions, weight_pct: (v.value / totalValue) * 100 }))
    .sort((a, b) => b.weight_pct - a.weight_pct);

  // Concentration metrics
  const top1 = byPosition[0]?.weight_pct ?? 0;
  const top3 = byPosition.slice(0, 3).reduce((s, p) => s + p.weight_pct, 0);
  const top5 = byPosition.slice(0, 5).reduce((s, p) => s + p.weight_pct, 0);
  const hhi = byPosition.reduce((s, p) => s + p.weight_pct ** 2, 0);
  // HHI = sum of (weight%)^2. 10000 = 100% in one. <1500 = competitive.

  return NextResponse.json({
    total_value: totalValue,
    positions_count: byPosition.length,
    sectors_count: sectorRows.length,
    top1_pct: top1,
    top3_pct: top3,
    top5_pct: top5,
    hhi,
    by_position: byPosition,
    by_sector: sectorRows,
  });
});
