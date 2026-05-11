import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminSdk } from "@supabase/supabase-js";
import { withApi } from "@/lib/observability/api-handler";
import { NextRequest, NextResponse } from "next/server";

export interface Notification {
  id: string;
  kind: "trade" | "agent" | "info";
  title: string;
  body: string;
  created_at: string;
  href?: string;
}

export const GET = withApi(async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sinceParam = new URL(request.url).searchParams.get("since");
  const since = sinceParam ? new Date(sinceParam) : new Date(Date.now() - 7 * 86400 * 1000);

  const [tradesRes, agentsRes] = await Promise.all([
    supabase
      .from("trades")
      .select("id, symbol, side, qty, status, created_at, filled_price")
      .eq("user_id", user.id)
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("agent_runs")
      .select("id, agent, status, created_at, input")
      .eq("user_id", user.id)
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const items: Notification[] = [];

  for (const t of tradesRes.data ?? []) {
    const sideUp = t.side.toUpperCase();
    if (t.status === "filled") {
      items.push({
        id: `trade-${t.id}`,
        kind: "trade",
        title: `${sideUp} ${t.qty} ${t.symbol} filled`,
        body: `Filled at $${t.filled_price ?? "—"}`,
        created_at: t.created_at,
        href: "/dashboard/portfolio",
      });
    } else if (t.status === "pending") {
      items.push({
        id: `trade-${t.id}`,
        kind: "trade",
        title: `${sideUp} ${t.qty} ${t.symbol} submitted`,
        body: "Awaiting market open / exchange confirmation.",
        created_at: t.created_at,
        href: "/dashboard/portfolio",
      });
    } else if (t.status === "rejected" || t.status === "cancelled") {
      items.push({
        id: `trade-${t.id}`,
        kind: "trade",
        title: `${sideUp} ${t.qty} ${t.symbol} ${t.status}`,
        body: "Order did not execute.",
        created_at: t.created_at,
        href: "/dashboard/portfolio",
      });
    }
  }

  for (const a of agentsRes.data ?? []) {
    items.push({
      id: `agent-${a.id}`,
      kind: "agent",
      title: `${a.agent.charAt(0).toUpperCase() + a.agent.slice(1)} Agent ${a.status}`,
      body: a.input.slice(0, 100),
      created_at: a.created_at,
      href: "/dashboard/agents",
    });
  }

  items.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

  const lastReadAt =
    (user.user_metadata?.notifications_last_read_at as string | undefined) ?? null;
  const unreadCount = lastReadAt
    ? items.filter((i) => i.created_at > lastReadAt).length
    : items.length;

  return NextResponse.json({
    items,
    unread_count: unreadCount,
    last_read_at: lastReadAt,
  });
});

export const POST = withApi(async function POST() {
  // Mark all as read by setting timestamp
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const admin = createAdminSdk(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  await admin.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...(user.user_metadata ?? {}),
      notifications_last_read_at: new Date().toISOString(),
    },
  });
  return NextResponse.json({ ok: true });
});
