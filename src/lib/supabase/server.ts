import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          // In Server Components, cookieStore.set() throws.
          // Cookie refresh is handled by the proxy on every request,
          // so swallow the error here. Route Handlers and Server Actions
          // can still set cookies as normal.
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component: ignore — proxy refreshes session.
          }
        },
      },
    }
  );
}

export async function createAdminClient() {
  // Deliberately NOT createServerClient (@supabase/ssr) here — that variant
  // wires itself to the request's cookies, and once a real user session is
  // present it authenticates PostgREST calls as that user instead of
  // service_role, no matter what key is passed in. This client must stay
  // cookie-free so it always authenticates as service_role.
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
