import { createClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/observability/api-handler";
import { NextRequest, NextResponse } from "next/server";

/**
 * Compute 8-currency strength via Frankfurter (ECB rates, free, no key).
 * Strength = average % change of each currency vs the other 7 over N days.
 */

const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "CHF", "CAD", "AUD", "NZD"];

interface FrankfurterResp {
  base: string;
  start_date: string;
  end_date: string;
  rates: Record<string, Record<string, number>>;
}

export const GET = withApi(async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const days = Math.max(1, Math.min(30, Number(url.searchParams.get("days") || 7)));

  const end = new Date();
  const start = new Date(end.getTime() - (days + 5) * 86400 * 1000);
  const startStr = start.toISOString().slice(0, 10);
  const endStr = end.toISOString().slice(0, 10);

  // Frankfurter base = EUR by default. Get all 8 currencies vs EUR.
  const symbols = CURRENCIES.filter((c) => c !== "EUR").join(",");
  const res = await fetch(
    `https://api.frankfurter.app/${startStr}..${endStr}?from=EUR&to=${symbols}`,
  );
  if (!res.ok) return NextResponse.json({ error: "Frankfurter fetch failed" }, { status: 502 });
  const data: FrankfurterResp = await res.json();

  const dates = Object.keys(data.rates).sort();
  if (dates.length < 2) return NextResponse.json({ error: "Not enough data" }, { status: 422 });

  const first = data.rates[dates[0]];
  const last = data.rates[dates[dates.length - 1]];

  // For each currency, build EUR-base series, then compute pairwise strength
  // EUR's "rate" is always 1
  const rateAt = (date: string, ccy: string): number => {
    if (ccy === "EUR") return 1;
    return data.rates[date]?.[ccy] ?? NaN;
  };

  // % change vs each other currency: A/B at end vs start
  // strength(A) = avg over B≠A of (A/B at end / A/B at start - 1)
  // But A and B are quoted as EUR/A and EUR/B. So A/B = (1/rate_A) / (1/rate_B) = rate_B / rate_A
  function pairChange(a: string, b: string): number {
    const ra1 = rateAt(dates[0], a);
    const rb1 = rateAt(dates[0], b);
    const ra2 = rateAt(dates[dates.length - 1], a);
    const rb2 = rateAt(dates[dates.length - 1], b);
    const aoverB1 = rb1 / ra1;
    const aoverB2 = rb2 / ra2;
    return (aoverB2 / aoverB1 - 1) * 100;
  }

  const scores = CURRENCIES.map((ccy) => {
    const changes: number[] = [];
    for (const other of CURRENCIES) {
      if (other === ccy) continue;
      const c = pairChange(ccy, other);
      if (Number.isFinite(c)) changes.push(c);
    }
    const avg = changes.length ? changes.reduce((s, v) => s + v, 0) / changes.length : 0;
    return { currency: ccy, score: avg };
  }).sort((a, b) => b.score - a.score);

  return NextResponse.json({
    days, start_date: dates[0], end_date: dates[dates.length - 1],
    scores,
    first_rates: first, last_rates: last,
  });
});
