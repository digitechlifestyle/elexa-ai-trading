import { createClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/observability/api-handler";
import { NextRequest, NextResponse } from "next/server";

interface Bar { c: number; t: string; }
interface Score {
  symbol: string;
  change_1d: number | null;
  change_5d: number | null;
  change_20d: number | null;
  change_60d: number | null;
  composite: number;
  rank: number;
}

function pctChange(bars: Bar[], n: number): number | null {
  if (bars.length < n + 1) return null;
  const last = bars[bars.length - 1].c;
  const prev = bars[bars.length - 1 - n].c;
  if (!prev) return null;
  return ((last - prev) / prev) * 100;
}

export const POST = withApi(async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { symbols } = await request.json();
  if (!Array.isArray(symbols) || symbols.length === 0 || symbols.length > 30) {
    return NextResponse.json({ error: "Provide 1-30 symbols" }, { status: 422 });
  }

  const origin = request.nextUrl.origin;
  const cookie = request.headers.get("cookie") || "";

  const results: Score[] = await Promise.all(
    symbols.map(async (s: string) => {
      const sym = s.toUpperCase().trim();
      try {
        const r = await fetch(
          `${origin}/api/trading/bars?symbol=${encodeURIComponent(sym)}&days=90`,
          { headers: { cookie } }
        );
        if (!r.ok) {
          return {
            symbol: sym, change_1d: null, change_5d: null, change_20d: null, change_60d: null, composite: 0, rank: 0,
          };
        }
        const j = await r.json();
        const bars: Bar[] = j.bars ?? [];
        const d1 = pctChange(bars, 1);
        const d5 = pctChange(bars, 5);
        const d20 = pctChange(bars, 20);
        const d60 = pctChange(bars, 60);
        // Weighted composite — recent weighted more
        const composite =
          (d1 ?? 0) * 0.4 + (d5 ?? 0) * 0.3 + (d20 ?? 0) * 0.2 + (d60 ?? 0) * 0.1;
        return {
          symbol: sym,
          change_1d: d1,
          change_5d: d5,
          change_20d: d20,
          change_60d: d60,
          composite,
          rank: 0,
        };
      } catch {
        return {
          symbol: sym, change_1d: null, change_5d: null, change_20d: null, change_60d: null, composite: 0, rank: 0,
        };
      }
    })
  );

  // Rank: 1-100 normalised by composite
  const sorted = [...results].sort((a, b) => b.composite - a.composite);
  const max = sorted[0]?.composite ?? 0;
  const min = sorted[sorted.length - 1]?.composite ?? 0;
  const range = max - min || 1;
  for (const r of results) {
    r.rank = Math.round(((r.composite - min) / range) * 100);
  }
  results.sort((a, b) => b.composite - a.composite);

  return NextResponse.json({ results });
});
