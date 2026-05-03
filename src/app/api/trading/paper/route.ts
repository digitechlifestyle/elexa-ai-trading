import { createClient } from "@/lib/supabase/server";
import { placePaperOrder, getLatestPrice } from "@/lib/alpaca/client";
import { validateOrder, checkDailyLoss } from "@/lib/trading/risk-limits";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.symbol !== "string" || typeof body.qty !== "number" || !["buy","sell"].includes(body.side)) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { symbol, qty, side } = body as { symbol: string; qty: number; side: "buy" | "sell" };

  // Check daily loss limit
  const today = new Date().toISOString().split("T")[0];
  const { data: todayTrades } = await supabase
    .from("trades")
    .select("filled_price, qty, side")
    .eq("user_id", user.id)
    .eq("status", "filled")
    .gte("created_at", `${today}T00:00:00.000Z`);

  const dailyPnl = (todayTrades ?? []).reduce((acc, t) => {
    const val = (t.filled_price ?? 0) * t.qty;
    return acc + (t.side === "sell" ? val : -val);
  }, 0);

  const lossCheck = checkDailyLoss(dailyPnl);
  if (!lossCheck.allowed) {
    return NextResponse.json({ error: lossCheck.reason }, { status: 429 });
  }

  // Fetch estimated price for validation
  let estimatedPrice = 0;
  try {
    estimatedPrice = await getLatestPrice(symbol);
  } catch {
    return NextResponse.json({ error: `Could not fetch price for ${symbol}` }, { status: 502 });
  }

  const validation = validateOrder(symbol, qty, estimatedPrice);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.reason }, { status: 422 });
  }

  // Place paper order via Alpaca
  let alpacaOrder;
  try {
    alpacaOrder = await placePaperOrder(symbol, qty, side);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Order failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  // Map Alpaca status to our allowed values
  const alpacaStatus = alpacaOrder.status ?? "pending";
  const mappedStatus =
    alpacaStatus === "filled" || alpacaStatus === "partially_filled" ? "filled" :
    alpacaStatus === "pending" || alpacaStatus === "new" ? "pending" :
    alpacaStatus === "cancelled" ? "cancelled" :
    "rejected";

  // Log to database
  const { data: trade, error: dbError } = await supabase
    .from("trades")
    .insert({
      user_id: user.id,
      symbol: symbol.toUpperCase(),
      side,
      qty,
      filled_price: alpacaOrder.filled_avg_price
        ? parseFloat(alpacaOrder.filled_avg_price)
        : null,
      status: mappedStatus,
      is_paper: true,
      alpaca_order_id: alpacaOrder.id,
    })
    .select()
    .single();

  if (dbError) {
    console.error("Trade insert error:", dbError);
    return NextResponse.json(
      { error: `Failed to log trade: ${dbError.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ trade, alpacaOrder }, { status: 201 });
}
