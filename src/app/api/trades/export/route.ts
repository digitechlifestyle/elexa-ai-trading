import { createClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/observability/api-handler";
import { NextRequest, NextResponse } from "next/server";

function escapeCsv(v: unknown): string {
  if (v == null) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * GET /api/trades/export?format=csv
 * Streams all of the current user's trades as CSV for tax/record-keeping.
 */
export const GET = withApi(async function GET(_request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: trades, error } = await supabase
    .from("trades")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const headers = [
    "trade_id",
    "created_at",
    "symbol",
    "side",
    "qty",
    "filled_price",
    "notional",
    "status",
    "is_paper",
    "exchange_order_id",
  ];

  const rows = [headers.join(",")];
  for (const t of trades ?? []) {
    const notional =
      t.filled_price != null ? Number(t.filled_price) * Number(t.qty) : "";
    rows.push(
      [
        t.id,
        t.created_at,
        t.symbol,
        t.side,
        t.qty,
        t.filled_price ?? "",
        notional,
        t.status,
        t.is_paper,
        t.alpaca_order_id ?? "",
      ]
        .map(escapeCsv)
        .join(",")
    );
  }

  const csv = rows.join("\n");
  const today = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="elexa-trades-${today}.csv"`,
      "Cache-Control": "no-store",
    },
  });
});
