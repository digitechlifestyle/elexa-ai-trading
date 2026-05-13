import { createClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/observability/api-handler";
import { NextResponse } from "next/server";

const DEMO_SYMBOLS = ["AAPL", "MSFT", "NVDA", "TSLA", "SPY", "QQQ", "BTC", "ETH"];
const PRICES: Record<string, number> = {
  AAPL: 180, MSFT: 410, NVDA: 880, TSLA: 240, SPY: 510, QQQ: 440, BTC: 65000, ETH: 3200,
};

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export const POST = withApi(async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check if user already has trades — don't double-seed
  const { count } = await supabase
    .from("trades")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if ((count ?? 0) > 5) {
    return NextResponse.json({ error: "You already have trade history. Demo seeding skipped to protect real data." }, { status: 409 });
  }

  // Build 30 trades over last 60 days
  const trades = [];
  const journalEntries = [];
  const now = Date.now();

  for (let i = 0; i < 30; i++) {
    const sym = DEMO_SYMBOLS[i % DEMO_SYMBOLS.length];
    const basePrice = PRICES[sym];
    const daysAgo = Math.floor(rand(0, 60));
    const entryTime = new Date(now - daysAgo * 86400 * 1000).toISOString();
    const exitTime = new Date(now - Math.max(0, daysAgo - rand(1, 7)) * 86400 * 1000).toISOString();
    const entryPrice = basePrice * rand(0.92, 1.08);
    const exitPrice = entryPrice * rand(0.92, 1.10);
    const qty = sym === "BTC" || sym === "ETH" ? Math.round(rand(0.01, 0.5) * 100) / 100 : Math.floor(rand(5, 50));

    trades.push({
      user_id: user.id,
      symbol: sym,
      side: "buy",
      qty,
      filled_price: entryPrice,
      order_type: "market",
      status: "filled",
      created_at: entryTime,
    });
    trades.push({
      user_id: user.id,
      symbol: sym,
      side: "sell",
      qty,
      filled_price: exitPrice,
      order_type: "market",
      status: "filled",
      created_at: exitTime,
    });

    if (i % 4 === 0) {
      journalEntries.push({
        user_id: user.id,
        title: `${sym} demo trade`,
        notes: `Demo: entered ${sym} at $${entryPrice.toFixed(2)}, exited at $${exitPrice.toFixed(2)}. ${exitPrice > entryPrice ? "Worked out." : "Stopped out — review setup."}`,
        tags: ["demo", exitPrice > entryPrice ? "win" : "loss"],
        created_at: entryTime,
      });
    }
  }

  const { error: tErr } = await supabase.from("trades").insert(trades);
  if (tErr) return NextResponse.json({ error: tErr.message }, { status: 500 });

  const { error: jErr } = await supabase.from("journal_entries").insert(journalEntries);
  if (jErr) return NextResponse.json({ error: jErr.message }, { status: 500 });

  return NextResponse.json({
    ok: true,
    trades_inserted: trades.length,
    journal_inserted: journalEntries.length,
  });
});

export const DELETE = withApi(async function DELETE() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Delete only demo-tagged journal + matching trades (best effort by tag)
  await supabase.from("journal_entries").delete().eq("user_id", user.id).contains("tags", ["demo"]);
  // Trades have no demo tag — leave intact unless user nukes manually
  return NextResponse.json({ ok: true, note: "Demo journal entries cleared. Trades left untouched (no demo tag on trades schema)." });
});
