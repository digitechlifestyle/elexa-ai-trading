import type { RiskLimits } from "@/types";
import { DEFAULT_RISK_LIMITS } from "./risk-limits";

interface UserLike {
  user_metadata?: Record<string, unknown> | null;
}

/**
 * Read a user's custom risk limits from their auth metadata. Falls back to
 * the system defaults for any missing/invalid value.
 */
export function getRiskLimitsForUser(user: UserLike): RiskLimits {
  const raw = user.user_metadata?.risk_limits as
    | Partial<RiskLimits>
    | undefined;

  const safeNum = (val: unknown, fallback: number, lo: number, hi: number) => {
    const n = Number(val);
    if (!Number.isFinite(n) || n < lo || n > hi) return fallback;
    return n;
  };

  return {
    max_position_size_usd: safeNum(
      raw?.max_position_size_usd,
      DEFAULT_RISK_LIMITS.max_position_size_usd,
      0.01,
      1_000_000
    ),
    max_daily_loss_usd: safeNum(
      raw?.max_daily_loss_usd,
      DEFAULT_RISK_LIMITS.max_daily_loss_usd,
      0.01,
      100_000
    ),
    max_open_positions: Math.floor(
      safeNum(
        raw?.max_open_positions,
        DEFAULT_RISK_LIMITS.max_open_positions,
        1,
        1000
      )
    ),
    stop_loss_pct: safeNum(
      raw?.stop_loss_pct,
      DEFAULT_RISK_LIMITS.stop_loss_pct,
      0.1,
      50
    ),
  };
}
