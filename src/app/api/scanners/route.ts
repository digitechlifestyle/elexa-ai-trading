import { createClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/observability/api-handler";
import { NextRequest, NextResponse } from "next/server";
import { Bar, OHLC, bollingerBandwidth, bollingerSqueezeRank, lastRsi, volumeSpike, zScore, superTrend, ttmSqueeze, connorsRsi, mfi } from "@/lib/scanners";

export const POST = withApi(async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { symbols, scanner } = await request.json();
  if (!Array.isArray(symbols) || symbols.length === 0 || symbols.length > 50) {
    return NextResponse.json({ error: "1-50 symbols required" }, { status: 422 });
  }
  if (!["squeeze", "rsi", "volume", "zscore", "supertrend", "ttm", "connors", "mfi"].includes(scanner)) {
    return NextResponse.json({ error: "Invalid scanner" }, { status: 422 });
  }

  const origin = request.nextUrl.origin;
  const cookie = request.headers.get("cookie") || "";

  const results = await Promise.all(symbols.map(async (sym: string) => {
    const s = sym.toUpperCase().trim();
    try {
      const r = await fetch(`${origin}/api/trading/bars?symbol=${encodeURIComponent(s)}&days=200`, { headers: { cookie } });
      if (!r.ok) return { symbol: s, error: true };
      const j = await r.json();
      const bars: Bar[] = j.bars ?? [];
      const closes = bars.map((b) => b.c);
      const price = closes[closes.length - 1];

      if (scanner === "squeeze") {
        return {
          symbol: s, price,
          bandwidth: bollingerBandwidth(closes),
          squeeze_rank: bollingerSqueezeRank(closes),
        };
      }
      if (scanner === "rsi") {
        return { symbol: s, price, rsi: lastRsi(closes) };
      }
      if (scanner === "volume") {
        return { symbol: s, price, volume_ratio: volumeSpike(bars) };
      }
      if (scanner === "zscore") {
        return { symbol: s, price, z: zScore(closes) };
      }
      if (scanner === "supertrend") {
        const ohlc = (j.bars ?? []) as OHLC[];
        const st = superTrend(ohlc);
        return { symbol: s, price, supertrend: st };
      }
      if (scanner === "ttm") {
        const ohlc = (j.bars ?? []) as OHLC[];
        const ttm = ttmSqueeze(ohlc);
        return { symbol: s, price, ttm };
      }
      if (scanner === "connors") {
        return { symbol: s, price, connors: connorsRsi(closes) };
      }
      if (scanner === "mfi") {
        const ohlc = (j.bars ?? []) as OHLC[];
        return { symbol: s, price, mfi: mfi(ohlc) };
      }
      return { symbol: s };
    } catch {
      return { symbol: s, error: true };
    }
  }));

  return NextResponse.json({ scanner, results });
});
