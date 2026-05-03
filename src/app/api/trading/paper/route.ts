import { createClient } from "@/lib/supabase/server";
import { createExchange } from "@/lib/exchanges/factory";
import type { ExchangeName } from "@/lib/exchanges/factory";
import { validateOrder, checkDailyLoss } from "@/lib/trading/risk-limits";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // TODO: Fix auth — for now use placeholder
  // const { data: { user } } = await supabase.auth.getUser();
  // if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = { id: "placeholder-user-id" };

  const body = await request.json().catch(() => null);
  if (
    !body ||
    typeof body.symbol !== "string" ||
    typeof body.qty !== "number" ||
    !["buy", "sell"].includes(body.side) ||
    !body.exchange
  ) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { symbol, qty, side, exchange } = body as {
    symbol: string;
    qty: number;
    side: "buy" | "sell";
    exchange: ExchangeName;
  };

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

  // Create exchange adapter
  let exchangeAdapter;
  try {
    // For now, use hardcoded credentials from env
    // In production, user stores these securely in settings
    const config = {
      name: exchange,
      api_key: process.env.ALPACA_API_KEY || "",
      api_secret: process.env.ALPACA_API_SECRET || "",
      base_url: process.env.ALPACA_BASE_URL || "https://paper-api.alpaca.markets",
    };
    exchangeAdapter = createExchange(exchange, config);
  } catch (err) {
    return NextResponse.json(
      { error: `Unknown exchange: ${exchange}` },
      { status: 400 }
    );
  }

  // Validate exchange credentials
  const isValid = await exchangeAdapter.validateCredentials().catch(() => false);
  if (!isValid) {
    return NextResponse.json(
      { error: `Could not authenticate with ${exchange}. Check API keys.` },
      { status: 401 }
    );
  }

  // Get current price
  let estimatedPrice = 0;
  try {
    estimatedPrice = await exchangeAdapter.getAssetPrice(symbol);
  } catch {
    return NextResponse.json(
      { error: `Could not fetch price for ${symbol} on ${exchange}` },
      { status: 502 }
    );
  }

  // Validate order against risk limits
  const validation = validateOrder(symbol, qty, estimatedPrice);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.reason }, { status: 422 });
  }

  // Place paper order
  let order;
  try {
    order = await exchangeAdapter.placeOrder(symbol, qty, side);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Order failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  // Log to database (status already normalized by exchange adapter)
  const mappedStatus = order.status;

  const { data: trade, error: dbError } = await supabase
    .from("trades")
    .insert({
      user_id: user.id,
      symbol: symbol.toUpperCase(),
      side,
      qty,
      filled_price: order.filled_price,
      status: mappedStatus,
      is_paper: true,
      alpaca_order_id: order.id,
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

  return NextResponse.json({ trade, order }, { status: 201 });
}
