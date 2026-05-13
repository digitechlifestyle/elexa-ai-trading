import { createClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/observability/api-handler";
import { NextResponse } from "next/server";

const SECTORS = [
  { symbol: "XLF", label: "Financials" },
  { symbol: "XLK", label: "Technology" },
  { symbol: "XLE", label: "Energy" },
  { symbol: "XLV", label: "Healthcare" },
  { symbol: "XLY", label: "Cons. Disc." },
  { symbol: "XLP", label: "Cons. Staples" },
  { symbol: "XLI", label: "Industrials" },
  { symbol: "XLU", label: "Utilities" },
  { symbol: "XLB", label: "Materials" },
  { symbol: "XLRE", label: "Real Estate" },
  { symbol: "XLC", label: "Communication" },
];
const BENCHMARK = "SPY";

async function fetchCloses(symbol: string, days: number): Promise<number[]> {
  const end = new Date();
  const start = new Date(end.getTime() - days * 86400 * 1000);
  const url = `https://data.alpaca.markets/v2/stocks/${symbol}/bars?timeframe=1Day&start=${start.toISOString()}&end=${end.toISOString()}&limit=400&adjustment=split`;
  const res = await fetch(url, {
    headers: {
      "APCA-API-KEY-ID": process.env.ALPACA_API_KEY ?? "",
      "APCA-API-SECRET-KEY": process.env.ALPACA_API_SECRET ?? "",
    },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data?.bars ?? []).map((b: { c: number }) => b.c);
}

/**
 * Relative Rotation Graph (RRG) — for each sector compute:
 *   RS Ratio = symbol / benchmark, normalised
 *   RS Momentum = rate of change of RS Ratio
 *
 * Classic 4 quadrants:
 *   Leading: RS > 100 and momentum > 100
 *   Weakening: RS > 100 and momentum < 100
 *   Lagging: RS < 100 and momentum < 100
 *   Improving: RS < 100 and momentum > 100
 */
export const GET = withApi(async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const days = 90;
  const benchCloses = await fetchCloses(BENCHMARK, days);
  if (benchCloses.length < 30) {
    return NextResponse.json(
      { error: "Insufficient benchmark data" },
      { status: 502 }
    );
  }

  const results: {
    symbol: string;
    label: string;
    rs_ratio: number;
    rs_momentum: number;
    quadrant: "leading" | "weakening" | "lagging" | "improving";
  }[] = [];

  for (const s of SECTORS) {
    const closes = await fetchCloses(s.symbol, days);
    if (closes.length < 30 || benchCloses.length < 30) continue;
    const n = Math.min(closes.length, benchCloses.length);
    const rsSeries: number[] = [];
    for (let i = 0; i < n; i++) {
      const sec = closes[closes.length - n + i];
      const ben = benchCloses[benchCloses.length - n + i];
      if (ben > 0) rsSeries.push((sec / ben) * 100);
    }
    if (rsSeries.length < 30) continue;

    // Normalise: scale so mean ≈ 100
    const meanRs = rsSeries.reduce((a, b) => a + b, 0) / rsSeries.length;
    const stdRs = Math.sqrt(
      rsSeries.reduce((s, v) => s + (v - meanRs) ** 2, 0) / rsSeries.length
    );
    const normalised = rsSeries.map((v) =>
      stdRs > 0 ? 100 + ((v - meanRs) / stdRs) * 5 : 100
    );

    // Momentum: 5-day ROC of normalised RS
    const window = 5;
    const mom: number[] = [];
    for (let i = window; i < normalised.length; i++) {
      mom.push(100 + (normalised[i] - normalised[i - window]));
    }

    const lastRs = normalised[normalised.length - 1];
    const lastMom = mom[mom.length - 1] ?? 100;
    const quadrant: "leading" | "weakening" | "lagging" | "improving" =
      lastRs >= 100 && lastMom >= 100
        ? "leading"
        : lastRs >= 100 && lastMom < 100
        ? "weakening"
        : lastRs < 100 && lastMom < 100
        ? "lagging"
        : "improving";

    results.push({
      symbol: s.symbol,
      label: s.label,
      rs_ratio: lastRs,
      rs_momentum: lastMom,
      quadrant,
    });
  }

  return NextResponse.json({ sectors: results, benchmark: BENCHMARK });
});
