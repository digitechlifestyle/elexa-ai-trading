import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/server";

export interface RateLimitConfig {
  /** Bucket key — usually user_id + ":" + route */
  key: string;
  /** Maximum requests in the window */
  limit: number;
  /** Window size in seconds */
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

/**
 * Sliding-window rate limiter backed by Postgres.
 *
 * For low-traffic apps this is fine. For high-traffic, swap in Upstash Redis
 * with the same interface — only the implementation needs to change.
 */
export async function checkRateLimit(
  config: RateLimitConfig,
  supabase?: SupabaseClient
): Promise<RateLimitResult> {
  const client = supabase ?? (await createAdminClient());
  const cutoff = new Date(Date.now() - config.windowSeconds * 1000);

  // Count events in the window
  const { count } = await client
    .from("rate_limit_events")
    .select("id", { count: "exact", head: true })
    .eq("bucket_key", config.key)
    .gte("created_at", cutoff.toISOString());

  const used = count ?? 0;
  const remaining = Math.max(0, config.limit - used - 1);
  const resetAt = new Date(Date.now() + config.windowSeconds * 1000);

  if (used >= config.limit) {
    return { allowed: false, remaining: 0, resetAt };
  }

  // Record this request
  await client
    .from("rate_limit_events")
    .insert({ bucket_key: config.key });

  // 0.5% chance to clean up old events (cheap async hygiene)
  if (Math.random() < 0.005) {
    await client.rpc("cleanup_old_rate_limit_events");
  }

  return { allowed: true, remaining, resetAt };
}

/**
 * Default rate limit policies by endpoint type.
 */
export const RATE_LIMITS = {
  // Trading: 10 trades per minute per user
  trading: { limit: 10, windowSeconds: 60 },
  // Agents: 20 invocations per 5 minutes per user (these are expensive)
  agents: { limit: 20, windowSeconds: 300 },
  // Auth: 5 attempts per minute per IP (login/signup)
  auth: { limit: 5, windowSeconds: 60 },
  // Generic API: 60 requests per minute per user
  api: { limit: 60, windowSeconds: 60 },
} as const;
