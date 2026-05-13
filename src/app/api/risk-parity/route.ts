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

async function dailyReturns(symbol: string, days: number): Promise<number[]> {
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
  const bars: { c: number }[] = isCrypto(symbol)
    ? data?.bars?.[sym] ?? []
    : data?.bars ?? [];
  const closes = bars.map((b) => b.c);
  const r: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    if (closes[i - 1] > 0) r.push(closes[i] / closes[i - 1] - 1);
  }
  return r;
}

function stdev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = arr.reduce((s, v) => s + v, 0) / arr.length;
  const v = arr.reduce((s, x) => s + (x - m) ** 2, 0) / (arr.length - 1);
  return Math.sqrt(v);
}

/**
 * Inverse-volatility (a.k.a. naive risk parity) weights.
 * Each asset weighted as (1/vol) / sum(1/vol).
 * Risk contribution under independence = equal.
 */
export const POST = withApi(async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || !Array.isArray(body.symbols)) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const symbols = (body.symbols as string[])
    .map((s) => String(s).toUpperCase().trim())
    .filter((s) => /^[A-Z0-9./-]{1,12}$/.test(s))
    .slice(0, 15);
  const days = Math.max(30, Math.min(365, Number(body.days) || 90));
  if (symbols.length < 2) {
    return NextResponse.json(
      { error: "Need at least 2 symbols" },
      { status: 422 }
    );
  }

  const volByAsset: Record<string, number> = {};
  await Promise.all(
    symbols.map(async (s) => {
      const r = await dailyReturns(s, days);
      const sd = stdev(r);
      volByAsset[s] = sd > 0 ? sd : 0;
    })
  );

  // Compute inverse-vol weights
  const valid = Object.entries(volByAsset).filter(([, v]) => v > 0);
  if (valid.length === 0) {
    return NextResponse.json(
      { error: "Couldn't compute volatility for any symbol" },
      { status: 422 }
    );
  }
  const invSum = valid.reduce((s, [, v]) => s + 1 / v, 0);
  const weights: { symbol: string; weight_pct: number; vol_ann_pct: number }[] =
    valid.map(([s, v]) => ({
      symbol: s,
      weight_pct: ((1 / v) / invSum) * 100,
      vol_ann_pct: v * Math.sqrt(252) * 100,
    }));
  weights.sort((a, b) => b.weight_pct - a.weight_pct);

  // Equal-weight benchmark for comparison
  const eqWeight = 100 / symbols.length;
  const equalWeight = symbols.map((s) => ({
    symbol: s,
    weight_pct: eqWeight,
    vol_ann_pct: (volByAsset[s] ?? 0) * Math.sqrt(252) * 100,
  }));

  return NextResponse.json({
    days,
    inverse_vol: weights,
    equal_weight: equalWeight,
  });
});
