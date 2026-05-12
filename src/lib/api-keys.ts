import crypto from "crypto";

/**
 * API keys are stored on the user's metadata as a list:
 *   { id, label, prefix, hash, created_at, last_used_at }
 * Only the prefix (first 12 chars) is shown to the user after creation.
 * The full key is shown ONCE on creation. We store SHA-256 hash for verification.
 */
export interface ApiKeyRecord {
  id: string;
  label: string;
  prefix: string;
  hash: string;
  created_at: string;
  last_used_at?: string | null;
}

export function generateApiKey(): { plain: string; hash: string; prefix: string } {
  const raw = crypto.randomBytes(32).toString("base64url");
  const plain = `eai_${raw}`;
  const hash = crypto.createHash("sha256").update(plain).digest("hex");
  const prefix = plain.slice(0, 12);
  return { plain, hash, prefix };
}

export function hashApiKey(plain: string): string {
  return crypto.createHash("sha256").update(plain).digest("hex");
}
