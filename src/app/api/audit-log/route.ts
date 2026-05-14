import { createClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/observability/api-handler";
import { NextResponse } from "next/server";

interface Event {
  time: string;
  kind: "trade" | "agent" | "journal" | "alert";
  title: string;
  detail: string;
}

export const GET = withApi(async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const since = new Date(Date.now() - 60 * 86400 * 1000).toISOString();

  const [tradesRes, agentsRes, journalRes] = await Promise.all([
    supabase.from("trades").select("*").eq("user_id", user.id).gte("created_at", since).order("created_at", { ascending: false }).limit(100),
    supabase.from("agent_runs").select("*").eq("user_id", user.id).gte("created_at", since).order("created_at", { ascending: false }).limit(50),
    supabase.from("journal_entries").select("*").eq("user_id", user.id).gte("created_at", since).order("created_at", { ascending: false }).limit(50),
  ]);

  const events: Event[] = [];

  for (const t of tradesRes.data ?? []) {
    events.push({
      time: t.created_at,
      kind: "trade",
      title: `${t.side?.toUpperCase()} ${t.qty} ${t.symbol}`,
      detail: `${t.order_type ?? "market"} · ${t.status} · ${t.filled_price ? `@ $${Number(t.filled_price).toFixed(2)}` : "—"}`,
    });
  }
  for (const a of agentsRes.data ?? []) {
    events.push({
      time: a.created_at,
      kind: "agent",
      title: `${a.agent} agent`,
      detail: `${a.status}${a.input ? ` · ${String(a.input).slice(0, 80)}` : ""}`,
    });
  }
  for (const j of journalRes.data ?? []) {
    events.push({
      time: j.created_at,
      kind: "journal",
      title: j.title ?? "Journal entry",
      detail: (j.notes ?? "").slice(0, 100),
    });
  }

  events.sort((a, b) => (a.time < b.time ? 1 : -1));
  return NextResponse.json({ events, count: events.length });
});
