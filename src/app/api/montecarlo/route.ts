import { createClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/observability/api-handler";
import { NextRequest, NextResponse } from "next/server";

const ALPACA_CRYPTO_SYMBOLS = new Set([
  "AAVE","ADA","ARB","AVAX","BAT","BCH","BONK","BTC","CRV","DOGE","DOT","ETH",
  "FIL","GRT","HYPE","LDO","LINK","LTC","ONDO","PAXG","PEPE","POL","RENDER",
  "SHIB","SKY","SOL","SUSHI","TRUMP","UNI","USDC","USDG","USDT","WIF","XRP",
  "XTZ","YFI",
]);
function isCrypto(s: string) { return s.includes("/") || ALPACA_CRYPTO_SYMBOLS.has(s.toUpperCase()); }
function normalize(s: string) {
  const u = s.toUpperCase();
  if (u.includes("/")) return u;
  if (ALPACA_CRYPTO_SYMBOLS.has(u)) return `${u}/USD`;
  return u;
}

async function fetchReturns(symbol: string, days: number): Promise<number[]> {
  const sym = normalize(symbol);
  const end = new Date();
  const start = new Date(end.getTime() - days * 86400 * 1000);
  const url = isCrypto(symbol)
    ? `https://data.alpaca.markets/v1beta3/crypto/us/bars?symbols=${encodeURIComponent(sym)}&timeframe=1Day&start=${start.toISOString()}&end=${end.toISOString()}&limit=400`
    : `https://data.alpaca.markets/v2/stocks/${sym}/bars?timeframe=1Day&start=${start.toISOString()}&end=${end.toISOString()}&limit=400&adjustment=split`;
  const res = await fetch(url, {
    headers: {
      "APCA-API-KEY-ID": process.env.ALPACA_API_KEY ?? "",
      "APCA-API-SECRET-KEY": process.env.ALPACA_API_SECRET ?? "",
    },
  });
  if (!res.ok) return [];
  const data = await res.json();
  const bars: { c: number }[] = isCrypto(symbol) ? data?.bars?.[sym] ?? [] : data?.bars ?? [];
  const closes = bars.map((b) => b.c);
  const returns: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    if (closes[i - 1] > 0) returns.push(closes[i] / closes[i - 1] - 1);
  }
  return returns;
}

function meanStd(arr: number[]): { mean: number; std: number } {
  if (arr.length === 0) return { mean: 0, std: 0 };
  const mean = arr.reduce((s, v) => s + v, 0) / arr.length;
  const variance = arr.reduce((s, v) => s + (v - mean) ** 2, 0) / arr.length;
  return { mean, std: Math.sqrt(variance) };
}

// Box-Muller for standard normal
function gaussian(): number {
  let u = 0,
    v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

export const POST = withApi(async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const symbol = String(body.symbol ?? "").toUpperCase().trim();
  if (!/^[A-Z0-9./-]{1,12}$/.test(symbol)) {
    return NextResponse.json({ error: "Invalid symbol" }, { status: 422 });
  }
  const lookbackDays = Math.max(60, Math.min(365, Number(body.lookback_days) || 180));
  const horizonDays = Math.max(5, Math.min(365, Number(body.horizon_days) || 60));
  const paths = Math.max(20, Math.min(500, Number(body.paths) || 100));
  const starting_value = Math.max(100, Math.min(10_000_000, Number(body.starting_value) || 10000));

  const returns = await fetchReturns(symbol, lookbackDays);
  if (returns.length < 30) {
    return NextResponse.json(
      { error: `Not enough history (got ${returns.length}, need 30+)` },
      { status: 422 }
    );
  }

  const { mean, std } = meanStd(returns);

  // Generate paths
  const series: number[][] = [];
  const finals: number[] = [];
  for (let p = 0; p < paths; p++) {
    const path: number[] = [starting_value];
    let value = starting_value;
    for (let d = 0; d < horizonDays; d++) {
      const dailyReturn = mean + std * gaussian();
      value = value * (1 + dailyReturn);
      path.push(value);
    }
    series.push(path);
    finals.push(value);
  }

  finals.sort((a, b) => a - b);
  const pct = (q: number) => finals[Math.floor(q * finals.length)] ?? finals[finals.length - 1];

  // Build percentile envelope (5th, 50th, 95th) for each step
  const envelope: { step: number; p05: number; p50: number; p95: number }[] = [];
  for (let d = 0; d <= horizonDays; d++) {
    const slice = series.map((s) => s[d]).sort((a, b) => a - b);
    envelope.push({
      step: d,
      p05: slice[Math.floor(0.05 * slice.length)] ?? slice[0],
      p50: slice[Math.floor(0.5 * slice.length)] ?? slice[0],
      p95: slice[Math.floor(0.95 * slice.length)] ?? slice[slice.length - 1],
    });
  }

  // Sample a few full paths for visualisation (5)
  const sample_paths = series.slice(0, 5);

  return NextResponse.json({
    symbol,
    starting_value,
    horizon_days: horizonDays,
    paths,
    daily_mean: mean,
    daily_std: std,
    annualised_return_pct: ((1 + mean) ** 252 - 1) * 100,
    annualised_vol_pct: std * Math.sqrt(252) * 100,
    final_p05: pct(0.05),
    final_p50: pct(0.5),
    final_p95: pct(0.95),
    prob_positive:
      finals.filter((v) => v > starting_value).length / finals.length,
    envelope,
    sample_paths,
  });
});
