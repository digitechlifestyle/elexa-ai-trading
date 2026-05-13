import { createClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/observability/api-handler";
import { NextResponse } from "next/server";

interface DayStat {
  day: string;
  count: number;
  avg_return_pct: number;
  win_rate_pct: number;
}

interface MonthStat {
  month: string;
  count: number;
  avg_return_pct: number;
  win_rate_pct: number;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = [
  "Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec",
];

async function fetchBars(symbol: string, days: number): Promise<{ t: string; c: number }[]> {
  const end = new Date();
  const start = new Date(end.getTime() - days * 86400 * 1000);
  const url = `https://data.alpaca.markets/v2/stocks/${symbol}/bars?timeframe=1Day&start=${start.toISOString()}&end=${end.toISOString()}&limit=10000&adjustment=split`;
  const res = await fetch(url, {
    headers: {
      "APCA-API-KEY-ID": process.env.ALPACA_API_KEY ?? "",
      "APCA-API-SECRET-KEY": process.env.ALPACA_API_SECRET ?? "",
    },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data?.bars ?? []) as { t: string; c: number }[];
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
  const symbol = (url.searchParams.get("symbol") || "SPY").toUpperCase().trim();
  const years = Math.max(1, Math.min(20, Number(url.searchParams.get("years")) || 10));

  const bars = await fetchBars(symbol, years * 365);
  if (bars.length < 50) {
    return NextResponse.json({ error: "Insufficient history" }, { status: 422 });
  }

  // Build daily returns
  interface Pt {
    date: Date;
    ret: number;
  }
  const pts: Pt[] = [];
  for (let i = 1; i < bars.length; i++) {
    const prev = bars[i - 1].c;
    const cur = bars[i].c;
    if (prev > 0) {
      pts.push({ date: new Date(bars[i].t), ret: (cur / prev - 1) * 100 });
    }
  }

  // Day-of-week aggregation
  const byDow = new Map<number, { sum: number; count: number; wins: number }>();
  for (const p of pts) {
    const d = p.date.getUTCDay();
    const cur = byDow.get(d) ?? { sum: 0, count: 0, wins: 0 };
    cur.sum += p.ret;
    cur.count++;
    if (p.ret > 0) cur.wins++;
    byDow.set(d, cur);
  }
  const dayStats: DayStat[] = [1, 2, 3, 4, 5].map((d) => {
    const v = byDow.get(d) ?? { sum: 0, count: 0, wins: 0 };
    return {
      day: DAYS[d],
      count: v.count,
      avg_return_pct: v.count > 0 ? v.sum / v.count : 0,
      win_rate_pct: v.count > 0 ? (v.wins / v.count) * 100 : 0,
    };
  });

  // Month-of-year aggregation
  const byMonth = new Map<number, { sum: number; count: number; wins: number }>();
  // Group daily returns by month — better: compute monthly returns
  // For simplicity, average daily returns by their calendar month
  for (const p of pts) {
    const m = p.date.getUTCMonth();
    const cur = byMonth.get(m) ?? { sum: 0, count: 0, wins: 0 };
    cur.sum += p.ret;
    cur.count++;
    if (p.ret > 0) cur.wins++;
    byMonth.set(m, cur);
  }
  const monthStats: MonthStat[] = MONTHS.map((label, i) => {
    const v = byMonth.get(i) ?? { sum: 0, count: 0, wins: 0 };
    return {
      month: label,
      count: v.count,
      avg_return_pct: v.count > 0 ? v.sum / v.count : 0,
      win_rate_pct: v.count > 0 ? (v.wins / v.count) * 100 : 0,
    };
  });

  return NextResponse.json({
    symbol,
    years,
    sample_days: pts.length,
    day_of_week: dayStats,
    month_of_year: monthStats,
  });
});
