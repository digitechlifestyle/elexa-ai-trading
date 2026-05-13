import { createClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/observability/api-handler";
import { NextRequest, NextResponse } from "next/server";

function csvEscape(v: unknown): string {
  if (v == null) return "";
  const s = String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function toCsv(rows: Record<string, unknown>[], cols: string[]): string {
  const header = cols.join(",");
  const lines = rows.map((r) => cols.map((c) => csvEscape(r[c])).join(","));
  return [header, ...lines].join("\n");
}

export const GET = withApi(async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const kind = url.searchParams.get("kind") || "trades";

  let csv = "";
  let filename = "";

  if (kind === "trades") {
    const { data } = await supabase
      .from("trades")
      .select("symbol, side, qty, filled_price, limit_price, status, order_type, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    csv = toCsv(data ?? [], ["created_at", "symbol", "side", "qty", "order_type", "limit_price", "filled_price", "status"]);
    filename = `trades_${new Date().toISOString().slice(0, 10)}.csv`;
  } else if (kind === "journal") {
    const { data } = await supabase
      .from("journal_entries")
      .select("created_at, title, notes, tags")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    const rows = (data ?? []).map((r) => ({
      ...r,
      tags: Array.isArray(r.tags) ? r.tags.join("; ") : "",
    }));
    csv = toCsv(rows, ["created_at", "title", "tags", "notes"]);
    filename = `journal_${new Date().toISOString().slice(0, 10)}.csv`;
  } else if (kind === "agent-runs") {
    const { data } = await supabase
      .from("agent_runs")
      .select("created_at, agent, status, input, output")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    csv = toCsv(data ?? [], ["created_at", "agent", "status", "input", "output"]);
    filename = `agent_runs_${new Date().toISOString().slice(0, 10)}.csv`;
  } else {
    return NextResponse.json({ error: "Unknown kind" }, { status: 422 });
  }

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
});
