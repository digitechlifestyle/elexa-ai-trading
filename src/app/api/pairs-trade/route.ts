import { createClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/observability/api-handler";
import { NextRequest, NextResponse } from "next/server";

interface Bar { t: string; c: number; }

function correlation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 2) return 0;
  const mx = x.slice(0, n).reduce((s, v) => s + v, 0) / n;
  const my = y.slice(0, n).reduce((s, v) => s + v, 0) / n;
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) {
    const a = x[i] - mx, b = y[i] - my;
    num += a * b; dx += a * a; dy += b * b;
  }
  return num / (Math.sqrt(dx * dy) || 1);
}

export const POST = withApi(async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { symbol_a, symbol_b, days = 180 } = await request.json();
  if (!symbol_a || !symbol_b) {
    return NextResponse.json({ error: "Need two symbols" }, { status: 422 });
  }

  const origin = request.nextUrl.origin;
  const cookie = request.headers.get("cookie") || "";

  const [ra, rb] = await Promise.all([
    fetch(`${origin}/api/trading/bars?symbol=${encodeURIComponent(symbol_a)}&days=${days}`, { headers: { cookie } }),
    fetch(`${origin}/api/trading/bars?symbol=${encodeURIComponent(symbol_b)}&days=${days}`, { headers: { cookie } }),
  ]);
  if (!ra.ok || !rb.ok) return NextResponse.json({ error: "Could not fetch bars" }, { status: 502 });

  const aBars: Bar[] = (await ra.json()).bars ?? [];
  const bBars: Bar[] = (await rb.json()).bars ?? [];
  if (!aBars.length || !bBars.length) return NextResponse.json({ error: "No bars" }, { status: 422 });

  // Align by date
  const mapB = new Map(bBars.map((b) => [b.t.slice(0, 10), b.c]));
  const aligned: { date: string; a: number; b: number }[] = [];
  for (const a of aBars) {
    const d = a.t.slice(0, 10);
    const bc = mapB.get(d);
    if (bc != null) aligned.push({ date: d, a: a.c, b: bc });
  }
  if (aligned.length < 30) return NextResponse.json({ error: "Not enough aligned data" }, { status: 422 });

  const aCloses = aligned.map((r) => r.a);
  const bCloses = aligned.map((r) => r.b);
  const corr = correlation(aCloses, bCloses);

  // Spread: log(A) - β·log(B), β from OLS on log prices
  const logA = aCloses.map(Math.log);
  const logB = bCloses.map(Math.log);
  const mA = logA.reduce((s, v) => s + v, 0) / logA.length;
  const mB = logB.reduce((s, v) => s + v, 0) / logB.length;
  let num = 0, den = 0;
  for (let i = 0; i < logA.length; i++) {
    num += (logB[i] - mB) * (logA[i] - mA);
    den += (logB[i] - mB) ** 2;
  }
  const beta = den === 0 ? 1 : num / den;
  const alpha = mA - beta * mB;

  const spread = logA.map((la, i) => la - (alpha + beta * logB[i]));
  const meanS = spread.reduce((s, v) => s + v, 0) / spread.length;
  const sdS = Math.sqrt(spread.reduce((s, v) => s + (v - meanS) ** 2, 0) / spread.length);
  const zScores = spread.map((s) => (sdS === 0 ? 0 : (s - meanS) / sdS));

  const series = aligned.map((r, i) => ({
    date: r.date,
    spread: spread[i],
    z: zScores[i],
  }));

  const currentZ = zScores[zScores.length - 1];
  let signal = "neutral";
  if (currentZ > 2) signal = `short ${symbol_a}, long ${symbol_b}`;
  else if (currentZ < -2) signal = `long ${symbol_a}, short ${symbol_b}`;
  else if (Math.abs(currentZ) < 0.5) signal = "mean reverted — exit";

  return NextResponse.json({
    symbol_a, symbol_b,
    correlation: corr, beta, alpha,
    current_z: currentZ, signal,
    spread_mean: meanS, spread_sd: sdS,
    series,
  });
});
