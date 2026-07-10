import type { OutgoingWebhook } from "@/app/api/webhooks/route";
import { isSafeWebhookUrl } from "@/lib/url-safety";
import { createClient as createAdminSdk } from "@supabase/supabase-js";

/**
 * Deliver a webhook event to user's configured outgoing webhooks.
 * Auto-detects Discord vs Slack vs generic JSON payload.
 *
 * Fire-and-forget — does not block the caller.
 */
export function deliverWebhook(
  hooks: OutgoingWebhook[],
  event: "trade.filled" | "trade.submitted" | "alert.triggered" | "agent.run",
  payload: Record<string, unknown>
): void {
  const matching = hooks.filter((h) => h.events.includes(event));
  for (const hook of matching) {
    deliverOne(hook, event, payload).catch(() => {
      // ignore — best effort
    });
  }
}

function adminClient() {
  return createAdminSdk(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function recordDelivery(hookId: string, status: string): Promise<void> {
  await adminClient()
    .from("outgoing_webhooks")
    .update({ last_delivery_at: new Date().toISOString(), last_delivery_status: status })
    .eq("id", hookId)
    .then(
      () => {},
      () => {}
    );
}

async function deliverOne(
  hook: OutgoingWebhook,
  event: string,
  payload: Record<string, unknown>
): Promise<void> {
  // Re-check at delivery time, not just at registration time — DNS can
  // change what a hostname resolves to between the two.
  const safety = await isSafeWebhookUrl(hook.url);
  if (!safety.safe) {
    await recordDelivery(hook.id, "blocked");
    return;
  }

  const isDiscord = /discord(app)?\.com\/api\/webhooks/.test(hook.url);
  const isSlack = /hooks\.slack\.com/.test(hook.url);

  let body: unknown;
  if (isDiscord) {
    body = {
      username: "Elexa AI Trading",
      embeds: [
        {
          title: `Event: ${event}`,
          description: "```json\n" + JSON.stringify(payload, null, 2).slice(0, 1500) + "\n```",
          color: 6356734, // indigo
          timestamp: new Date().toISOString(),
        },
      ],
    };
  } else if (isSlack) {
    body = {
      text: `*Elexa Event:* \`${event}\`\n\`\`\`${JSON.stringify(payload, null, 2).slice(0, 2000)}\`\`\``,
    };
  } else {
    body = { event, payload, timestamp: new Date().toISOString() };
  }

  let status: string;
  try {
    const res = await fetch(hook.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    status = res.ok ? "success" : `http_${res.status}`;
  } catch {
    status = "error";
    throw new Error(`Webhook delivery failed for hook ${hook.id}`);
  } finally {
    await recordDelivery(hook.id, status!);
  }
}
