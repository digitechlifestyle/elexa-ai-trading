import { createClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/observability/api-handler";
import { NextRequest, NextResponse } from "next/server";

interface Bar { t: string; o: number; h: number; l: number; c: number; }

export const POST = withApi(async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { symbol, days = 90 } = await request.json();
  if (!symbol) return NextResponse.json({ error: "Invalid symbol" }, { status: 422 });

  const origin = request.nextUrl.origin;
  const r = await fetch(`${origin}/api/trading/bars?symbol=${encodeURIComponent(symbol)}&days=${days}`, { headers: { cookie: request.headers.get("cookie") || "" } });
  if (!r.ok) return NextResponse.json({ error: "Could not fetch bars" }, { status: 502 });
  const { bars } = await r.json();
  if (!bars || bars.length < 10) return NextResponse.json({ error: "Not enough bars" }, { status: 422 });

  // Heikin-Ashi formula:
  //  HA_Close = (O + H + L + C) / 4
  //  HA_Open = (prev HA_Open + prev HA_Close) / 2
  //  HA_High = max(H, HA_Open, HA_Close)
  //  HA_Low  = min(L, HA_Open, HA_Close)
  const ha: { t: string; o: number; h: number; l: number; c: number; bullish: boolean }[] = [];
  for (let i = 0; i < bars.length; i++) {
    const b = bars[i] as Bar;
    const hac = (b.o + b.h + b.l + b.c) / 4;
    const hao = i === 0 ? (b.o + b.c) / 2 : (ha[i - 1].o + ha[i - 1].c) / 2;
    const hah = Math.max(b.h, hao, hac);
    const hal = Math.min(b.l, hao, hac);
    ha.push({ t: b.t, o: hao, h: hah, l: hal, c: hac, bullish: hac >= hao });
  }

  // Count consecutive same-color candles at the end
  let streak = 1;
  const lastDir = ha[ha.length - 1].bullish;
  for (let i = ha.length - 2; i >= 0; i--) {
    if (ha[i].bullish === lastDir) streak++;
    else break;
  }

  // Doji-ish: open ≈ close on HA (small body, signals indecision/reversal)
  const last = ha[ha.length - 1];
  const bodyPct = Math.abs(last.c - last.o) / last.c * 100;
  const upperWick = last.h - Math.max(last.o, last.c);
  const lowerWick = Math.min(last.o, last.c) - last.l;
  const noWick = lastDir ? lowerWick : upperWick;
  const strongTrend = bodyPct > 0.5 && noWick < (last.h - last.l) * 0.1;

  let signal = "Sideways";
  let color = "text-amber-400";
  if (lastDir && strongTrend) { signal = "Strong uptrend"; color = "text-green-400"; }
  else if (!lastDir && strongTrend) { signal = "Strong downtrend"; color = "text-red-400"; }
  else if (lastDir) { signal = "Uptrend"; color = "text-green-300"; }
  else { signal = "Downtrend"; color = "text-red-300"; }

  return NextResponse.json({
    symbol,
    last: { ...last, body_pct: bodyPct, upper_wick: upperWick, lower_wick: lowerWick },
    streak,
    direction: lastDir ? "up" : "down",
    signal, color,
    strong_trend: strongTrend,
    series: ha.slice(-60),
  });
});
