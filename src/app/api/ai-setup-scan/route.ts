import { createClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/observability/api-handler";
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { sma, rsi, ema } from "@/lib/indicators";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface Bar { t: string; o: number; h: number; l: number; c: number; v: number; }

interface SymbolSnapshot {
  symbol: string;
  price: number | null;
  change_5d: number | null;
  change_20d: number | null;
  rsi: number | null;
  above_50ma: boolean | null;
  above_200ma: boolean | null;
  trend: "up" | "down" | "flat";
}

const SYSTEM = `You are a quant analyst. Rank trading setups from a list of symbol snapshots.

For each symbol output:
- score (0-100): higher = better setup quality
- bias: "long", "short", or "neutral"
- one-sentence thesis

Reply with ONLY a JSON array, no prose:
[{"symbol":"...","score":85,"bias":"long","thesis":"..."}]

Score weights: trend alignment, RSI position, momentum confirmation, risk-reward asymmetry.
End thesis with rationale tied to the snapshot data.`;

export const POST = withApi(async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { symbols } = await request.json();
  if (!Array.isArray(symbols) || symbols.length === 0 || symbols.length > 10) {
    return NextResponse.json({ error: "1-10 symbols required" }, { status: 422 });
  }

  const origin = request.nextUrl.origin;
  const cookie = request.headers.get("cookie") || "";

  const snapshots: SymbolSnapshot[] = await Promise.all(
    symbols.map(async (s: string) => {
      const sym = s.toUpperCase().trim();
      try {
        const r = await fetch(`${origin}/api/trading/bars?symbol=${encodeURIComponent(sym)}&days=250`, { headers: { cookie } });
        if (!r.ok) return { symbol: sym, price: null, change_5d: null, change_20d: null, rsi: null, above_50ma: null, above_200ma: null, trend: "flat" } as SymbolSnapshot;
        const j = await r.json();
        const bars: Bar[] = j.bars ?? [];
        if (bars.length < 50) return { symbol: sym, price: null, change_5d: null, change_20d: null, rsi: null, above_50ma: null, above_200ma: null, trend: "flat" } as SymbolSnapshot;
        const closes = bars.map((b) => b.c);
        const last = closes[closes.length - 1];
        const ch5 = closes.length > 5 ? ((last - closes[closes.length - 6]) / closes[closes.length - 6]) * 100 : null;
        const ch20 = closes.length > 20 ? ((last - closes[closes.length - 21]) / closes[closes.length - 21]) * 100 : null;
        const r14 = rsi(closes, 14).at(-1) ?? null;
        const ma50 = sma(closes, 50).at(-1) ?? null;
        const ma200 = sma(closes, 200).at(-1) ?? null;
        const ema20 = ema(closes, 20).at(-1) ?? last;
        const ema50 = ema(closes, 50).at(-1) ?? last;
        const trend: SymbolSnapshot["trend"] = ema20 > ema50 ? "up" : ema20 < ema50 ? "down" : "flat";
        return {
          symbol: sym, price: last,
          change_5d: ch5, change_20d: ch20,
          rsi: r14,
          above_50ma: ma50 != null ? last > ma50 : null,
          above_200ma: ma200 != null ? last > ma200 : null,
          trend,
        };
      } catch {
        return { symbol: sym, price: null, change_5d: null, change_20d: null, rsi: null, above_50ma: null, above_200ma: null, trend: "flat" } as SymbolSnapshot;
      }
    })
  );

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    system: SYSTEM,
    messages: [{ role: "user", content: JSON.stringify(snapshots) }],
  });

  const block = response.content[0];
  const text = block.type === "text" ? block.text : "";
  let parsed: { symbol: string; score: number; bias: string; thesis: string }[] = [];
  try {
    // strip possible code fences
    const cleaned = text.replace(/```json|```/g, "").trim();
    parsed = JSON.parse(cleaned);
  } catch {
    return NextResponse.json({ error: "AI returned malformed response", raw: text }, { status: 502 });
  }

  return NextResponse.json({ snapshots, ranked: parsed.sort((a, b) => b.score - a.score) });
});
