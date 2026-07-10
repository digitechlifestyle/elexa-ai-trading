import { createClient as createAdminSdk } from "@supabase/supabase-js";
import { hashApiKey } from "./api-keys";

/**
 * Authenticate an incoming API request via Bearer token.
 * Returns { userId, keyId } on success, null on failure.
 *
 * Authorization: Bearer eai_<key>
 *
 * Looks up the key hash in the api_keys table (unique index on hash), so
 * this is a single indexed query regardless of user count. Previously this
 * scanned every user's user_metadata.api_keys[] via listUsers() — see
 * migration 008 for why that was replaced.
 */
export async function authenticateApiRequest(
  request: Request
): Promise<{ userId: string; keyId: string } | null> {
  const auth = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(eai_[A-Za-z0-9_-]+)$/.exec(auth);
  if (!match) return null;
  const plain = match[1];
  const hash = hashApiKey(plain);

  const admin = createAdminSdk(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data } = await admin
    .from("api_keys")
    .select("id, user_id")
    .eq("hash", hash)
    .maybeSingle();

  if (!data) return null;

  // Fire-and-forget — don't make the caller wait on this write.
  admin
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id)
    .then(
      () => {},
      () => {}
    );

  return { userId: data.user_id, keyId: data.id };
}
