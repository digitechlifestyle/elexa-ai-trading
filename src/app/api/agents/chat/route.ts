import { createClient } from "@/lib/supabase/server";
import { AgentBus } from "@/lib/agents/bus";
import { ALL_AGENTS } from "@/lib/agents/registry";
import { withApi } from "@/lib/observability/api-handler";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

/**
 * Conversational AI chat — routes user messages to the Support Agent.
 * Persists into agent_messages for full audit.
 * Body: { message: string, correlation_id?: string }
 *   If correlation_id supplied, continues the same conversation.
 */
export const POST = withApi(async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await checkRateLimit({
    key: `agents:${user.id}`,
    ...RATE_LIMITS.agents,
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Rate limited. Try again shortly." },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.message !== "string" || !body.message.trim()) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const correlationId =
    typeof body.correlation_id === "string" && body.correlation_id
      ? body.correlation_id
      : randomUUID();

  const bus = new AgentBus(supabase, user.id, ALL_AGENTS, correlationId);

  try {
    const result = await bus.invoke("support", body.message);
    return NextResponse.json({
      reply: result.output,
      correlation_id: correlationId,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Chat failed",
      },
      { status: 500 }
    );
  }
});
