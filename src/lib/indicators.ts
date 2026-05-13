/**
 * Technical indicators — pure functions, no external deps.
 */

export function sma(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = [];
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    out.push(i >= period - 1 ? sum / period : null);
  }
  return out;
}

export function ema(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  if (values.length < period) return out;
  const k = 2 / (period + 1);
  let prev = values.slice(0, period).reduce((s, v) => s + v, 0) / period;
  out[period - 1] = prev;
  for (let i = period; i < values.length; i++) {
    prev = values[i] * k + prev * (1 - k);
    out[i] = prev;
  }
  return out;
}

export function rsi(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  if (values.length <= period) return out;
  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= period; i++) {
    const d = values[i] - values[i - 1];
    if (d > 0) gain += d;
    else loss -= d;
  }
  gain /= period;
  loss /= period;
  out[period] = loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);
  for (let i = period + 1; i < values.length; i++) {
    const d = values[i] - values[i - 1];
    const g = Math.max(d, 0);
    const l = Math.max(-d, 0);
    gain = (gain * (period - 1) + g) / period;
    loss = (loss * (period - 1) + l) / period;
    out[i] = loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);
  }
  return out;
}

export function macd(
  values: number[],
  fast = 12,
  slow = 26,
  signal = 9
): { macd: (number | null)[]; signal: (number | null)[]; histogram: (number | null)[] } {
  const emaFast = ema(values, fast);
  const emaSlow = ema(values, slow);
  const macdLine = values.map((_, i) => {
    const f = emaFast[i];
    const s = emaSlow[i];
    return f != null && s != null ? f - s : null;
  });
  const cleaned = macdLine.map((v) => (v == null ? 0 : v));
  const signalLine = ema(cleaned, signal).map((v, i) =>
    macdLine[i] == null ? null : v
  );
  const histogram = macdLine.map((m, i) =>
    m != null && signalLine[i] != null ? m - (signalLine[i] as number) : null
  );
  return { macd: macdLine, signal: signalLine, histogram };
}

export function bollinger(
  values: number[],
  period = 20,
  mult = 2
): { mid: (number | null)[]; upper: (number | null)[]; lower: (number | null)[] } {
  const mid = sma(values, period);
  const upper: (number | null)[] = new Array(values.length).fill(null);
  const lower: (number | null)[] = new Array(values.length).fill(null);
  for (let i = period - 1; i < values.length; i++) {
    const slice = values.slice(i - period + 1, i + 1);
    const m = mid[i] as number;
    const variance = slice.reduce((s, v) => s + (v - m) ** 2, 0) / period;
    const sd = Math.sqrt(variance);
    upper[i] = m + mult * sd;
    lower[i] = m - mult * sd;
  }
  return { mid, upper, lower };
}

/** ADX-lite: uses high/low/close. */
export function adx(
  highs: number[],
  lows: number[],
  closes: number[],
  period = 14
): (number | null)[] {
  const n = closes.length;
  const out: (number | null)[] = new Array(n).fill(null);
  if (n < period * 2) return out;

  const trArr: number[] = [0];
  const plusDM: number[] = [0];
  const minusDM: number[] = [0];
  for (let i = 1; i < n; i++) {
    const upMove = highs[i] - highs[i - 1];
    const downMove = lows[i - 1] - lows[i];
    plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);
    const tr = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    );
    trArr.push(tr);
  }

  // Smoothed values
  function smooth(arr: number[]): number[] {
    const res: number[] = new Array(arr.length).fill(0);
    let sum = 0;
    for (let i = 1; i <= period; i++) sum += arr[i] ?? 0;
    res[period] = sum;
    for (let i = period + 1; i < arr.length; i++) {
      res[i] = res[i - 1] - res[i - 1] / period + arr[i];
    }
    return res;
  }

  const trS = smooth(trArr);
  const plusS = smooth(plusDM);
  const minusS = smooth(minusDM);

  const plusDI: number[] = [];
  const minusDI: number[] = [];
  const dx: number[] = [];
  for (let i = 0; i < n; i++) {
    if (i < period || trS[i] === 0) {
      plusDI.push(0);
      minusDI.push(0);
      dx.push(0);
      continue;
    }
    const p = (100 * plusS[i]) / trS[i];
    const m = (100 * minusS[i]) / trS[i];
    plusDI.push(p);
    minusDI.push(m);
    const d = p + m > 0 ? (100 * Math.abs(p - m)) / (p + m) : 0;
    dx.push(d);
  }

  // ADX = SMA of DX over period
  let dxSum = 0;
  for (let i = period; i < period * 2 && i < n; i++) dxSum += dx[i];
  if (n > period * 2 - 1) {
    out[period * 2 - 1] = dxSum / period;
    for (let i = period * 2; i < n; i++) {
      const prev = out[i - 1] as number;
      out[i] = (prev * (period - 1) + dx[i]) / period;
    }
  }
  return out;
}
