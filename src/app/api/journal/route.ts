import { createClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/observability/api-handler";
import { log } from "@/lib/observability/logger";
import { NextRequest, NextResponse } from "next/server";

export const POST = withApi(async function POST(
  request: NextRequest,
  { requestId }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (
    !body ||
    typeof body.title !== "string" ||
    typeof body.notes !== "string"
  ) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const title = body.title.trim().slice(0, 120);
  const notes = body.notes.trim().slice(0, 10000);

  if (!title || !notes) {
    return NextResponse.json(
      { error: "Title and notes required" },
      { status: 400 }
    );
  }

  const trade_id =
    typeof body.trade_id === "string" && body.trade_id.length > 0
      ? body.trade_id
      : null;

  const { data, error } = await supabase
    .from("journal_entries")
    .insert({ user_id: user.id, title, notes, trade_id })
    .select()
    .single();

  if (error) {
    log.error("journal.insert_failed", {
      request_id: requestId,
      user_id: user.id,
      message: error.message,
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  log.info("journal.entry_created", {
    request_id: requestId,
    user_id: user.id,
    entry_id: data.id,
  });

  return NextResponse.json({ entry: data }, { status: 201 });
});
