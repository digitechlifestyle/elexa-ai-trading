import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminSdk } from "@supabase/supabase-js";
import { AlpacaExchange } from "@/lib/exchanges/alpaca";
import {
  saveBrokerConnection,
  listBrokerConnections,
  deleteBrokerConnection,
  type LiveExchangeName,
} from "@/lib/trading/broker-connections";
import { withApi } from "@/lib/observability/api-handler";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";

const ALPACA_LIVE_URL = "https://api.alpaca.markets";
const VALID_EXCHANGES: LiveExchangeName[] = ["alpaca"];

function adminClient() {
  return createAdminSdk(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export const GET = withApi(async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const connections = await listBrokerConnections(adminClient(), user.id);
  return NextResponse.json({ connections });
});

export const POST = withApi(async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await checkRateLimit({ key: `broker-connect:${user.id}`, ...RATE_LIMITS.api });
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many attempts. Try again shortly." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const exchange = body?.exchange as LiveExchangeName | undefined;
  const apiKey = body?.api_key as string | undefined;
  const apiSecret = body?.api_secret as string | undefined;

  if (!exchange || !VALID_EXCHANGES.includes(exchange)) {
    return NextResponse.json(
      { error: `Unsupported exchange for live trading: ${exchange ?? "(none)"}` },
      { status: 400 }
    );
  }
  if (!apiKey || !apiSecret || typeof apiKey !== "string" || typeof apiSecret !== "string") {
    return NextResponse.json({ error: "api_key and api_secret required" }, { status: 400 });
  }

  // Verify the credentials actually work against Alpaca's LIVE endpoint
  // before storing them — this also confirms it's a real live account, not
  // a paper-only key, since paper keys don't authenticate against this URL.
  const probe = new AlpacaExchange({
    name: "alpaca",
    api_key: apiKey,
    api_secret: apiSecret,
    base_url: ALPACA_LIVE_URL,
  });
  const valid = await probe.validateCredentials().catch(() => false);
  if (!valid) {
    return NextResponse.json(
      { error: "Could not authenticate with Alpaca using these credentials. Check they're LIVE (not paper) keys." },
      { status: 401 }
    );
  }

  await saveBrokerConnection(adminClient(), user.id, exchange, apiKey, apiSecret);
  return NextResponse.json({ ok: true, exchange, last4: apiKey.slice(-4) });
});

export const DELETE = withApi(async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const exchange = new URL(request.url).searchParams.get("exchange") as LiveExchangeName | null;
  if (!exchange || !VALID_EXCHANGES.includes(exchange)) {
    return NextResponse.json({ error: "Valid exchange required" }, { status: 400 });
  }

  await deleteBrokerConnection(adminClient(), user.id, exchange);
  return NextResponse.json({ ok: true });
});
