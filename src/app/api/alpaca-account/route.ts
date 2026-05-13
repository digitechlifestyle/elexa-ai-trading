import { createClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/observability/api-handler";
import { NextResponse } from "next/server";

interface AlpacaAccount {
  cash: string; equity: string; buying_power: string;
  portfolio_value: string; last_equity: string;
  daytrade_count: number; pattern_day_trader: boolean;
  status: string; currency: string;
}

interface AlpacaPosition {
  symbol: string; qty: string; avg_entry_price: string;
  current_price: string; market_value: string;
  unrealized_pl: string; unrealized_plpc: string;
  side: string;
}

export const GET = withApi(async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const headers = {
    "APCA-API-KEY-ID": process.env.ALPACA_API_KEY || "",
    "APCA-API-SECRET-KEY": process.env.ALPACA_API_SECRET || "",
  };

  const [acctRes, posRes] = await Promise.all([
    fetch("https://paper-api.alpaca.markets/v2/account", { headers }),
    fetch("https://paper-api.alpaca.markets/v2/positions", { headers }),
  ]);

  if (!acctRes.ok) {
    const t = await acctRes.text().catch(() => "");
    return NextResponse.json({ error: "Alpaca account fetch failed", detail: t.slice(0, 200) }, { status: 502 });
  }
  const account: AlpacaAccount = await acctRes.json();
  const positions: AlpacaPosition[] = posRes.ok ? await posRes.json() : [];

  const equity = Number(account.equity);
  const lastEquity = Number(account.last_equity);
  const dayPnl = equity - lastEquity;
  const dayPnlPct = lastEquity > 0 ? (dayPnl / lastEquity) * 100 : 0;

  return NextResponse.json({
    account: {
      status: account.status,
      currency: account.currency,
      cash: Number(account.cash),
      equity, last_equity: lastEquity,
      buying_power: Number(account.buying_power),
      portfolio_value: Number(account.portfolio_value),
      daytrade_count: account.daytrade_count,
      pattern_day_trader: account.pattern_day_trader,
      day_pnl: dayPnl,
      day_pnl_pct: dayPnlPct,
    },
    positions: positions.map((p) => ({
      symbol: p.symbol,
      side: p.side,
      qty: Number(p.qty),
      avg_entry: Number(p.avg_entry_price),
      current_price: Number(p.current_price),
      market_value: Number(p.market_value),
      unrealised_pl: Number(p.unrealized_pl),
      unrealised_pl_pct: Number(p.unrealized_plpc) * 100,
    })),
  });
});
