import { createClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/observability/api-handler";
import { NextRequest, NextResponse } from "next/server";

interface Bar { h: number; l: number; c: number; }

export const POST = withApi(async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { symbols, period = 20 } = await request.json();
  if (!Array.isArray(symbols) || symbols.length === 0 || symbols.length > 50) {
    return NextResponse.json({ error: "1-50 symbols required" }, { status: 422 });
  }

  const origin = request.nextUrl.origin;
  const cookie = request.headers.get("cookie") || "";

  const results = await Promise.all(symbols.map(async (s: string) => {
    const sym = s.toUpperCase().trim();
    try {
      const r = await fetch(`${origin}/api/trading/bars?symbol=${encodeURIComponent(sym)}&days=${period + 30}`, { headers: { cookie } });
      if (!r.ok) return { symbol: sym, error: true };
      const j = await r.json();
      const bars: Bar[] = j.bars ?? [];
      if (bars.length < period + 1) return { symbol: sym, error: true };
      const last = bars[bars.length - 1];
      const lookback = bars.slice(-period - 1, -1);
      const highN = Math.max(...lookback.map((b) => b.h));
      const lowN = Math.min(...lookback.map((b) => b.l));
      let signal: "buy" | "sell" | "none" = "none";
      if (last.c > highN) signal = "buy";
      else if (last.c < lowN) signal = "sell";
      return {
        symbol: sym,
        price: last.c,
        high_n: highN,
        low_n: lowN,
        signal,
        pct_to_high: ((highN - last.c) / last.c) * 100,
        pct_to_low: ((last.c - lowN) / last.c) * 100,
      };
    } catch {
      return { symbol: sym, error: true };
    }
  }));

  return NextResponse.json({ period, results });
});
