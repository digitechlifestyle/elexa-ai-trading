/**
 * Share tokens — base64url of "userId:tradeId" so anyone with the link can
 * resolve the trade. The trade must also be present in user_metadata.shared_trade_ids
 * for the public route to actually render it (privacy gate).
 */
function base64UrlEncode(s: string): string {
  return Buffer.from(s, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlDecode(s: string): string {
  const padded = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 ? "=".repeat(4 - (padded.length % 4)) : "";
  return Buffer.from(padded + pad, "base64").toString("utf8");
}

export function makeShareToken(userId: string, tradeId: string): string {
  return base64UrlEncode(`${userId}:${tradeId}`);
}

export function parseShareToken(token: string): { userId: string; tradeId: string } | null {
  try {
    const decoded = base64UrlDecode(token);
    const [userId, tradeId] = decoded.split(":");
    if (!userId || !tradeId) return null;
    return { userId, tradeId };
  } catch {
    return null;
  }
}
