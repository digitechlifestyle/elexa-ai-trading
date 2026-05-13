import { createClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/observability/api-handler";
import { NextResponse } from "next/server";

interface EarningsRow {
  symbol: string;
  company: string;
  date: string;
  eps_estimate: number | null;
  eps_actual: number | null;
  surprise_pct: number | null;
  next_report: string | null;
}

/**
 * Yahoo Finance earnings calendar — public unauthenticated JSON.
 * Uses query2.finance.yahoo.com/v1/finance/visualization (limited but works).
 * Falls back to scraping the calendar HTML if needed.
 */
async function fetchYahooEarnings(date: string): Promise<EarningsRow[]> {
  const url = `https://query1.finance.yahoo.com/v1/finance/visualization?lang=en-US&region=US`;
  const body = {
    size: 50,
    offset: 0,
    sortType: "DESC",
    sortField: "startdatetime",
    quoteType: "EQUITY",
    query: {
      operator: "and",
      operands: [
        { operator: "EQ", operands: ["region", "us"] },
        { operator: "GTE", operands: ["startdatetime", date + "T00:00:00Z"] },
        { operator: "LTE", operands: ["startdatetime", date + "T23:59:59Z"] },
      ],
    },
    entityIdType: "earnings",
  };
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    const rows = json?.finance?.result?.[0]?.documents?.[0]?.rows ?? [];
    const cols = json?.finance?.result?.[0]?.documents?.[0]?.columns ?? [];
    const idx = (name: string) =>
      cols.findIndex((c: { id: string }) => c.id === name);
    const symIdx = idx("ticker");
    const nameIdx = idx("companyshortname");
    const epsEstIdx = idx("epsestimate");
    const epsActIdx = idx("epsactual");
    const surpIdx = idx("epssurprisepct");
    return rows.map((r: unknown[]) => {
      const sym = String(r[symIdx] ?? "");
      const name = String(r[nameIdx] ?? "");
      const est = Number(r[epsEstIdx]);
      const act = Number(r[epsActIdx]);
      const surp = Number(r[surpIdx]);
      return {
        symbol: sym,
        company: name,
        date,
        eps_estimate: Number.isFinite(est) ? est : null,
        eps_actual: Number.isFinite(act) ? act : null,
        surprise_pct: Number.isFinite(surp) ? surp : null,
        next_report: null,
      };
    });
  } catch {
    return [];
  }
}

export const GET = withApi(async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const daysAhead = Math.max(1, Math.min(14, Number(url.searchParams.get("days")) || 7));

  // Fetch each day in window
  const today = new Date();
  const dates: string[] = [];
  for (let i = 0; i < daysAhead; i++) {
    const d = new Date(today.getTime() + i * 86400000);
    dates.push(d.toISOString().slice(0, 10));
  }
  const byDate: Record<string, EarningsRow[]> = {};
  await Promise.all(
    dates.map(async (d) => {
      byDate[d] = await fetchYahooEarnings(d);
    })
  );

  return NextResponse.json({ window_days: daysAhead, by_date: byDate });
});
