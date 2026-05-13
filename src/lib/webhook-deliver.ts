import type { OutgoingWebhook } from "@/app/api/webhooks/route";

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

async function deliverOne(
  hook: OutgoingWebhook,
  event: string,
  payload: Record<string, unknown>
): Promise<void> {
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

  await fetch(hook.url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
