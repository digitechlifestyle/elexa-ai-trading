import { createClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/observability/api-handler";
import { NextRequest, NextResponse } from "next/server";

interface Bar { c: number; }

async function pctChange(origin: string, cookie: string, sym: string, n: number): Promise<number | null> {
  try {
    const r = await fetch(`${origin}/api/trading/bars?symbol=${sym}&days=${n + 5}`, { headers: { cookie } });
    if (!r.ok) return null;
    const j = await r.json();
    const bars: Bar[] = j.bars ?? [];
    if (bars.length < n + 1) return null;
    const last = bars[bars.length - 1].c;
    const prev = bars[bars.length - 1 - n].c;
    return ((last - prev) / prev) * 100;
  } catch { return null; }
}

// Each signal returns 1 (risk-on), -1 (risk-off), 0 (neutral)
function signal(v: number | null, threshold: number, invert = false): number {
  if (v == null) return 0;
  const adj = invert ? -v : v;
  if (adj > threshold) return 1;
  if (adj < -threshold) return -1;
  return 0;
}

export const GET = withApi(async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const origin = request.nextUrl.origin;
  const cookie = request.headers.get("cookie") || "";

  const [spy, qqq, tlt, hyg, gld, uup, btc] = await Promise.all([
    pctChange(origin, cookie, "SPY", 5),
    pctChange(origin, cookie, "QQQ", 5),
    pctChange(origin, cookie, "TLT", 5),
    pctChange(origin, cookie, "HYG", 5),
    pctChange(origin, cookie, "GLD", 5),
    pctChange(origin, cookie, "UUP", 5),
    pctChange(origin, cookie, "BTC", 5),
  ]);

  // Indicators (risk-on direction)
  const indicators = [
    { name: "SPY (stocks)", value: spy, signal: signal(spy, 0.5), desc: "Up = risk on" },
    { name: "QQQ (tech)", value: qqq, signal: signal(qqq, 0.5), desc: "Up = risk on" },
    { name: "HYG (junk bonds)", value: hyg, signal: signal(hyg, 0.3), desc: "Up = risk on (credit appetite)" },
    { name: "BTC (crypto)", value: btc, signal: signal(btc, 1), desc: "Up = risk on" },
    { name: "TLT (treasuries)", value: tlt, signal: signal(tlt, 0.5, true), desc: "Down = risk on (capital leaving bonds)" },
    { name: "GLD (gold)", value: gld, signal: signal(gld, 0.5, true), desc: "Down = risk on (no flight to safety)" },
    { name: "UUP (dollar)", value: uup, signal: signal(uup, 0.5, true), desc: "Down = risk on (dollar funding cheaper)" },
  ];

  const score = indicators.reduce((s, i) => s + i.signal, 0);
  const max = indicators.length;
  let regime = "Mixed";
  let color = "text-amber-400";
  if (score >= max * 0.5) { regime = "Risk ON"; color = "text-green-400"; }
  else if (score >= 2) { regime = "Leaning risk on"; color = "text-green-300"; }
  else if (score <= -max * 0.5) { regime = "Risk OFF"; color = "text-red-400"; }
  else if (score <= -2) { regime = "Leaning risk off"; color = "text-red-300"; }

  return NextResponse.json({
    regime, color, score, max,
    period_days: 5,
    indicators,
  });
});
