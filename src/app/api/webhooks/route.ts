import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminSdk } from "@supabase/supabase-js";
import { withApi } from "@/lib/observability/api-handler";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

export interface OutgoingWebhook {
  id: string;
  label: string;
  url: string;
  events: ("trade.filled" | "trade.submitted" | "alert.triggered" | "agent.run")[];
  created_at: string;
  last_delivery_at: string | null;
  last_delivery_status: string | null;
}

function getHooks(user: { user_metadata?: Record<string, unknown> | null }): OutgoingWebhook[] {
  const arr = user.user_metadata?.outgoing_webhooks;
  return Array.isArray(arr) ? (arr as OutgoingWebhook[]) : [];
}

async function saveHooks(userId: string, existingMeta: Record<string, unknown>, hooks: OutgoingWebhook[]) {
  const admin = createAdminSdk(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  await admin.auth.admin.updateUserById(userId, {
    user_metadata: { ...existingMeta, outgoing_webhooks: hooks },
  });
}

export const GET = withApi(async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ hooks: getHooks(user) });
});

export const POST = withApi(async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  if (!body || typeof body.url !== "string" || !body.url.startsWith("http")) {
    return NextResponse.json({ error: "Valid URL required" }, { status: 400 });
  }
  // Restrict to Discord + Slack + generic HTTPS
  if (!/^https:\/\//.test(body.url)) {
    return NextResponse.json({ error: "HTTPS required" }, { status: 400 });
  }
  const label = String(body.label ?? "").slice(0, 50).trim() || "Untitled";
  const events = Array.isArray(body.events) ? body.events : ["trade.filled"];
  const validEvents = ["trade.filled", "trade.submitted", "alert.triggered", "agent.run"];
  const filtered = events.filter((e: string) => validEvents.includes(e));
  if (filtered.length === 0) {
    return NextResponse.json({ error: "At least one event" }, { status: 422 });
  }

  const current = getHooks(user);
  if (current.length >= 5) {
    return NextResponse.json({ error: "Webhook limit reached (5)" }, { status: 422 });
  }

  const hook: OutgoingWebhook = {
    id: randomUUID(),
    label,
    url: body.url,
    events: filtered,
    created_at: new Date().toISOString(),
    last_delivery_at: null,
    last_delivery_status: null,
  };
  const next = [...current, hook];
  await saveHooks(user.id, user.user_metadata ?? {}, next);
  return NextResponse.json({ hook });
});

export const DELETE = withApi(async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const current = getHooks(user);
  const next = current.filter((h) => h.id !== id);
  await saveHooks(user.id, user.user_metadata ?? {}, next);
  return NextResponse.json({ ok: true });
});
