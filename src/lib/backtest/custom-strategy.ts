/**
 * Custom strategy executor — interprets user-defined rules against historical bars.
 *
 * Rule shape (both buy and sell required):
 *   indicator: "rsi" | "sma_fast" | "sma_slow" | "price"
 *   op: "lt" | "lte" | "gt" | "gte" | "crosses_above" | "crosses_below"
 *   value: number   // for rsi/price comparisons
 *   compare_to?: "sma_fast" | "sma_slow" | "rsi" | "price"  // for cross ops
 *
 * Buy when buy_rule fires AND no position open.
 * Sell when sell_rule fires AND position open.
 */

import type { Bar, BacktestTrade } from "./strategies";

export interface CustomRule {
  indicator: "rsi" | "sma_fast" | "sma_slow" | "price";
  op: "lt" | "lte" | "gt" | "gte" | "crosses_above" | "crosses_below";
  value?: number;
  compare_to?: "sma_fast" | "sma_slow" | "rsi" | "price";
}

export interface CustomStrategyConfig {
  sma_fast_period: number;
  sma_slow_period: number;
  rsi_period: number;
  buy_rule: CustomRule;
  sell_rule: CustomRule;
}

function sma(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = [];
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    out.push(i >= period - 1 ? sum / period : null);
  }
  return out;
}

function rsi(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  if (values.length <= period) return out;
  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = values[i] - values[i - 1];
    if (diff > 0) gain += diff;
    else loss -= diff;
  }
  gain /= period;
  loss /= period;
  out[period] = loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);
  for (let i = period + 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    const g = Math.max(diff, 0);
    const l = Math.max(-diff, 0);
    gain = (gain * (period - 1) + g) / period;
    loss = (loss * (period - 1) + l) / period;
    out[i] = loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);
  }
  return out;
}

function readSeries(
  name: CustomRule["indicator"] | CustomRule["compare_to"] | undefined,
  bars: Bar[],
  cache: {
    smaF: (number | null)[];
    smaS: (number | null)[];
    rsi: (number | null)[];
  }
): (number | null)[] {
  switch (name) {
    case "sma_fast":
      return cache.smaF;
    case "sma_slow":
      return cache.smaS;
    case "rsi":
      return cache.rsi;
    case "price":
      return bars.map((b) => b.c);
    default:
      return new Array(bars.length).fill(null);
  }
}

function ruleFires(
  i: number,
  rule: CustomRule,
  bars: Bar[],
  cache: {
    smaF: (number | null)[];
    smaS: (number | null)[];
    rsi: (number | null)[];
  }
): boolean {
  const series = readSeries(rule.indicator, bars, cache);
  const v = series[i];
  if (v == null) return false;

  if (rule.op === "lt") return rule.value != null && v < rule.value;
  if (rule.op === "lte") return rule.value != null && v <= rule.value;
  if (rule.op === "gt") return rule.value != null && v > rule.value;
  if (rule.op === "gte") return rule.value != null && v >= rule.value;

  if (rule.op === "crosses_above" || rule.op === "crosses_below") {
    if (i === 0) return false;
    const other = readSeries(rule.compare_to, bars, cache);
    const a0 = series[i - 1];
    const b0 = other[i - 1];
    const a1 = v;
    const b1 = other[i];
    if (a0 == null || a1 == null || b0 == null || b1 == null) return false;
    if (rule.op === "crosses_above") return a1 > b1 && a0 <= b0;
    return a1 < b1 && a0 >= b0;
  }
  return false;
}

export function runCustomStrategy(
  bars: Bar[],
  config: CustomStrategyConfig
): BacktestTrade[] {
  if (bars.length < Math.max(config.sma_slow_period, config.rsi_period) + 1)
    return [];
  const closes = bars.map((b) => b.c);
  const cache = {
    smaF: sma(closes, config.sma_fast_period),
    smaS: sma(closes, config.sma_slow_period),
    rsi: rsi(closes, config.rsi_period),
  };
  const trades: BacktestTrade[] = [];
  let inPosition = false;
  for (let i = 1; i < bars.length; i++) {
    if (!inPosition && ruleFires(i, config.buy_rule, bars, cache)) {
      trades.push({
        date: bars[i].t,
        side: "buy",
        price: bars[i].c,
        reason: `Custom buy rule: ${config.buy_rule.indicator} ${config.buy_rule.op} ${
          config.buy_rule.compare_to ?? config.buy_rule.value
        }`,
      });
      inPosition = true;
    } else if (inPosition && ruleFires(i, config.sell_rule, bars, cache)) {
      trades.push({
        date: bars[i].t,
        side: "sell",
        price: bars[i].c,
        reason: `Custom sell rule: ${config.sell_rule.indicator} ${config.sell_rule.op} ${
          config.sell_rule.compare_to ?? config.sell_rule.value
        }`,
      });
      inPosition = false;
    }
  }
  if (inPosition) {
    const last = bars[bars.length - 1];
    trades.push({
      date: last.t,
      side: "sell",
      price: last.c,
      reason: "Closed at end of period",
    });
  }
  return trades;
}
