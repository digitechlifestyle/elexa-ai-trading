import { createClient } from "@/lib/supabase/server";
import { AgentBus } from "@/lib/agents/bus";
import { ALL_AGENTS } from "@/lib/agents/registry";
import { withApi } from "@/lib/observability/api-handler";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

interface AlpacaArticle {
  id?: number;
  headline?: string;
  summary?: string;
  author?: string;
  source?: string;
  symbols?: string[];
  url?: string;
  created_at?: string;
}

export const GET = withApi(async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const symbol = (url.searchParams.get("symbol") || "").toUpperCase().trim();
  const summarize = url.searchParams.get("summarize") === "1";
  if (!symbol || !/^[A-Z0-9./-]{1,12}$/.test(symbol)) {
    return NextResponse.json({ error: "Invalid symbol" }, { status: 422 });
  }

  // Fetch Alpaca news (free for paper users)
  const newsUrl = `https://data.alpaca.markets/v1beta1/news?symbols=${encodeURIComponent(
    symbol
  )}&limit=20&sort=desc`;
  const res = await fetch(newsUrl, {
    headers: {
      "APCA-API-KEY-ID": process.env.ALPACA_API_KEY ?? "",
      "APCA-API-SECRET-KEY": process.env.ALPACA_API_SECRET ?? "",
    },
  });
  if (!res.ok) {
    return NextResponse.json(
      { error: `Could not fetch news (${res.status})` },
      { status: 502 }
    );
  }
  const data = await res.json();
  const articles: AlpacaArticle[] = data?.news ?? [];

  let summary: string | null = null;
  if (summarize && articles.length > 0) {
    const rl = await checkRateLimit({
      key: `agents:${user.id}`,
      ...RATE_LIMITS.agents,
    });
    if (rl.allowed) {
      try {
        const headlines = articles
          .slice(0, 15)
          .map(
            (a, i) =>
              `${i + 1}. [${a.source ?? "?"}] ${a.headline} — ${a.summary ?? ""}`
          )
          .join("\n");
        const prompt = `Summarize the following news headlines about ${symbol} in exactly 3 bullet points. Each bullet should be one sentence. Focus on what's actionable for a trader: news, sentiment, catalysts. Do NOT make price predictions. End with a single line: "Sentiment: bullish/neutral/bearish (based on headlines only, not advice)."

Headlines:
${headlines}`;
        const bus = new AgentBus(supabase, user.id, ALL_AGENTS, randomUUID());
        const result = await bus.invoke("quant", prompt);
        summary = result.output;
      } catch {
        summary = null;
      }
    }
  }

  return NextResponse.json({
    symbol,
    articles: articles.map((a) => ({
      id: a.id,
      headline: a.headline,
      summary: a.summary,
      source: a.source,
      url: a.url,
      created_at: a.created_at,
    })),
    summary,
  });
});
