import { createClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/observability/api-handler";
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM = `You are a trading psychology coach reviewing a trader's journal.
Analyse the entries and produce a structured summary with:

1. **Recurring themes** — patterns in setups, mistakes, emotions
2. **Wins** — what worked and why
3. **Mistakes** — repeated errors, FOMO, revenge trades, oversizing
4. **Emotional state** — overall tone (anxious, disciplined, frustrated, confident)
5. **Top 3 actions** — concrete behavioural changes for next week

Be direct. Quote specific phrases from the entries. No platitudes.
End with: "Research only — not financial advice."`;

export const POST = withApi(async function POST(_req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Pull last 30 days of journal entries
  const since = new Date(Date.now() - 30 * 86400 * 1000).toISOString();
  const { data: entries } = await supabase
    .from("journal_entries")
    .select("created_at, title, notes, tags")
    .eq("user_id", user.id)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(50);

  if (!entries || entries.length === 0) {
    return NextResponse.json({ error: "No journal entries in the last 30 days" }, { status: 422 });
  }

  const formatted = entries
    .map(
      (e) =>
        `[${new Date(e.created_at).toISOString().slice(0, 10)}${
          e.tags?.length ? ` · ${e.tags.join(", ")}` : ""
        }] ${e.title ?? ""}\n${e.notes ?? ""}`
    )
    .join("\n\n---\n\n");

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: `Last 30 days journal (${entries.length} entries):\n\n${formatted}`,
      },
    ],
  });

  const block = response.content[0];
  const summary = block.type === "text" ? block.text : "";

  return NextResponse.json({
    summary,
    entry_count: entries.length,
    generated_at: new Date().toISOString(),
  });
});
