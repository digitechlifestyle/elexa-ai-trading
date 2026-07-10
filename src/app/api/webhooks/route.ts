import { createClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/observability/api-handler";
import { isSafeWebhookUrl } from "@/lib/url-safety";
import { NextRequest, NextResponse } from "next/server";

export interface OutgoingWebhook {
  id: string;
  label: string;
  url: string;
  events: ("trade.filled" | "trade.submitted" | "alert.triggered" | "agent.run")[];
  created_at: string;
  last_delivery_at: string | null;
  last_delivery_status: string | null;
}

// RLS on outgoing_webhooks scopes every operation to the caller's own rows
// (see migration 008) — no service-role client needed for this route.

export const GET = withApi(async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data } = await supabase
    .from("outgoing_webhooks")
    .select("id, label, url, events, created_at, last_delivery_at, last_delivery_status")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  return NextResponse.json({ hooks: data ?? [] });
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
  // Restrict to Discord + Slack + generic HTTPS, and block internal/private
  // network destinations (SSRF: this URL gets fetched server-side on every
  // matching trade/agent event).
  const safety = await isSafeWebhookUrl(body.url);
  if (!safety.safe) {
    return NextResponse.json({ error: safety.reason ?? "URL not allowed" }, { status: 400 });
  }
  const label = String(body.label ?? "").slice(0, 50).trim() || "Untitled";
  const events = Array.isArray(body.events) ? body.events : ["trade.filled"];
  const validEvents = ["trade.filled", "trade.submitted", "alert.triggered", "agent.run"];
  const filtered = events.filter((e: string) => validEvents.includes(e));
  if (filtered.length === 0) {
    return NextResponse.json({ error: "At least one event" }, { status: 422 });
  }

  const { count } = await supabase
    .from("outgoing_webhooks")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);
  if ((count ?? 0) >= 5) {
    return NextResponse.json({ error: "Webhook limit reached (5)" }, { status: 422 });
  }

  const { data: hook, error } = await supabase
    .from("outgoing_webhooks")
    .insert({ user_id: user.id, label, url: body.url, events: filtered })
    .select("id, label, url, events, created_at, last_delivery_at, last_delivery_status")
    .single();

  if (error || !hook) {
    return NextResponse.json({ error: error?.message ?? "Failed to save webhook" }, { status: 500 });
  }
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
  await supabase.from("outgoing_webhooks").delete().eq("id", id).eq("user_id", user.id);
  return NextResponse.json({ ok: true });
});
