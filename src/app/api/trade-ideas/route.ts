import { createClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/observability/api-handler";
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { sma, rsi } from "@/lib/indicators";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface Bar { c: number; h: number; l: number; v: number; }

const UNIVERSE = [
  "AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "META", "TSLA", "AMD", "AVGO",
  "SPY", "QQQ", "IWM", "GLD", "TLT", "BTC", "ETH", "SOL",
  "XLE", "XLF", "XLK", "XLY",
];

const SYSTEM = `You are a tactical trade idea generator.

Given a universe of symbol snapshots with price, RSI, MA position, recent return, and volatility,
pick the TOP 3 best trade ideas. Mix of long and short OK.

Reply with ONLY JSON, no prose:
[{"symbol":"...","direction":"long|short","conviction":"low|medium|high","entry":"...","stop":"...","target":"...","thesis":"one sentence"}]

Selection criteria: clear technical setup, strong R:R, regime fit.
Entry/stop/target should be plain-text descriptions tied to the data (e.g., "buy on close above $182, stop below $175").
Diversify — avoid 3 similar setups.`;

export const POST = withApi(async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const origin = request.nextUrl.origin;
  const cookie = request.headers.get("cookie") || "";

  const snapshots = await Promise.all(UNIVERSE.map(async (sym) => {
    try {
      const r = await fetch(`${origin}/api/trading/bars?symbol=${sym}&days=250`, { headers: { cookie } });
      if (!r.ok) return null;
      const j = await r.json();
      const bars: Bar[] = j.bars ?? [];
      if (bars.length < 50) return null;
      const closes = bars.map((b) => b.c);
      const last = closes[closes.length - 1];
      const r14 = rsi(closes, 14).at(-1) ?? null;
      const ma50 = sma(closes, 50).at(-1) ?? null;
      const ma200 = sma(closes, 200).at(-1) ?? null;
      const ch5 = closes.length > 5 ? ((last - closes[closes.length - 6]) / closes[closes.length - 6]) * 100 : null;
      const ch20 = closes.length > 20 ? ((last - closes[closes.length - 21]) / closes[closes.length - 21]) * 100 : null;
      // 14-day vol annualised
      const rets: number[] = [];
      for (let i = 1; i < Math.min(closes.length, 30); i++) rets.push(Math.log(closes[i] / closes[i - 1]));
      const m = rets.reduce((s, v) => s + v, 0) / rets.length;
      const sd = Math.sqrt(rets.reduce((s, v) => s + (v - m) ** 2, 0) / rets.length);
      const vol = sd * Math.sqrt(252) * 100;
      return {
        symbol: sym, price: last, rsi: r14,
        above_50ma: ma50 ? last > ma50 : null,
        above_200ma: ma200 ? last > ma200 : null,
        change_5d_pct: ch5, change_20d_pct: ch20,
        ann_vol_pct: vol,
      };
    } catch { return null; }
  }));

  const valid = snapshots.filter((s) => s != null);
  if (valid.length === 0) return NextResponse.json({ error: "No bars fetched" }, { status: 502 });

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    system: SYSTEM,
    messages: [{ role: "user", content: JSON.stringify(valid) }],
  });

  const block = response.content[0];
  const text = block.type === "text" ? block.text : "";
  let ideas: { symbol: string; direction: string; conviction: string; entry: string; stop: string; target: string; thesis: string }[] = [];
  try {
    const cleaned = text.replace(/```json|```/g, "").trim();
    ideas = JSON.parse(cleaned);
  } catch {
    return NextResponse.json({ error: "AI returned malformed response", raw: text }, { status: 502 });
  }

  return NextResponse.json({ ideas, generated_at: new Date().toISOString(), universe_size: valid.length });
});
