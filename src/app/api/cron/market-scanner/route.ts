import { createAdminClient } from "@/lib/supabase/server";
import { AgentBus } from "@/lib/agents/bus";
import { ALL_AGENTS } from "@/lib/agents/registry";
import { log } from "@/lib/observability/logger";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

/**
 * Cron — generate daily market scanner picks via Quant Agent.
 *
 * Schedule (vercel.json): "0 13 * * *" (13 UTC, after daily briefing).
 *
 * Stored as an agent_runs row owned by a system owner user, with agent="scanner".
 * Public scanner page reads via admin client.
 */
const SCAN_SYMBOLS = [
  "AAPL", "MSFT", "NVDA", "GOOGL", "META", "TSLA", "AMZN",
  "AMD", "AVGO", "ORCL", "COIN", "PLTR",
  "BTC", "ETH", "SOL", "XRP", "DOGE",
  "GLD", "SLV", "USO",
];

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;
  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createAdminClient();

  // Find a system owner user to attribute scanner runs to
  const { data: ownerProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "owner")
    .limit(1)
    .single();

  if (!ownerProfile?.id) {
    return NextResponse.json(
      { error: "No owner profile found to attribute scanner run" },
      { status: 500 }
    );
  }

  const prompt = `You are scanning these symbols for short-term trade ideas: ${SCAN_SYMBOLS.join(", ")}.

Generate a daily market scanner report. Output as markdown with these sections:

## Top 3 Long Ideas
For each, list: symbol, thesis (1-2 sentences), suggested entry/stop/target ranges, confidence (low/medium/high).

## Top 1 Short Idea
Same structure.

## Market Context
2-3 sentences on overall market posture today.

## Risk Notes
1-2 sentences on what could invalidate these ideas.

Remember: research only. Not financial advice. Include risk disclaimers naturally.`;

  try {
    const bus = new AgentBus(supabase, ownerProfile.id, ALL_AGENTS, randomUUID());
    const result = await bus.invoke("quant", prompt);

    // Persist as agent_runs row tagged "scanner"
    await supabase.from("agent_runs").insert({
      user_id: ownerProfile.id,
      agent: "scanner",
      input: "Daily market scanner",
      output: result.output,
      status: "completed",
    });

    log.info("cron.scanner.completed", {
      output_len: result.output.length,
    });

    return NextResponse.json({
      ok: true,
      output_preview: result.output.slice(0, 200),
    });
  } catch (err) {
    log.error("cron.scanner.failed", {
      message: err instanceof Error ? err.message : "unknown",
    });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Scanner failed" },
      { status: 500 }
    );
  }
}
