/**
 * Scanner helpers. Pure functions over bar arrays.
 */
import { sma, rsi } from "./indicators";

export interface Bar { c: number; v: number; }

export function bollingerBandwidth(closes: number[], period = 20, mult = 2): number | null {
  if (closes.length < period) return null;
  const m = sma(closes, period).at(-1);
  if (m == null) return null;
  const slice = closes.slice(-period);
  const variance = slice.reduce((s, v) => s + (v - m) ** 2, 0) / period;
  const sd = Math.sqrt(variance);
  const upper = m + mult * sd;
  const lower = m - mult * sd;
  return m === 0 ? null : ((upper - lower) / m) * 100; // bandwidth %
}

export function bollingerSqueezeRank(closes: number[], period = 20, lookback = 120): number | null {
  // Current bandwidth as percentile of last `lookback` bandwidths
  if (closes.length < period + lookback) return null;
  const widths: number[] = [];
  for (let i = closes.length - lookback; i < closes.length; i++) {
    const w = bollingerBandwidth(closes.slice(0, i + 1), period);
    if (w != null) widths.push(w);
  }
  if (widths.length === 0) return null;
  const current = widths[widths.length - 1];
  const sorted = [...widths].sort((a, b) => a - b);
  const rank = sorted.indexOf(current);
  return (rank / sorted.length) * 100; // 0 = tightest squeeze, 100 = widest
}

export function lastRsi(closes: number[], period = 14): number | null {
  return rsi(closes, period).at(-1) ?? null;
}

export function volumeSpike(bars: Bar[], period = 20): number | null {
  if (bars.length < period + 1) return null;
  const last = bars[bars.length - 1].v;
  const avg = bars.slice(-period - 1, -1).reduce((s, b) => s + b.v, 0) / period;
  return avg === 0 ? null : last / avg;
}

export function zScore(closes: number[], period = 20): number | null {
  if (closes.length < period) return null;
  const slice = closes.slice(-period);
  const m = slice.reduce((s, v) => s + v, 0) / period;
  const sd = Math.sqrt(slice.reduce((s, v) => s + (v - m) ** 2, 0) / period);
  if (sd === 0) return null;
  return (closes[closes.length - 1] - m) / sd;
}
