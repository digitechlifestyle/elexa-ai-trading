import { createClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/observability/api-handler";
import { NextRequest, NextResponse } from "next/server";

interface Bar { t: string; c: number; }

async function getBars(origin: string, cookie: string, sym: string, days: number): Promise<Bar[]> {
  const r = await fetch(`${origin}/api/trading/bars?symbol=${encodeURIComponent(sym)}&days=${days}`, { headers: { cookie } });
  if (!r.ok) return [];
  const j = await r.json();
  return j.bars ?? [];
}

function logReturns(bars: Bar[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < bars.length; i++) out.push(Math.log(bars[i].c / bars[i - 1].c));
  return out;
}

function annualVol(rets: number[]): number {
  if (rets.length < 2) return 0;
  const m = rets.reduce((s, v) => s + v, 0) / rets.length;
  const variance = rets.reduce((s, v) => s + (v - m) ** 2, 0) / rets.length;
  return Math.sqrt(variance) * Math.sqrt(252);
}

function annualMean(rets: number[]): number {
  if (rets.length === 0) return 0;
  return (rets.reduce((s, v) => s + v, 0) / rets.length) * 252;
}

export const POST = withApi(async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { symbols, capital = 10000, rf = 0.04, days = 365 } = await request.json();
  if (!Array.isArray(symbols) || symbols.length < 2 || symbols.length > 10) {
    return NextResponse.json({ error: "2-10 symbols required" }, { status: 422 });
  }

  const origin = request.nextUrl.origin;
  const cookie = request.headers.get("cookie") || "";

  const data = await Promise.all(symbols.map(async (s: string) => {
    const sym = s.toUpperCase().trim();
    const bars = await getBars(origin, cookie, sym, days);
    const rets = logReturns(bars);
    return {
      symbol: sym,
      rets,
      vol: annualVol(rets),
      mean: annualMean(rets),
    };
  }));

  const valid = data.filter((d) => d.rets.length > 30);
  if (valid.length < 2) return NextResponse.json({ error: "Not enough data" }, { status: 422 });

  // Strategy 1: Equal weight
  const n = valid.length;
  const equal = valid.map((d) => ({ symbol: d.symbol, weight: 1 / n }));

  // Strategy 2: Inverse volatility
  const invVolSum = valid.reduce((s, d) => s + (d.vol > 0 ? 1 / d.vol : 0), 0);
  const invVol = valid.map((d) => ({
    symbol: d.symbol,
    weight: invVolSum > 0 && d.vol > 0 ? (1 / d.vol) / invVolSum : 0,
  }));

  // Strategy 3: "Risk-adjusted return" weight (single-asset Sharpe)
  const sharpes = valid.map((d) => Math.max(0, d.vol > 0 ? (d.mean - rf) / d.vol : 0));
  const sumSharpe = sharpes.reduce((s, v) => s + v, 0);
  const maxSharpe = valid.map((d, i) => ({
    symbol: d.symbol,
    weight: sumSharpe > 0 ? sharpes[i] / sumSharpe : 1 / n,
  }));

  function withDollars(weights: { symbol: string; weight: number }[]) {
    return weights.map((w) => ({ ...w, dollars: w.weight * capital }));
  }

  return NextResponse.json({
    capital,
    stats: valid.map((d) => ({
      symbol: d.symbol,
      annual_return_pct: d.mean * 100,
      annual_vol_pct: d.vol * 100,
      sharpe: d.vol > 0 ? (d.mean - rf) / d.vol : 0,
    })),
    allocations: {
      equal_weight: withDollars(equal),
      inverse_vol: withDollars(invVol),
      max_sharpe_proxy: withDollars(maxSharpe),
    },
  });
});
