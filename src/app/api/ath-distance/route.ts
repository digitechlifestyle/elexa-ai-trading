import { createClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/observability/api-handler";
import { NextRequest, NextResponse } from "next/server";

interface Bar { t: string; h: number; l: number; c: number; }

export const POST = withApi(async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { symbols, lookback_days = 365 } = await request.json();
  if (!Array.isArray(symbols) || symbols.length === 0 || symbols.length > 50) {
    return NextResponse.json({ error: "1-50 symbols required" }, { status: 422 });
  }

  const origin = request.nextUrl.origin;
  const cookie = request.headers.get("cookie") || "";

  const results = await Promise.all(symbols.map(async (s: string) => {
    const sym = s.toUpperCase().trim();
    try {
      const r = await fetch(`${origin}/api/trading/bars?symbol=${encodeURIComponent(sym)}&days=${lookback_days}`, { headers: { cookie } });
      if (!r.ok) return { symbol: sym, error: true };
      const j = await r.json();
      const bars: Bar[] = j.bars ?? [];
      if (bars.length < 30) return { symbol: sym, error: true };
      const highBar = bars.reduce((a, b) => b.h > a.h ? b : a, bars[0]);
      const lowBar = bars.reduce((a, b) => b.l < a.l ? b : a, bars[0]);
      const last = bars[bars.length - 1].c;
      const fromHigh = ((last - highBar.h) / highBar.h) * 100;
      const fromLow = ((last - lowBar.l) / lowBar.l) * 100;
      const daysSinceHigh = Math.round((new Date(bars[bars.length - 1].t).getTime() - new Date(highBar.t).getTime()) / 86400000);
      return {
        symbol: sym,
        price: last,
        high: highBar.h,
        high_date: highBar.t.slice(0, 10),
        days_since_high: daysSinceHigh,
        low: lowBar.l,
        low_date: lowBar.t.slice(0, 10),
        from_high_pct: fromHigh,
        from_low_pct: fromLow,
      };
    } catch {
      return { symbol: sym, error: true };
    }
  }));

  return NextResponse.json({ lookback_days, results });
});
