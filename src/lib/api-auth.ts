import { createClient as createAdminSdk } from "@supabase/supabase-js";
import { hashApiKey, type ApiKeyRecord } from "./api-keys";

/**
 * Authenticate an incoming API request via Bearer token.
 * Returns { userId, keyId } on success, null on failure.
 *
 * Authorization: Bearer eai_<key>
 *
 * Scans user_metadata.api_keys[] across users until hash matches.
 * For low traffic this is fine. At scale this should be a Postgres table with
 * an index on hash — out of scope for this MVP.
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

  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
  for (const u of data?.users ?? []) {
    const keys = (u.user_metadata?.api_keys ?? []) as ApiKeyRecord[];
    if (!Array.isArray(keys)) continue;
    const found = keys.find((k) => k.hash === hash);
    if (found) {
      // Update last_used_at (fire-and-forget)
      const next = keys.map((k) =>
        k.id === found.id ? { ...k, last_used_at: new Date().toISOString() } : k
      );
      admin.auth.admin
        .updateUserById(u.id, {
          user_metadata: { ...(u.user_metadata ?? {}), api_keys: next },
        })
        .catch(() => {});
      return { userId: u.id, keyId: found.id };
    }
  }

  return null;
}
