import { createAdminClient } from "@/lib/supabase/server";
import { createClient as createAdminSdk } from "@supabase/supabase-js";
import { AgentBus } from "@/lib/agents/bus";
import { ALL_AGENTS } from "@/lib/agents/registry";
import { log } from "@/lib/observability/logger";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

/**
 * Cron — generate a CEO Agent daily briefing for each active user.
 *
 * Schedule via vercel.json (once a day at 12 UTC = 7 AM ET, 8 AM in BST):
 *   { "path": "/api/cron/daily-briefing", "schedule": "0 12 * * *" }
 *
 * For each active user (placed a trade or ran an agent in last 7 days):
 *   1. Pull their last 24h activity (trades + agent runs).
 *   2. Run CEO agent to produce briefing.
 *   3. Store briefing in user.user_metadata.daily_briefing.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;
  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createAdminClient();

  // Active users in last 7 days
  const since = new Date(Date.now() - 7 * 86400 * 1000).toISOString();
  const { data: recentTrades } = await supabase
    .from("trades")
    .select("user_id")
    .gte("created_at", since);
  const { data: recentAgents } = await supabase
    .from("agent_runs")
    .select("user_id")
    .gte("created_at", since);

  const activeIds = new Set<string>([
    ...((recentTrades ?? []).map((t) => t.user_id)),
    ...((recentAgents ?? []).map((a) => a.user_id)),
  ]);

  const admin = createAdminSdk(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Cap: only run for up to 100 users per invocation to keep cost predictable.
  const userIds = Array.from(activeIds).slice(0, 100);
  let success = 0;
  let failed = 0;

  for (const userId of userIds) {
    try {
      const since24h = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const [tRes, aRes] = await Promise.all([
        supabase
          .from("trades")
          .select("symbol, side, qty, filled_price, status, created_at")
          .eq("user_id", userId)
          .gte("created_at", since24h)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("agent_runs")
          .select("agent, status, created_at")
          .eq("user_id", userId)
          .gte("created_at", since24h)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

      const tradesSummary =
        (tRes.data ?? [])
          .map(
            (t) =>
              `- ${t.side.toUpperCase()} ${t.qty} ${t.symbol} @ $${t.filled_price ?? "—"} (${t.status})`
          )
          .join("\n") || "No trades in last 24h.";
      const agentSummary =
        (aRes.data ?? [])
          .map((a) => `- ${a.agent} agent: ${a.status}`)
          .join("\n") || "No agent runs in last 24h.";

      const prompt = `Generate a concise (under 150 words) board briefing for the user covering the last 24 hours.

Trades:
${tradesSummary}

Agent activity:
${agentSummary}

Format as 3-4 short bullet points. End with one action item the user might consider for today. Remember: research only, not financial advice.`;

      const bus = new AgentBus(supabase, userId, ALL_AGENTS, randomUUID());
      const result = await bus.invoke("ceo", prompt);

      const { data: userResp } = await admin.auth.admin.getUserById(userId);
      const existing = userResp?.user?.user_metadata ?? {};
      await admin.auth.admin.updateUserById(userId, {
        user_metadata: {
          ...existing,
          daily_briefing: {
            content: result.output,
            generated_at: new Date().toISOString(),
          },
        },
      });
      success++;
    } catch (err) {
      failed++;
      log.warn("cron.briefing.fail", {
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
