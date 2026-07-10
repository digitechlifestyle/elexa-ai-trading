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
 * The count-check and the insert happen in one Postgres function
 * (check_and_increment_rate_limit, see migration 006) guarded by an advisory
 * lock keyed on the bucket, so concurrent requests for the same bucket can't
 * both read "under limit" before either records itself.
 *
 * For low-traffic apps this is fine. For high-traffic, swap in Upstash Redis
 * with the same interface — only the implementation needs to change.
 */
export async function checkRateLimit(
  config: RateLimitConfig,
  supabase?: SupabaseClient
): Promise<RateLimitResult> {
  const client = supabase ?? (await createAdminClient());
  const resetAt = new Date(Date.now() + config.windowSeconds * 1000);

  const { data, error } = await client
    .rpc("check_and_increment_rate_limit", {
      p_key: config.key,
      p_limit: config.limit,
      p_window_seconds: config.windowSeconds,
    })
    .single();

  if (error || !data) {
    // Fail closed: if the rate limiter itself is broken, don't let it become
    // an open door for the thing it's supposed to be guarding.
    return { allowed: false, remaining: 0, resetAt };
  }

  const result = data as { allowed: boolean; remaining: number };
  return { allowed: result.allowed, remaining: result.remaining, resetAt };
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
