import { createClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/observability/api-handler";
import { NextRequest, NextResponse } from "next/server";

interface Bar { c: number; }

/**
 * Hurst exponent via rescaled range (R/S) analysis.
 * H < 0.5: mean-reverting
 * H ≈ 0.5: random walk (Brownian)
 * H > 0.5: trending / persistent
 */
function hurstExponent(closes: number[]): number {
  // Use log returns
  const returns: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    returns.push(Math.log(closes[i] / closes[i - 1]));
  }
  if (returns.length < 40) return 0.5;

  const lags = [10, 20, 40, 80, 160].filter((l) => l < returns.length);
  const rs: number[] = [];
  for (const lag of lags) {
    const chunks = Math.floor(returns.length / lag);
    let sumRs = 0;
    for (let c = 0; c < chunks; c++) {
      const chunk = returns.slice(c * lag, (c + 1) * lag);
      const mean = chunk.reduce((s, v) => s + v, 0) / chunk.length;
      const dev = chunk.map((v) => v - mean);
      const cum: number[] = [];
      let acc = 0;
      for (const d of dev) { acc += d; cum.push(acc); }
      const range = Math.max(...cum) - Math.min(...cum);
      const sd = Math.sqrt(chunk.reduce((s, v) => s + (v - mean) ** 2, 0) / chunk.length);
      if (sd > 0) sumRs += range / sd;
    }
    rs.push(sumRs / chunks);
  }
  // Linear regression on log(lag) vs log(R/S)
  const x = lags.map(Math.log);
  const y = rs.map(Math.log);
  const n = x.length;
  const mx = x.reduce((s, v) => s + v, 0) / n;
  const my = y.reduce((s, v) => s + v, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (x[i] - mx) * (y[i] - my);
    den += (x[i] - mx) ** 2;
  }
  return den === 0 ? 0.5 : num / den;
}

export const POST = withApi(async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { symbol, days = 365 } = await request.json();
  if (!symbol) return NextResponse.json({ error: "Invalid symbol" }, { status: 422 });

  const origin = request.nextUrl.origin;
  const r = await fetch(
    `${origin}/api/trading/bars?symbol=${encodeURIComponent(symbol)}&days=${days}`,
    { headers: { cookie: request.headers.get("cookie") || "" } }
  );
  if (!r.ok) return NextResponse.json({ error: "Could not fetch bars" }, { status: 502 });
  const { bars } = await r.json();
  if (!bars || bars.length < 100) {
    return NextResponse.json({ error: "Need at least 100 bars" }, { status: 422 });
  }

  const h = hurstExponent((bars as Bar[]).map((b) => b.c));
  let regime = "Random walk";
  let advice = "No persistent edge from trend or mean-reversion.";
  let color = "text-amber-400";
  if (h < 0.4) { regime = "Mean reverting"; advice = "Fade extremes. Buy dips, sell rips."; color = "text-blue-400"; }
  else if (h < 0.45) { regime = "Mildly mean reverting"; advice = "Slight reversion edge."; color = "text-blue-300"; }
  else if (h > 0.6) { regime = "Trending"; advice = "Trend-follow. Buy strength, sell weakness."; color = "text-green-400"; }
  else if (h > 0.55) { regime = "Mildly trending"; advice = "Slight trend edge."; color = "text-green-300"; }

  return NextResponse.json({ symbol, hurst: h, regime, advice, color });
});
