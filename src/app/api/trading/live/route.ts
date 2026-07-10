import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminSdk } from "@supabase/supabase-js";
import { AlpacaExchange } from "@/lib/exchanges/alpaca";
import {
  validateOrder,
  checkDailyLoss,
  checkOpenPositions,
  isValidSymbolFormat,
  isLiveTradingEnabled,
} from "@/lib/trading/risk-limits";
import { getRiskLimitsForUser } from "@/lib/trading/user-limits";
import { getBrokerConnection } from "@/lib/trading/broker-connections";
import { DISCLAIMER_VERSION } from "@/app/api/live-trading/consent/route";
import { withApi } from "@/lib/observability/api-handler";
import { log } from "@/lib/observability/logger";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { deliverWebhook } from "@/lib/webhook-deliver";
import { NextRequest, NextResponse } from "next/server";

const ALPACA_LIVE_URL = "https://api.alpaca.markets";

/**
 * Places REAL orders against a user's OWN connected brokerage account with
 * REAL money. Three independent gates, all required:
 *
 *   1. LIVE_TRADING_ENABLED=true at the platform level (whole-app kill switch —
 *      stays false until the compliance items in LAUNCH-CHECKLIST.md are done).
 *   2. The user has accepted the current live-trading risk disclaimer.
 *   3. The user has connected their own Alpaca live account — orders execute
 *      against THEIR credentials/THEIR capital, never a platform-shared account.
 *
 * Only Alpaca is wired for real execution. The Kraken adapter is a simulator
 * by design (see exchanges/kraken.ts) and is not accepted here.
 */
export const POST = withApi(async function POST(request: NextRequest, { requestId }) {
  if (!isLiveTradingEnabled()) {
    return NextResponse.json(
      { error: "Live trading is not enabled on this platform.", code: "LIVE_TRADING_DISABLED" },
      { status: 403 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limits = getRiskLimitsForUser(user);

  const rl = await checkRateLimit({ key: `live-trading:${user.id}`, ...RATE_LIMITS.trading });
  if (!rl.allowed) {
    return NextResponse.json(
      {
        error: "Rate limit exceeded — too many trades. Try again in a minute.",
        request_id: requestId,
      },
      { status: 429, headers: { "retry-after": "60" } }
    );
  }

  const body = await request.json().catch(() => null);
  if (
    !body ||
    typeof body.symbol !== "string" ||
    typeof body.qty !== "number" ||
    !["buy", "sell"].includes(body.side)
  ) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (body.exchange !== "alpaca") {
    return NextResponse.json(
      { error: "Live trading currently supports only Alpaca.", code: "EXCHANGE_UNSUPPORTED" },
      { status: 400 }
    );
  }

  const { symbol, qty, side } = body as { symbol: string; qty: number; side: "buy" | "sell" };
  const orderType = (body.order_type as string | undefined) ?? "market";
  const limitPrice = typeof body.limit_price === "number" ? body.limit_price : undefined;
  const stopPrice = typeof body.stop_price === "number" ? body.stop_price : undefined;
  const validOrderTypes = ["market", "limit", "stop", "stop_limit"];
  if (!validOrderTypes.includes(orderType)) {
    return NextResponse.json({ error: `Invalid order_type: ${orderType}` }, { status: 400 });
  }
  if ((orderType === "limit" || orderType === "stop_limit") && limitPrice == null) {
    return NextResponse.json({ error: "limit_price required" }, { status: 400 });
  }
  if ((orderType === "stop" || orderType === "stop_limit") && stopPrice == null) {
    return NextResponse.json({ error: "stop_price required" }, { status: 400 });
  }
  if (!Number.isFinite(qty) || qty <= 0 || qty > 1_000_000) {
    return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
  }
  if (!isValidSymbolFormat(symbol)) {
    return NextResponse.json(
      { error: "Invalid symbol format", code: "SYMBOL_INVALID" },
      { status: 422 }
    );
  }

  // Gate: current disclaimer accepted
  const { data: consent } = await supabase
    .from("live_trading_consents")
    .select("id")
    .eq("user_id", user.id)
    .eq("disclaimer_version", DISCLAIMER_VERSION)
    .limit(1)
    .maybeSingle();
  if (!consent) {
    return NextResponse.json(
      {
        error: "You must accept the current live-trading risk disclaimer first.",
        code: "CONSENT_REQUIRED",
      },
      { status: 403 }
    );
  }

  // Gate: user has connected their own live Alpaca account
  const admin = createAdminSdk(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  const credentials = await getBrokerConnection(admin, user.id, "alpaca");
  if (!credentials) {
    return NextResponse.json(
      {
        error: "Connect your Alpaca live account before placing live trades.",
        code: "BROKER_NOT_CONNECTED",
      },
      { status: 400 }
    );
  }

  const openCheck = await supabase
    .from("trades")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "filled")
    .eq("is_paper", false);
  const positionsCheck = checkOpenPositions(openCheck.count ?? 0, limits);
  if (!positionsCheck.allowed) {
    return NextResponse.json(
      { error: positionsCheck.reason, code: positionsCheck.code },
      { status: 422 }
    );
  }

  const today = new Date().toISOString().split("T")[0];
  const { data: todayTrades } = await supabase
    .from("trades")
    .select("filled_price, qty, side")
    .eq("user_id", user.id)
    .eq("status", "filled")
    .eq("is_paper", false)
    .gte("created_at", `${today}T00:00:00.000Z`);
  const dailyPnl = (todayTrades ?? []).reduce((acc, t) => {
    const val = (t.filled_price ?? 0) * t.qty;
    return acc + (t.side === "sell" ? val : -val);
  }, 0);
  const lossCheck = checkDailyLoss(dailyPnl, limits);
  if (!lossCheck.allowed) {
    return NextResponse.json({ error: lossCheck.reason, code: lossCheck.code }, { status: 429 });
  }

  const exchangeAdapter = new AlpacaExchange({
    name: "alpaca",
    api_key: credentials.apiKey,
    api_secret: credentials.apiSecret,
    base_url: ALPACA_LIVE_URL,
  });

  const isValid = await exchangeAdapter.validateCredentials().catch(() => false);
  if (!isValid) {
    return NextResponse.json(
      { error: "Could not authenticate with your connected Alpaca account." },
      { status: 401 }
    );
  }

  let estimatedPrice = 0;
  try {
    estimatedPrice = await exchangeAdapter.getAssetPrice(symbol);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    const userInputError = /not found|invalid|no price data|no data|404|400/i.test(msg);
    return NextResponse.json(
      {
        error: `Could not fetch price for ${symbol}`,
        code: userInputError ? "SYMBOL_INVALID" : "PRICE_FETCH_FAILED",
      },
      { status: userInputError ? 422 : 502 }
    );
  }

  const validation = validateOrder(symbol, qty, estimatedPrice, limits);
  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.reason, code: validation.code },
      { status: 422 }
    );
  }

  let order;
  try {
    order = await exchangeAdapter.placeOrder(symbol, qty, side, {
      type: orderType as "market" | "limit" | "stop" | "stop_limit",
      limit_price: limitPrice,
      stop_price: stopPrice,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Order failed";
    log.error("live_trade.order_failed", { request_id: requestId, user_id: user.id, message: msg });
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const { data: trade, error: dbError } = await supabase
    .from("trades")
    .insert({
      user_id: user.id,
      symbol: symbol.toUpperCase(),
      side,
      qty,
      filled_price: order.filled_price,
      status: order.status,
      is_paper: false,
      alpaca_order_id: order.id,
    })
    .select()
    .single();

  if (dbError) {
    log.error("live_trade.insert_failed", {
      request_id: requestId,
      user_id: user.id,
      message: dbError.message,
    });
    return NextResponse.json(
      { error: `Order placed but failed to log trade: ${dbError.message}` },
      { status: 500 }
    );
  }

  log.info("live_trade.placed", {
    request_id: requestId,
    user_id: user.id,
    symbol,
    side,
    qty,
  });

  const { data: hooks } = await supabase
    .from("outgoing_webhooks")
    .select("id, label, url, events, created_at, last_delivery_at, last_delivery_status")
    .eq("user_id", user.id);
  if (hooks && hooks.length > 0) {
    const event = order.status === "filled" ? "trade.filled" : "trade.submitted";
    deliverWebhook(hooks, event, {
      symbol: symbol.toUpperCase(),
      side,
      qty,
      status: order.status,
      filled_price: order.filled_price,
      exchange: "alpaca",
      is_paper: false,
      trade_id: trade.id,
    });
  }

  return NextResponse.json({ trade, order }, { status: 201 });
});
