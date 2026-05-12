import { createAdminClient } from "@/lib/supabase/server";
import { createClient as createAdminSdk } from "@supabase/supabase-js";
import { createExchange } from "@/lib/exchanges/factory";
import { log } from "@/lib/observability/logger";
import { NextRequest, NextResponse } from "next/server";

interface Alert {
  id: string;
  symbol: string;
  kind: "price_above" | "price_below" | "pnl_above_pct" | "pnl_below_pct";
  value: number;
  created_at: string;
  triggered_at?: string | null;
}

/**
 * Cron — check user alerts and mark triggered ones.
 * Runs every 5 min (or hourly on Vercel Hobby).
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;
  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createAdminClient();
  const admin = createAdminSdk(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Find users who have alerts set
  const { data: usersResp } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const usersWithAlerts = (usersResp?.users ?? []).filter((u) => {
    const a = u.user_metadata?.alerts;
    return Array.isArray(a) && a.length > 0;
  });

  // Build symbol set across users
  const symbolSet = new Set<string>();
  for (const u of usersWithAlerts) {
    for (const a of (u.user_metadata!.alerts as Alert[])) {
      if (!a.triggered_at) symbolSet.add(a.symbol);
    }
  }

  if (symbolSet.size === 0) {
    return NextResponse.json({ ok: true, checked: 0, triggered: 0 });
  }

  // Fetch prices for all symbols once via Alpaca adapter
  const exchange = createExchange("alpaca", {
    name: "alpaca",
    api_key: process.env.ALPACA_API_KEY ?? "",
    api_secret: process.env.ALPACA_API_SECRET ?? "",
    base_url: process.env.ALPACA_BASE_URL ?? "https://paper-api.alpaca.markets",
  });

  const prices: Record<string, number> = {};
  for (const sym of symbolSet) {
    try {
      prices[sym] = await exchange.getAssetPrice(sym);
    } catch {
      // skip symbols whose prices we can't fetch
    }
  }

  let triggeredCount = 0;
  let checkedCount = 0;

  for (const u of usersWithAlerts) {
    const alerts = u.user_metadata!.alerts as Alert[];
    let dirty = false;

    // For pnl alerts we need to compute current P&L per symbol for this user
    // Compute on demand to avoid loading trades for users without pnl alerts.
    let userPositions: Map<string, { avgCost: number; qty: number }> | null = null;
    async function computePositions() {
      if (userPositions) return userPositions;
      userPositions = new Map();
      const { data: trades } = await supabase
        .from("trades")
        .select("symbol, side, qty, filled_price, status")
        .eq("user_id", u.id)
        .eq("status", "filled");
      for (const t of trades ?? []) {
        const cur = userPositions.get(t.symbol) ?? { avgCost: 0, qty: 0 };
        const sign = t.side === "buy" ? 1 : -1;
        const newQty = cur.qty + sign * Number(t.qty);
        if (sign > 0) {
          const totalCost =
            cur.avgCost * cur.qty + Number(t.qty) * Number(t.filled_price);
          cur.avgCost = newQty !== 0 ? totalCost / newQty : 0;
        }
        cur.qty = newQty;
        userPositions.set(t.symbol, cur);
      }
      return userPositions;
    }

    for (const alert of alerts) {
      if (alert.triggered_at) continue;
      checkedCount++;
      const price = prices[alert.symbol];
      if (price == null) continue;

      let hit = false;
      if (alert.kind === "price_above" && price >= alert.value) hit = true;
      if (alert.kind === "price_below" && price <= alert.value) hit = true;
      if (alert.kind === "pnl_above_pct" || alert.kind === "pnl_below_pct") {
        const pos = (await computePositions()).get(alert.symbol);
        if (pos && pos.avgCost > 0 && pos.qty > 0) {
          const pnlPct = ((price - pos.avgCost) / pos.avgCost) * 100;
          if (alert.kind === "pnl_above_pct" && pnlPct >= alert.value) hit = true;
          if (alert.kind === "pnl_below_pct" && pnlPct <= alert.value) hit = true;
        }
      }
      if (hit) {
        alert.triggered_at = new Date().toISOString();
        dirty = true;
        triggeredCount++;
      }
    }

    if (dirty) {
      try {
        await admin.auth.admin.updateUserById(u.id, {
          user_metadata: { ...(u.user_metadata ?? {}), alerts },
        });
      } catch (err) {
        log.warn("cron.alerts.save_fail", {
          user_id: u.id,
          message: err instanceof Error ? err.message : "unknown",
        });
      }
    }
  }

  return NextResponse.json({ ok: true, checked: checkedCount, triggered: triggeredCount });
}
