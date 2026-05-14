/**
 * Scanner helpers. Pure functions over bar arrays.
 */
import { sma, rsi, ema } from "./indicators";

export interface Bar { c: number; v: number; h?: number; l?: number; }
export interface OHLC { o: number; h: number; l: number; c: number; v: number; }

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

function atrSeries(bars: OHLC[], period: number): (number | null)[] {
  const out: (number | null)[] = new Array(bars.length).fill(null);
  if (bars.length < period + 1) return out;
  const trs: number[] = [];
  for (let i = 1; i < bars.length; i++) {
    trs.push(Math.max(
      bars[i].h - bars[i].l,
      Math.abs(bars[i].h - bars[i - 1].c),
      Math.abs(bars[i].l - bars[i - 1].c),
    ));
  }
  // Wilder smoothing
  let prev = trs.slice(0, period).reduce((s, v) => s + v, 0) / period;
  out[period] = prev;
  for (let i = period; i < trs.length; i++) {
    prev = (prev * (period - 1) + trs[i]) / period;
    out[i + 1] = prev;
  }
  return out;
}

export function superTrend(bars: OHLC[], period = 10, mult = 3): {
  direction: 1 | -1 | 0; level: number | null; flipped_recent: boolean;
} {
  if (bars.length < period + 2) return { direction: 0, level: null, flipped_recent: false };
  const atr = atrSeries(bars, period);
  const hl2 = bars.map((b) => (b.h + b.l) / 2);
  const upper: (number | null)[] = new Array(bars.length).fill(null);
  const lower: (number | null)[] = new Array(bars.length).fill(null);
  const trend: (1 | -1)[] = new Array(bars.length).fill(1);
  for (let i = 0; i < bars.length; i++) {
    const a = atr[i];
    if (a == null) continue;
    const basicUp = hl2[i] + mult * a;
    const basicDn = hl2[i] - mult * a;
    upper[i] = (upper[i - 1] != null && bars[i - 1].c <= (upper[i - 1] as number))
      ? Math.min(basicUp, upper[i - 1] as number) : basicUp;
    lower[i] = (lower[i - 1] != null && bars[i - 1].c >= (lower[i - 1] as number))
      ? Math.max(basicDn, lower[i - 1] as number) : basicDn;
    if (i === 0) { trend[i] = 1; continue; }
    if (trend[i - 1] === 1 && bars[i].c < (lower[i] as number)) trend[i] = -1;
    else if (trend[i - 1] === -1 && bars[i].c > (upper[i] as number)) trend[i] = 1;
    else trend[i] = trend[i - 1];
  }
  const last = trend[trend.length - 1];
  const prev = trend[trend.length - 2];
  const level = last === 1 ? lower[lower.length - 1] : upper[upper.length - 1];
  return { direction: last, level, flipped_recent: last !== prev };
}

/**
 * Connors RSI = (RSI(close,3) + RSI(streak,2) + PercentRank(ROC,100)) / 3
 * Streak = consecutive same-direction days
 */
export function connorsRsi(closes: number[]): number | null {
  if (closes.length < 100) return null;
  // RSI(3) on closes
  const r3 = rsi(closes, 3).at(-1);
  if (r3 == null) return null;

  // Streak series
  const streaks: number[] = [0];
  for (let i = 1; i < closes.length; i++) {
    const prev = streaks[i - 1];
    const dir = closes[i] > closes[i - 1] ? 1 : closes[i] < closes[i - 1] ? -1 : 0;
    if (dir === 0) streaks.push(0);
    else if ((prev > 0 && dir > 0) || (prev < 0 && dir < 0)) streaks.push(prev + dir);
    else streaks.push(dir);
  }
  const rStreak = rsi(streaks, 2).at(-1);
  if (rStreak == null) return null;

  // Percent rank of 1-day ROC over last 100
  const rocs: number[] = [];
  for (let i = 1; i < closes.length; i++) rocs.push((closes[i] - closes[i - 1]) / closes[i - 1]);
  const window = rocs.slice(-100);
  const last = window[window.length - 1];
  const below = window.filter((v) => v < last).length;
  const percentRank = (below / window.length) * 100;

  return (r3 + rStreak + percentRank) / 3;
}

/**
 * Money Flow Index — volume-weighted RSI
 * Period 14 default
 */
export function mfi(bars: OHLC[], period = 14): number | null {
  if (bars.length < period + 1) return null;
  const tp = bars.map((b) => (b.h + b.l + b.c) / 3);
  let posMf = 0;
  let negMf = 0;
  for (let i = bars.length - period; i < bars.length; i++) {
    if (i === 0) continue;
    const mf = tp[i] * bars[i].v;
    if (tp[i] > tp[i - 1]) posMf += mf;
    else if (tp[i] < tp[i - 1]) negMf += mf;
  }
  if (negMf === 0) return 100;
  const ratio = posMf / negMf;
  return 100 - 100 / (1 + ratio);
}

export function ttmSqueeze(bars: OHLC[], period = 20, bbMult = 2, kcMult = 1.5): {
  squeeze_on: boolean; momentum: number; firing: "up" | "down" | null;
} {
  if (bars.length < period + 5) return { squeeze_on: false, momentum: 0, firing: null };
  const closes = bars.map((b) => b.c);
  // Bollinger
  const bbSma = sma(closes, period).at(-1);
  const slice = closes.slice(-period);
  const m = slice.reduce((s, v) => s + v, 0) / period;
  const sd = Math.sqrt(slice.reduce((s, v) => s + (v - m) ** 2, 0) / period);
  const bbUp = (bbSma ?? 0) + bbMult * sd;
  const bbDn = (bbSma ?? 0) - bbMult * sd;
  // Keltner: EMA(close) ± mult × ATR
  const e = ema(closes, period).at(-1) ?? 0;
  const atr = atrSeries(bars, period).at(-1) ?? 0;
  const kcUp = e + kcMult * atr;
  const kcDn = e - kcMult * atr;
  const squeezeOn = bbUp < kcUp && bbDn > kcDn;

  // Momentum: linear regression of (close - (highest+lowest)/2 mid average) over period
  const hh = Math.max(...bars.slice(-period).map((b) => b.h));
  const ll = Math.min(...bars.slice(-period).map((b) => b.l));
  const mid = (hh + ll) / 2;
  const smaC = bbSma ?? 0;
  const momentum = closes[closes.length - 1] - (mid + smaC) / 2;

  // Firing: squeeze was on previously, now off, and momentum direction
  // Simplified: report firing direction if squeeze is currently off
  const firing = !squeezeOn ? (momentum > 0 ? "up" : "down") : null;
  return { squeeze_on: squeezeOn, momentum, firing };
}
