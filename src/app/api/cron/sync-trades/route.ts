import { createAdminClient } from "@/lib/supabase/server";
import { log } from "@/lib/observability/logger";
import { NextRequest, NextResponse } from "next/server";

/**
 * Cron — sync pending Alpaca paper orders to filled / cancelled / rejected.
 *
 * Schedule via vercel.json:
 *   { "crons": [{ "path": "/api/cron/sync-trades", "schedule": "*​/5 * * * *" }] }
 *
 * Vercel Cron sends a header "Authorization: Bearer <CRON_SECRET>" — we
 * verify it matches process.env.CRON_SECRET. Anyone calling without the
 * secret gets 401.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;
  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createAdminClient();

  // Pull pending Alpaca orders from last 7 days
  const since = new Date(Date.now() - 7 * 86400 * 1000).toISOString();
  const { data: pending, error } = await supabase
    .from("trades")
    .select("id, alpaca_order_id, symbol, side, qty, status, created_at")
    .eq("status", "pending")
    .eq("is_paper", true)
    .gte("created_at", since)
    .not("alpaca_order_id", "is", null);

  if (error) {
    log.error("cron.sync.list_failed", { message: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const alpacaKey = process.env.ALPACA_API_KEY ?? "";
  const alpacaSecret = process.env.ALPACA_API_SECRET ?? "";
  const alpacaBase =
    process.env.ALPACA_BASE_URL ?? "https://paper-api.alpaca.markets";

  if (!alpacaKey || !alpacaSecret) {
    return NextResponse.json({
      ok: true,
      checked: 0,
      updated: 0,
      message: "Alpaca keys not configured",
    });
  }

  const headers = {
    "APCA-API-KEY-ID": alpacaKey,
    "APCA-API-SECRET-KEY": alpacaSecret,
  };

  function normalize(
    s: string
  ): "pending" | "filled" | "cancelled" | "rejected" {
    const v = s.toLowerCase();
    if (v === "filled" || v === "partially_filled") return "filled";
    if (
      v === "new" ||
      v === "pending" ||
      v === "accepted" ||
      v === "pending_new" ||
      v === "accepted_for_bidding" ||
      v === "calculated" ||
      v === "held" ||
      v === "pending_cancel" ||
      v === "pending_replace"
    )
      return "pending";
    if (
      v === "cancelled" ||
      v === "canceled" ||
      v === "expired" ||
      v === "done_for_day" ||
      v === "replaced" ||
      v === "stopped" ||
      v === "suspended"
    )
      return "cancelled";
    return "rejected";
  }

  let updated = 0;
  let checked = 0;
  for (const t of pending ?? []) {
    if (!t.alpaca_order_id) continue;
    checked++;
    try {
      const res = await fetch(
        `${alpacaBase}/v2/orders/${t.alpaca_order_id}`,
        { headers }
      );
      if (!res.ok) continue;
      const order = (await res.json()) as {
        status: string;
        filled_avg_price?: string | null;
      };
      const newStatus = normalize(order.status);
      if (newStatus !== t.status) {
        const filledPrice = order.filled_avg_price
          ? parseFloat(order.filled_avg_price)
          : null;
        await supabase
          .from("trades")
          .update({
            status: newStatus,
            ...(filledPrice ? { filled_price: filledPrice } : {}),
          })
          .eq("id", t.id);
        updated++;
        log.info("cron.sync.updated", {
          trade_id: t.id,
          symbol: t.symbol,
          old: t.status,
          new: newStatus,
        });
      }
    } catch (err) {
      log.warn("cron.sync.fetch_failed", {
        trade_id: t.id,
        message: err instanceof Error ? err.message : "unknown",
      });
    }
  }

  return NextResponse.json({ ok: true, checked, updated });
}
