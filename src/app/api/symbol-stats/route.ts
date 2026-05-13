import { createClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/observability/api-handler";
import { NextRequest, NextResponse } from "next/server";

interface Bar { t: string; c: number; }

export const POST = withApi(async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { symbol, days = 365, rf = 0.04 } = await request.json();
  if (!symbol) return NextResponse.json({ error: "Invalid symbol" }, { status: 422 });

  const origin = request.nextUrl.origin;
  const r = await fetch(`${origin}/api/trading/bars?symbol=${encodeURIComponent(symbol)}&days=${days}`, { headers: { cookie: request.headers.get("cookie") || "" } });
  if (!r.ok) return NextResponse.json({ error: "Could not fetch bars" }, { status: 502 });
  const { bars } = await r.json();
  if (!bars || bars.length < 20) return NextResponse.json({ error: "Not enough bars" }, { status: 422 });

  const closes = (bars as Bar[]).map((b) => b.c);
  const dates = (bars as Bar[]).map((b) => b.t);
  const first = closes[0];
  const last = closes[closes.length - 1];
  const totalReturn = (last - first) / first;

  // Daily log returns
  const rets: number[] = [];
  for (let i = 1; i < closes.length; i++) rets.push(Math.log(closes[i] / closes[i - 1]));
  const n = rets.length;
  const mean = rets.reduce((s, v) => s + v, 0) / n;
  const variance = rets.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
  const sd = Math.sqrt(variance);
  const downSide = rets.filter((r) => r < 0);
  const downVar = downSide.length > 0 ? downSide.reduce((s, v) => s + v * v, 0) / downSide.length : 0;
  const downSd = Math.sqrt(downVar);

  const annMean = mean * 252;
  const annVol = sd * Math.sqrt(252);
  const annDownVol = downSd * Math.sqrt(252);
  const sharpe = annVol > 0 ? (annMean - rf) / annVol : 0;
  const sortino = annDownVol > 0 ? (annMean - rf) / annDownVol : 0;
  const yearsCovered = n / 252;
  const cagr = yearsCovered > 0 ? Math.pow(last / first, 1 / yearsCovered) - 1 : 0;

  // Max drawdown
  let peak = closes[0]; let maxDd = 0; let peakDate = dates[0]; let troughDate = dates[0];
  for (let i = 0; i < closes.length; i++) {
    if (closes[i] > peak) { peak = closes[i]; peakDate = dates[i]; }
    const dd = (closes[i] - peak) / peak;
    if (dd < maxDd) { maxDd = dd; troughDate = dates[i]; }
  }

  // Calmar = CAGR / |maxDD|
  const calmar = maxDd < 0 ? cagr / Math.abs(maxDd) : 0;

  // Win rate of daily returns
  const upDays = rets.filter((r) => r > 0).length;
  const winRate = (upDays / n) * 100;

  return NextResponse.json({
    symbol, days,
    first_price: first, last_price: last,
    total_return: totalReturn * 100,
    cagr: cagr * 100,
    annual_vol: annVol * 100,
    sharpe, sortino, calmar,
    max_drawdown: maxDd * 100,
    peak_date: peakDate.slice(0, 10),
    trough_date: troughDate.slice(0, 10),
    daily_win_rate: winRate,
    risk_free_rate: rf * 100,
  });
});
