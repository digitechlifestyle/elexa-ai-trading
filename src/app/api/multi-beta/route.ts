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

function logReturns(bars: Bar[]): { date: string; r: number }[] {
  const out: { date: string; r: number }[] = [];
  for (let i = 1; i < bars.length; i++) {
    out.push({ date: bars[i].t.slice(0, 10), r: Math.log(bars[i].c / bars[i - 1].c) });
  }
  return out;
}

function regression(x: number[], y: number[]) {
  const n = Math.min(x.length, y.length);
  if (n < 5) return { beta: 0, alpha: 0, r2: 0, correlation: 0 };
  const mx = x.slice(0, n).reduce((s, v) => s + v, 0) / n;
  const my = y.slice(0, n).reduce((s, v) => s + v, 0) / n;
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) {
    const a = x[i] - mx, b = y[i] - my;
    num += a * b; dx += a * a; dy += b * b;
  }
  const beta = dx === 0 ? 0 : num / dx;
  const alpha = my - beta * mx;
  const corr = Math.sqrt(dx * dy) === 0 ? 0 : num / Math.sqrt(dx * dy);
  return { beta, alpha, r2: corr * corr, correlation: corr };
}

const BENCHMARKS = ["SPY", "QQQ", "IWM", "BTC", "GLD"];

export const POST = withApi(async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { symbol, days = 365 } = await request.json();
  if (!symbol) return NextResponse.json({ error: "Invalid symbol" }, { status: 422 });

  const origin = request.nextUrl.origin;
  const cookie = request.headers.get("cookie") || "";

  const target = await getBars(origin, cookie, symbol, days);
  if (target.length < 30) return NextResponse.json({ error: "Not enough data for target" }, { status: 422 });
  const tR = logReturns(target);
  const tMap = new Map(tR.map((r) => [r.date, r.r]));

  const results = await Promise.all(BENCHMARKS.map(async (bench) => {
    const bBars = await getBars(origin, cookie, bench, days);
    const bR = logReturns(bBars);
    const x: number[] = [];
    const y: number[] = [];
    for (const r of bR) {
      const ty = tMap.get(r.date);
      if (ty != null) { x.push(r.r); y.push(ty); }
    }
    if (x.length < 10) return { benchmark: bench, beta: null, alpha: null, r2: null, correlation: null };
    const reg = regression(x, y);
    return {
      benchmark: bench,
      beta: reg.beta,
      alpha_annualised: reg.alpha * 252 * 100, // % per year
      r2: reg.r2,
      correlation: reg.correlation,
      n: x.length,
    };
  }));

  return NextResponse.json({ symbol, days, results });
});
