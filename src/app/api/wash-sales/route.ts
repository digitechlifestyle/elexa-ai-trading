import { createClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/observability/api-handler";
import { NextResponse } from "next/server";
import { matchTrades, RawTrade, ClosedTrade } from "@/lib/trade-analytics";

interface RawTradeWithSide extends RawTrade { /* same shape */ }

interface WashSaleFlag {
  symbol: string;
  loss_exit_time: string;
  loss_pnl: number;
  rebuy_time: string;
  rebuy_price: number;
  days_apart: number;
  rule: "30-day before" | "30-day after";
}

/**
 * US wash-sale rule: if you sell at a loss and buy substantially
 * identical security within 30 days BEFORE or AFTER, the loss is disallowed
 * for tax purposes and basis is adjusted.
 *
 * Note: paper trades don't generate real tax events. Tool useful for
 * users practising tax-aware trading habits.
 */
export const GET = withApi(async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("trades")
    .select("symbol, side, qty, filled_price, status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  const trades = (data ?? []) as RawTradeWithSide[];
  const closed: ClosedTrade[] = matchTrades(trades);
  const losses = closed.filter((c) => c.pnl < 0);

  // For each loss, look for buys of same symbol within ±30 days
  const flags: WashSaleFlag[] = [];
  for (const loss of losses) {
    const exitTime = new Date(loss.exit_time).getTime();
    for (const t of trades) {
      if (t.symbol !== loss.symbol) continue;
      if (t.side !== "buy") continue;
      if (t.status !== "filled" || t.filled_price == null) continue;
      const tTime = new Date(t.created_at).getTime();
      // Skip the original entry that became this lot
      if (t.created_at === loss.entry_time) continue;
      const diffMs = tTime - exitTime;
      const diffDays = Math.round(diffMs / 86400000);
      if (diffDays === 0) continue;
      if (Math.abs(diffDays) <= 30) {
        flags.push({
          symbol: loss.symbol,
          loss_exit_time: loss.exit_time,
          loss_pnl: loss.pnl,
          rebuy_time: t.created_at,
          rebuy_price: Number(t.filled_price),
          days_apart: diffDays,
          rule: diffDays < 0 ? "30-day before" : "30-day after",
        });
      }
    }
  }

  // Dedupe (same loss + same rebuy)
  const seen = new Set<string>();
  const unique = flags.filter((f) => {
    const key = `${f.loss_exit_time}|${f.rebuy_time}|${f.symbol}`;
    if (seen.has(key)) return false;
    seen.add(key); return true;
  });

  // Sort newest loss first
  unique.sort((a, b) => (a.loss_exit_time < b.loss_exit_time ? 1 : -1));

  const totalDisallowed = unique.reduce((s, f) => s + Math.abs(f.loss_pnl), 0);

  return NextResponse.json({
    losses_checked: losses.length,
    flags_found: unique.length,
    total_disallowed_loss: totalDisallowed,
    flags: unique.slice(0, 200),
  });
});
