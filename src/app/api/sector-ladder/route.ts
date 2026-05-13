import { createClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/observability/api-handler";
import { NextRequest, NextResponse } from "next/server";

interface Bar { t: string; c: number; }

const SECTORS = [
  { symbol: "XLK", name: "Technology" },
  { symbol: "XLF", name: "Financials" },
  { symbol: "XLE", name: "Energy" },
  { symbol: "XLV", name: "Healthcare" },
  { symbol: "XLY", name: "Consumer Discretionary" },
  { symbol: "XLP", name: "Consumer Staples" },
  { symbol: "XLI", name: "Industrials" },
  { symbol: "XLB", name: "Materials" },
  { symbol: "XLU", name: "Utilities" },
  { symbol: "XLRE", name: "Real Estate" },
  { symbol: "XLC", name: "Communication" },
  { symbol: "SPY", name: "S&P 500 (benchmark)" },
];

function pctChange(bars: Bar[], n: number): number | null {
  if (bars.length < n + 1) return null;
  const last = bars[bars.length - 1].c;
  const prev = bars[bars.length - 1 - n].c;
  return prev > 0 ? ((last - prev) / prev) * 100 : null;
}

export const GET = withApi(async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const origin = request.nextUrl.origin;
  const cookie = request.headers.get("cookie") || "";

  const results = await Promise.all(SECTORS.map(async (s) => {
    try {
      const r = await fetch(`${origin}/api/trading/bars?symbol=${s.symbol}&days=120`, { headers: { cookie } });
      if (!r.ok) return { ...s, error: true };
      const j = await r.json();
      const bars: Bar[] = j.bars ?? [];
      const last = bars.length ? bars[bars.length - 1].c : null;
      return {
        ...s,
        price: last,
        d1: pctChange(bars, 1),
        d5: pctChange(bars, 5),
        d20: pctChange(bars, 20),
        d60: pctChange(bars, 60),
        d90: pctChange(bars, 90),
      };
    } catch {
      return { ...s, error: true };
    }
  }));

  return NextResponse.json({ sectors: results });
});
