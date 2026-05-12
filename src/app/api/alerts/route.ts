import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminSdk } from "@supabase/supabase-js";
import { withApi } from "@/lib/observability/api-handler";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

export type AlertKind =
  | "price_above"
  | "price_below"
  | "pnl_above_pct"
  | "pnl_below_pct";

export interface Alert {
  id: string;
  symbol: string;
  kind: AlertKind;
  value: number;
  created_at: string;
  triggered_at?: string | null;
}

function getAlerts(user: { user_metadata?: Record<string, unknown> | null }): Alert[] {
  const arr = user.user_metadata?.alerts;
  return Array.isArray(arr) ? (arr as Alert[]) : [];
}

async function saveAlerts(userId: string, existingMeta: Record<string, unknown>, alerts: Alert[]) {
  const admin = createAdminSdk(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  await admin.auth.admin.updateUserById(userId, {
    user_metadata: { ...existingMeta, alerts },
  });
}

export const GET = withApi(async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ alerts: getAlerts(user) });
});

export const POST = withApi(async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (
    !body ||
    typeof body.symbol !== "string" ||
    !["price_above", "price_below", "pnl_above_pct", "pnl_below_pct"].includes(body.kind) ||
    !Number.isFinite(Number(body.value))
  ) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const symbol = body.symbol.toUpperCase().trim();
  if (!/^[A-Z0-9./-]{1,12}$/.test(symbol)) {
    return NextResponse.json({ error: "Invalid symbol" }, { status: 422 });
  }

  const current = getAlerts(user);
  if (current.length >= 20) {
    return NextResponse.json({ error: "Alert limit reached (20)" }, { status: 422 });
  }

  const alert: Alert = {
    id: randomUUID(),
    symbol,
    kind: body.kind,
    value: Number(body.value),
    created_at: new Date().toISOString(),
    triggered_at: null,
  };

  const next = [...current, alert];
  await saveAlerts(user.id, user.user_metadata ?? {}, next);
  return NextResponse.json({ alerts: next });
});

export const DELETE = withApi(async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const current = getAlerts(user);
  const next = current.filter((a) => a.id !== id);
  await saveAlerts(user.id, user.user_metadata ?? {}, next);
  return NextResponse.json({ alerts: next });
});
