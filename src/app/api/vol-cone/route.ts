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

async function fetchCloses(symbol: string, days: number): Promise<number[]> {
  const sym = normalize(symbol);
  const end = new Date();
  const start = new Date(end.getTime() - days * 86400 * 1000);
  const url = isCrypto(symbol)
    ? `https://data.alpaca.markets/v1beta3/crypto/us/bars?symbols=${encodeURIComponent(sym)}&timeframe=1Day&start=${start.toISOString()}&end=${end.toISOString()}&limit=2000`
    : `https://data.alpaca.markets/v2/stocks/${sym}/bars?timeframe=1Day&start=${start.toISOString()}&end=${end.toISOString()}&limit=2000&adjustment=split`;
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
  return bars.map((b) => b.c);
}

function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.floor(p * (sorted.length - 1));
  return sorted[idx];
}

function logReturns(closes: number[]): number[] {
  const r: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    if (closes[i - 1] > 0 && closes[i] > 0) {
      r.push(Math.log(closes[i] / closes[i - 1]));
    }
  }
  return r;
}

function annualisedVolForWindow(returns: number[], window: number): number {
  // For each rolling window, compute realised vol annualised
  if (returns.length < window + 1) return 0;
  let sumSq = 0;
  for (let i = 0; i < window; i++) {
    sumSq += returns[i] ** 2;
  }
  // Use the latest window
  const startIdx = returns.length - window;
  let sum = 0;
  for (let i = startIdx; i < returns.length; i++) {
    sum += returns[i] ** 2;
  }
  // Std deviation of log returns over window
  const variance = sum / window;
  return Math.sqrt(variance * 252);
}

interface ConeRow {
  window_days: number;
  min: number;
  p10: number;
  p25: number;
  median: number;
  p75: number;
  p90: number;
  max: number;
  current: number;
}

export const GET = withApi(async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(request.url);
  const symbol = (url.searchParams.get("symbol") || "SPY").toUpperCase().trim();
  if (!/^[A-Z0-9./-]{1,12}$/.test(symbol)) {
    return NextResponse.json({ error: "Invalid symbol" }, { status: 422 });
  }
  const years = Math.max(1, Math.min(5, Number(url.searchParams.get("years")) || 3));

  const closes = await fetchCloses(symbol, years * 365);
  if (closes.length < 100) {
    return NextResponse.json({ error: "Insufficient history" }, { status: 422 });
  }
  const returns = logReturns(closes);

  const windows = [10, 20, 30, 60, 90, 180, 365];
  const rows: ConeRow[] = [];

  for (const w of windows) {
    if (returns.length < w + 10) continue;
    // Build rolling annualised vol history for this window
    const vols: number[] = [];
    for (let i = w; i <= returns.length; i++) {
      const slice = returns.slice(i - w, i);
      const variance =
        slice.reduce((s, v) => s + v * v, 0) / slice.length;
      vols.push(Math.sqrt(variance * 252) * 100);
    }
    if (vols.length === 0) continue;
    const current = annualisedVolForWindow(returns, w) * 100;
    rows.push({
      window_days: w,
      min: Math.min(...vols),
      p10: percentile(vols, 0.1),
      p25: percentile(vols, 0.25),
      median: percentile(vols, 0.5),
      p75: percentile(vols, 0.75),
      p90: percentile(vols, 0.9),
      max: Math.max(...vols),
      current,
    });
  }

  return NextResponse.json({ symbol, years, rows });
});
