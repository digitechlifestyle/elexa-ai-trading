import { createClient } from "@/lib/supabase/server";
import { runQuantAgent } from "@/lib/agents/quant";
import { runRiskAgent } from "@/lib/agents/risk";
import { runCeoAgent } from "@/lib/agents/ceo";
import { runComplianceAgent } from "@/lib/agents/compliance";
import { runSeoAgent } from "@/lib/agents/seo";
import { runSupportAgent } from "@/lib/agents/support";
import { NextRequest, NextResponse } from "next/server";
import type { AgentName } from "@/types";

const AGENT_RUNNERS: Record<AgentName, (input: string) => Promise<string>> = {
  quant: runQuantAgent,
  risk: runRiskAgent,
  ceo: runCeoAgent,
  compliance: runComplianceAgent,
  seo: runSeoAgent,
  support: runSupportAgent,
};

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.agent !== "string" || typeof body.input !== "string") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const agent = body.agent as AgentName;
  if (!(agent in AGENT_RUNNERS)) {
    return NextResponse.json({ error: `Unknown agent: ${agent}` }, { status: 400 });
  }

  // Create run record
  const { data: run, error: insertError } = await supabase
    .from("agent_runs")
    .insert({
      user_id: user.id,
      agent,
      input: body.input,
      status: "running",
    })
    .select()
    .single();

  if (insertError || !run) {
    return NextResponse.json({ error: "Failed to create agent run" }, { status: 500 });
  }

  // Execute agent
  let output: string;
  let status: "completed" | "failed";
  try {
    output = await AGENT_RUNNERS[agent](body.input);
    status = "completed";
  } catch (err) {
    output = err instanceof Error ? err.message : "Agent failed";
    status = "failed";
  }

  // Update run record
  await supabase
    .from("agent_runs")
    .update({ output, status })
    .eq("id", run.id);

  return NextResponse.json({ run: { ...run, output, status } }, { status: 200 });
}
