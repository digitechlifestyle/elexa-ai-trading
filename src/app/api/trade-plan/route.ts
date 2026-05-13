import { createClient } from "@/lib/supabase/server";
import { AgentBus } from "@/lib/agents/bus";
import { ALL_AGENTS } from "@/lib/agents/registry";
import { withApi } from "@/lib/observability/api-handler";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

const ALPACA_CRYPTO_SYMBOLS = new Set([
  "AAVE","ADA","ARB","AVAX","BAT","BCH","BONK","BTC","CRV","DOGE","DOT","ETH",
  "FIL","GRT","HYPE","LDO","LINK","LTC","ONDO","PAXG","PEPE","POL","RENDER",
  "SHIB","SKY","SOL","SUSHI","TRUMP","UNI","USDC","USDG","USDT","WIF","XRP",
  "XTZ","YFI",
]);
function isCrypto(s: string) {
  return s.includes("/") || ALPACA_CRYPTO_SYMBOLS.has(s.toUpperCase());
}
function normalize(s: string) {
  const u = s.toUpperCase();
  if (u.includes("/")) return u;
  if (ALPACA_CRYPTO_SYMBOLS.has(u)) return `${u}/USD`;
  return u;
}

async function priceAndContext(symbol: string): Promise<{
  price: number;
  high_52w: number;
  low_52w: number;
  ma_50: number;
  ma_200: number;
  rsi_14: number;
  change_30d_pct: number;
} | null> {
  const sym = normalize(symbol);
  const end = new Date();
  const start = new Date(end.getTime() - 365 * 86400 * 1000);
  const url = isCrypto(symbol)
    ? `https://data.alpaca.markets/v1beta3/crypto/us/bars?symbols=${encodeURIComponent(sym)}&timeframe=1Day&start=${start.toISOString()}&end=${end.toISOString()}&limit=400`
    : `https://data.alpaca.markets/v2/stocks/${sym}/bars?timeframe=1Day&start=${start.toISOString()}&end=${end.toISOString()}&limit=400&adjustment=split`;
  const res = await fetch(url, {
    headers: {
      "APCA-API-KEY-ID": process.env.ALPACA_API_KEY ?? "",
      "APCA-API-SECRET-KEY": process.env.ALPACA_API_SECRET ?? "",
    },
  });
  if (!res.ok) return null;
  const data = await res.json();
  const bars: { c: number }[] = isCrypto(symbol) ? data?.bars?.[sym] ?? [] : data?.bars ?? [];
  if (bars.length < 30) return null;
  const closes = bars.map((b) => b.c);
  const price = closes[closes.length - 1];
  const high_52w = Math.max(...closes);
  const low_52w = Math.min(...closes);
  function sma(arr: number[], n: number): number {
    const slice = arr.slice(-n);
    return slice.reduce((s, v) => s + v, 0) / slice.length;
  }
  const ma_50 = sma(closes, Math.min(50, closes.length));
  const ma_200 = sma(closes, Math.min(200, closes.length));
  // 30-day change
  const past = closes[Math.max(0, closes.length - 30)];
  const change_30d_pct = ((price - past) / past) * 100;
  // Crude RSI(14)
  let gain = 0;
  let loss = 0;
  const recent = closes.slice(-15);
  for (let i = 1; i < recent.length; i++) {
    const d = recent[i] - recent[i - 1];
    if (d > 0) gain += d;
    else loss -= d;
  }
  const rs = loss === 0 ? 100 : gain / loss;
  const rsi_14 = 100 - 100 / (1 + rs);
  return {
    price,
    high_52w,
    low_52w,
    ma_50,
    ma_200,
    rsi_14,
    change_30d_pct,
  };
}

export const POST = withApi(async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await checkRateLimit({
    key: `agents:${user.id}`,
    ...RATE_LIMITS.agents,
  });
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.symbol !== "string") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const symbol = body.symbol.toUpperCase().trim();
  if (!/^[A-Z0-9./-]{1,12}$/.test(symbol)) {
    return NextResponse.json({ error: "Invalid symbol" }, { status: 422 });
  }
  const direction = body.direction === "short" ? "short" : "long";
  const horizon = ["scalp", "swing", "position"].includes(body.horizon)
    ? body.horizon
    : "swing";
  const accountSize = Math.max(100, Math.min(10_000_000, Number(body.account_size) || 10000));
  const riskPct = Math.max(0.1, Math.min(10, Number(body.risk_pct) || 1));

  const ctx = await priceAndContext(symbol);
  if (!ctx) {
    return NextResponse.json(
      { error: "Could not fetch price context" },
      { status: 502 }
    );
  }

  const prompt = `Generate a structured trade plan for ${symbol} (${direction.toUpperCase()}, ${horizon} horizon).

Current market context:
- Price: $${ctx.price.toFixed(2)}
- 52-week range: $${ctx.low_52w.toFixed(2)} – $${ctx.high_52w.toFixed(2)}
- 50-day MA: $${ctx.ma_50.toFixed(2)}
- 200-day MA: $${ctx.ma_200.toFixed(2)}
- RSI(14): ${ctx.rsi_14.toFixed(1)}
- 30-day change: ${ctx.change_30d_pct.toFixed(2)}%

Account: $${accountSize.toLocaleString()}, max risk per trade: ${riskPct}%.

Output as markdown with these exact sections:

## Thesis
2-3 sentences. What's the setup. Why now.

## Entry
Specific price or zone. Trigger condition.

## Stop-loss
Specific price. Reasoning (below structure, X% from entry, etc).

## Targets
T1, T2, T3 with prices. R:R for each.

## Position size
Suggested shares based on $${accountSize} account at ${riskPct}% risk.

## Invalidation
What price action would prove the thesis wrong.

## Risks
2-3 bullet risks specific to this setup.

## Risk Agent note
1 sentence — research only, paper trading, not advice.`;

  try {
    const bus = new AgentBus(supabase, user.id, ALL_AGENTS, randomUUID());
    const result = await bus.invoke("quant", prompt);
    return NextResponse.json({
      symbol,
      direction,
      horizon,
      context: ctx,
      plan: result.output,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
});
