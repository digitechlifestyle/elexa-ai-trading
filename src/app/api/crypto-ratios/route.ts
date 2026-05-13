import { createClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/observability/api-handler";
import { NextRequest, NextResponse } from "next/server";

interface Bar { t: string; c: number; }

async function getBars(origin: string, cookie: string, sym: string, days: number): Promise<Bar[]> {
  const r = await fetch(`${origin}/api/trading/bars?symbol=${encodeURIComponent(sym)}&days=${days}`, { headers: { cookie } });
  if (!r.ok) return [];
  const j = await r.json();
  return j.bars ?? [];
}

function ratioSeries(a: Bar[], b: Bar[]) {
  const mb = new Map(b.map((x) => [x.t.slice(0, 10), x.c]));
  const out: { date: string; ratio: number }[] = [];
  for (const ab of a) {
    const d = ab.t.slice(0, 10);
    const bc = mb.get(d);
    if (bc != null && bc > 0) out.push({ date: d, ratio: ab.c / bc });
  }
  return out;
}

export const GET = withApi(async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const days = Math.max(30, Math.min(730, Number(url.searchParams.get("days") || 180)));

  const origin = request.nextUrl.origin;
  const cookie = request.headers.get("cookie") || "";

  const [btc, eth, sol] = await Promise.all([
    getBars(origin, cookie, "BTC", days),
    getBars(origin, cookie, "ETH", days),
    getBars(origin, cookie, "SOL", days),
  ]);

  const ethBtc = ratioSeries(eth, btc);
  const solBtc = ratioSeries(sol, btc);
  const solEth = ratioSeries(sol, eth);

  const last = (a: { ratio: number }[]) => a.length ? a[a.length - 1].ratio : null;
  const first = (a: { ratio: number }[]) => a.length ? a[0].ratio : null;
  const change = (a: { ratio: number }[]) => {
    const f = first(a); const l = last(a);
    return f && l ? ((l - f) / f) * 100 : null;
  };

  return NextResponse.json({
    days,
    pairs: [
      { name: "ETH/BTC", current: last(ethBtc), change_pct: change(ethBtc), series: ethBtc, hint: "Up = ETH outperforming BTC (alt season indicator)." },
      { name: "SOL/BTC", current: last(solBtc), change_pct: change(solBtc), series: solBtc, hint: "Up = SOL outperforming BTC." },
      { name: "SOL/ETH", current: last(solEth), change_pct: change(solEth), series: solEth, hint: "SOL strength relative to ETH." },
    ],
  });
});
