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

async function returns(symbol: string, days: number): Promise<number[]> {
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
  const r: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    if (closes[i - 1] > 0) r.push(closes[i] / closes[i - 1] - 1);
  }
  return r;
}

function mean(a: number[]): number {
  return a.length === 0 ? 0 : a.reduce((s, v) => s + v, 0) / a.length;
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
  if (!body || typeof body.symbol !== "string") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const symbol = body.symbol.toUpperCase().trim();
  if (!/^[A-Z0-9./-]{1,12}$/.test(symbol)) {
    return NextResponse.json({ error: "Invalid symbol" }, { status: 422 });
  }
  const benchmark = (body.benchmark ?? "SPY").toUpperCase();
  const days = Math.max(60, Math.min(365, Number(body.days) || 180));

  const [a, b] = await Promise.all([returns(symbol, days), returns(benchmark, days)]);
  const n = Math.min(a.length, b.length);
  if (n < 30) {
    return NextResponse.json({ error: "Insufficient overlap" }, { status: 422 });
  }
  const aa = a.slice(-n);
  const bb = b.slice(-n);
  const ma = mean(aa);
  const mb = mean(bb);
  // Beta = covariance(a,b) / variance(b)
  let cov = 0;
  let varB = 0;
  for (let i = 0; i < n; i++) {
    cov += (aa[i] - ma) * (bb[i] - mb);
    varB += (bb[i] - mb) ** 2;
  }
  cov /= n - 1;
  varB /= n - 1;
  const beta = varB > 0 ? cov / varB : 0;
  // Alpha (daily) = ma - beta * mb. Annualize × 252.
  const alphaDaily = ma - beta * mb;
  const alphaAnnual = alphaDaily * 252;
  // R-squared
  const stdA = Math.sqrt(aa.reduce((s, v) => s + (v - ma) ** 2, 0) / (n - 1));
  const stdB = Math.sqrt(varB);
  const corr = stdA > 0 && stdB > 0 ? cov / (stdA * stdB) : 0;
  const r_squared = corr * corr;

  return NextResponse.json({
    symbol,
    benchmark,
    days,
    sample_n: n,
    beta,
    alpha_annual_pct: alphaAnnual * 100,
    correlation: corr,
    r_squared,
  });
});
