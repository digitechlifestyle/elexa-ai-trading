import { createAdminClient } from "@/lib/supabase/server";
import { createClient as createAdminSdk } from "@supabase/supabase-js";
import { AgentBus } from "@/lib/agents/bus";
import { ALL_AGENTS } from "@/lib/agents/registry";
import { log } from "@/lib/observability/logger";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

/**
 * Cron — generate weekly trading review per active user.
 * Schedule: Sundays 18:00 UTC.
 * Stores into user_metadata.weekly_review (overwrites prior week).
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;
  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createAdminClient();
  const since = new Date(Date.now() - 14 * 86400 * 1000).toISOString();

  // Identify active users (trade or agent run in last 14 days)
  const [tradesRes, agentsRes] = await Promise.all([
    supabase.from("trades").select("user_id").gte("created_at", since),
    supabase.from("agent_runs").select("user_id").gte("created_at", since),
  ]);
  const active = new Set<string>([
    ...((tradesRes.data ?? []).map((t) => t.user_id)),
    ...((agentsRes.data ?? []).map((a) => a.user_id)),
  ]);

  const admin = createAdminSdk(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const userIds = Array.from(active).slice(0, 100);
  let success = 0;
  let failed = 0;
  const weekAgo = new Date(Date.now() - 7 * 86400 * 1000).toISOString();

  for (const userId of userIds) {
    try {
      const [tRes, aRes] = await Promise.all([
        supabase
          .from("trades")
          .select("symbol, side, qty, filled_price, status, created_at")
          .eq("user_id", userId)
          .gte("created_at", weekAgo),
        supabase
          .from("agent_runs")
          .select("agent, status, created_at")
          .eq("user_id", userId)
          .gte("created_at", weekAgo),
      ]);

      const trades = tRes.data ?? [];
      const agents = aRes.data ?? [];

      if (trades.length === 0 && agents.length === 0) continue;

      // Compute realised P&L
      let realisedPnl = 0;
      const symbolPnl = new Map<string, number>();
      for (const t of trades) {
        if (t.status !== "filled" || t.filled_price == null) continue;
        const val = Number(t.filled_price) * Number(t.qty);
        const sign = t.side === "sell" ? 1 : -1;
        realisedPnl += sign * val;
        symbolPnl.set(t.symbol, (symbolPnl.get(t.symbol) ?? 0) + sign * val);
      }
      const top = Array.from(symbolPnl.entries()).sort(
        (a, b) => Math.abs(b[1]) - Math.abs(a[1])
      );
      const symbolsLine = top
        .slice(0, 5)
        .map(
          ([s, p]) =>
            `${s} ${p >= 0 ? "+" : ""}$${p.toFixed(2)}`
        )
        .join(", ");

      const tradeSummary = trades
        .map(
          (t) =>
            `- ${t.side.toUpperCase()} ${t.qty} ${t.symbol} @ $${t.filled_price ?? "—"} (${t.status})`
        )
        .join("\n") || "No trades this week.";
      const agentSummary = agents
        .map((a) => `- ${a.agent} (${a.status})`)
        .join("\n") || "No agent activity.";

      const prompt = `Generate a weekly trading review for the user. Markdown with sections:

## Week in numbers
Bullet list — trades placed, agent runs, realised P&L: $${realisedPnl.toFixed(2)}, top movers: ${symbolsLine || "none"}.

## What went well
2-3 specific observations from the data.

## What needs work
2-3 honest critiques. Be direct. No hedging.

## Focus for next week
1-2 specific suggestions tied to observed patterns.

## Reminder
1 line — paper trading only, research, not advice.

Trades this week:
${tradeSummary}

Agent activity:
${agentSummary}`;

      const bus = new AgentBus(supabase, userId, ALL_AGENTS, randomUUID());
      const result = await bus.invoke("ceo", prompt);

      const { data: userResp } = await admin.auth.admin.getUserById(userId);
      const existing = userResp?.user?.user_metadata ?? {};
      await admin.auth.admin.updateUserById(userId, {
        user_metadata: {
          ...existing,
          weekly_review: {
            content: result.output,
            week_start: weekAgo,
            generated_at: new Date().toISOString(),
            trades_count: trades.length,
            realised_pnl: realisedPnl,
          },
        },
      });
      success++;
    } catch (err) {
      failed++;
      log.warn("cron.weekly.fail", {
        user_id: userId,
        message: err instanceof Error ? err.message : "unknown",
      });
    }
  }

  return NextResponse.json({
    ok: true,
    processed: userIds.length,
    success,
    failed,
  });
}
