import type { RiskLimits } from "@/types";

export const DEFAULT_RISK_LIMITS: RiskLimits = {
  max_position_size_usd: 5000,
  max_daily_loss_usd: 500,
  max_open_positions: 10,
  stop_loss_pct: 5,
};

export function validateOrder(
  symbol: string,
  qty: number,
  estimatedPrice: number,
  limits: RiskLimits = DEFAULT_RISK_LIMITS
): { valid: true } | { valid: false; reason: string } {
  const orderValue = qty * estimatedPrice;

  if (orderValue > limits.max_position_size_usd) {
    return {
      valid: false,
      reason: `Order value $${orderValue.toFixed(2)} exceeds max position size $${limits.max_position_size_usd}`,
    };
  }

  if (qty <= 0) {
    return { valid: false, reason: "Quantity must be greater than zero" };
  }

  if (!symbol || symbol.length > 10) {
    return { valid: false, reason: "Invalid symbol" };
  }

  return { valid: true };
}

export function checkDailyLoss(
  dailyPnl: number,
  limits: RiskLimits = DEFAULT_RISK_LIMITS
): { allowed: true } | { allowed: false; reason: string } {
  if (dailyPnl <= -limits.max_daily_loss_usd) {
    return {
      allowed: false,
      reason: `Daily loss limit of $${limits.max_daily_loss_usd} reached. No further paper trades until tomorrow.`,
    };
  }
  return { allowed: true };
}
