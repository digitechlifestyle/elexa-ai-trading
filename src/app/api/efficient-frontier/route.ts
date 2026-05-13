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

/**
 * Monte Carlo efficient frontier — random portfolio weights, compute return + vol.
 * For each random weight vector, compute portfolio return + variance.
 * Find: max-Sharpe and min-vol portfolios.
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
    .slice(0, 10);
  const days = Math.max(60, Math.min(365, Number(body.days) || 180));
  if (symbols.length < 2) {
    return NextResponse.json({ error: "Need at least 2 symbols" }, { status: 422 });
  }
  const samples = Math.max(500, Math.min(5000, Number(body.samples) || 2000));

  // Fetch returns for each
  const seriesByAsset: Record<string, number[]> = {};
  await Promise.all(
    symbols.map(async (s) => {
      seriesByAsset[s] = await returns(s, days);
    })
  );
  const n = Math.min(...symbols.map((s) => seriesByAsset[s].length));
  if (n < 30) {
    return NextResponse.json({ error: "Insufficient overlap" }, { status: 422 });
  }
  // Align — take last n returns for each
  const aligned: number[][] = symbols.map((s) => seriesByAsset[s].slice(-n));
  const means = aligned.map(mean);
  // Covariance matrix
  const k = symbols.length;
  const cov: number[][] = Array.from({ length: k }, () => Array(k).fill(0));
  for (let i = 0; i < k; i++) {
    for (let j = i; j < k; j++) {
      let s = 0;
      for (let t = 0; t < n; t++) {
        s += (aligned[i][t] - means[i]) * (aligned[j][t] - means[j]);
      }
      const c = s / (n - 1);
      cov[i][j] = c;
      cov[j][i] = c;
    }
  }

  // Monte Carlo random weights (Dirichlet via random + normalise)
  const riskFreeAnnual = 0.04;
  const points: { ret: number; vol: number; sharpe: number; weights: number[] }[] = [];

  let maxSharpe = { ret: 0, vol: 0, sharpe: -Infinity, weights: [] as number[] };
  let minVol = { ret: 0, vol: Infinity, sharpe: 0, weights: [] as number[] };

  for (let s = 0; s < samples; s++) {
    // Random weights summing to 1
    const raw = Array.from({ length: k }, () => Math.random());
    const sum = raw.reduce((a, b) => a + b, 0);
    const w = raw.map((x) => x / sum);
    // Portfolio daily return
    let portRet = 0;
    for (let i = 0; i < k; i++) portRet += w[i] * means[i];
    // Portfolio variance
    let portVar = 0;
    for (let i = 0; i < k; i++) {
      for (let j = 0; j < k; j++) {
        portVar += w[i] * w[j] * cov[i][j];
      }
    }
    const portVol = Math.sqrt(Math.max(portVar, 0));
    const annRet = ((1 + portRet) ** 252 - 1) * 100;
    const annVol = portVol * Math.sqrt(252) * 100;
    const sharpe = annVol > 0 ? (annRet - riskFreeAnnual * 100) / annVol : 0;

    const point = { ret: annRet, vol: annVol, sharpe, weights: w };
    points.push(point);
    if (sharpe > maxSharpe.sharpe) maxSharpe = point;
    if (annVol < minVol.vol) minVol = point;
  }

  return NextResponse.json({
    symbols,
    days,
    samples,
    points: points.slice(0, 1500), // cap return payload
    max_sharpe: maxSharpe,
    min_vol: minVol,
  });
});
