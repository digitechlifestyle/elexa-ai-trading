export interface Bar {
  t: string;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

export interface BacktestTrade {
  date: string;
  side: "buy" | "sell";
  price: number;
  reason: string;
}

export interface BacktestResult {
  strategy: string;
  symbol: string;
  bars_count: number;
  starting_cash: number;
  final_value: number;
  final_pnl: number;
  final_pnl_pct: number;
  trades: BacktestTrade[];
  equity_curve: { date: string; value: number }[];
  buy_hold_final: number;
  buy_hold_pnl_pct: number;
  win_rate_pct: number;
  total_trades: number;
}

type Strategy = (bars: Bar[]) => BacktestResult["trades"];

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

/** Buy when fast SMA crosses above slow SMA, sell when it crosses below. */
export const smaCrossoverStrategy: Strategy = (bars) => {
  if (bars.length < 50) return [];
  const closes = bars.map((b) => b.c);
  const fast = sma(closes, 10);
  const slow = sma(closes, 30);
  const trades: BacktestTrade[] = [];
  let inPosition = false;
  for (let i = 1; i < bars.length; i++) {
    if (fast[i] == null || slow[i] == null || fast[i - 1] == null || slow[i - 1] == null) continue;
    const crossUp = (fast[i] as number) > (slow[i] as number) && (fast[i - 1] as number) <= (slow[i - 1] as number);
    const crossDown = (fast[i] as number) < (slow[i] as number) && (fast[i - 1] as number) >= (slow[i - 1] as number);
    if (crossUp && !inPosition) {
      trades.push({ date: bars[i].t, side: "buy", price: bars[i].c, reason: "SMA10 crossed above SMA30" });
      inPosition = true;
    } else if (crossDown && inPosition) {
      trades.push({ date: bars[i].t, side: "sell", price: bars[i].c, reason: "SMA10 crossed below SMA30" });
      inPosition = false;
    }
  }
  // Close any open position at end of series
  if (inPosition) {
    const last = bars[bars.length - 1];
    trades.push({ date: last.t, side: "sell", price: last.c, reason: "Closed at end of period" });
  }
  return trades;
};

/** RSI(14) — buy when oversold <30, sell when overbought >70. */
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

export const rsiMeanReversionStrategy: Strategy = (bars) => {
  if (bars.length < 30) return [];
  const closes = bars.map((b) => b.c);
  const r = rsi(closes, 14);
  const trades: BacktestTrade[] = [];
  let inPosition = false;
  for (let i = 0; i < bars.length; i++) {
    if (r[i] == null) continue;
    const val = r[i] as number;
    if (val < 30 && !inPosition) {
      trades.push({ date: bars[i].t, side: "buy", price: bars[i].c, reason: `RSI ${val.toFixed(1)} (oversold)` });
      inPosition = true;
    } else if (val > 70 && inPosition) {
      trades.push({ date: bars[i].t, side: "sell", price: bars[i].c, reason: `RSI ${val.toFixed(1)} (overbought)` });
      inPosition = false;
    }
  }
  if (inPosition) {
    const last = bars[bars.length - 1];
    trades.push({ date: last.t, side: "sell", price: last.c, reason: "Closed at end of period" });
  }
  return trades;
};

export const STRATEGIES = {
  sma_crossover: {
    name: "SMA Crossover (10/30)",
    description: "Buy on fast SMA crossing above slow. Sell on cross below.",
    run: smaCrossoverStrategy,
  },
  rsi_mean_reversion: {
    name: "RSI Mean Reversion (14)",
    description: "Buy when RSI < 30 (oversold). Sell when RSI > 70.",
    run: rsiMeanReversionStrategy,
  },
} as const;

export type StrategyId = keyof typeof STRATEGIES;

export function runBacktest(
  strategyId: StrategyId,
  symbol: string,
  bars: Bar[],
  startingCash = 10000
): BacktestResult {
  const strategy = STRATEGIES[strategyId];
  const trades = strategy.run(bars);

  // Walk trades, compute equity curve and final P&L
  let cash = startingCash;
  let shares = 0;
  const equity_curve: { date: string; value: number }[] = [];
  let tradeIdx = 0;
  let entryPrice = 0;
  let wins = 0;
  let losses = 0;

  for (const bar of bars) {
    while (tradeIdx < trades.length && trades[tradeIdx].date === bar.t) {
      const t = trades[tradeIdx];
      if (t.side === "buy" && shares === 0) {
        shares = cash / t.price;
        entryPrice = t.price;
        cash = 0;
      } else if (t.side === "sell" && shares > 0) {
        cash = shares * t.price;
        if (t.price > entryPrice) wins++;
        else losses++;
        shares = 0;
      }
      tradeIdx++;
    }
    const value = cash + shares * bar.c;
    equity_curve.push({ date: bar.t, value });
  }

  const finalValue = equity_curve[equity_curve.length - 1]?.value ?? startingCash;
  const buyHoldFinal =
    bars.length > 1
      ? startingCash * (bars[bars.length - 1].c / bars[0].c)
      : startingCash;

  return {
    strategy: strategy.name,
    symbol,
    bars_count: bars.length,
    starting_cash: startingCash,
    final_value: finalValue,
    final_pnl: finalValue - startingCash,
    final_pnl_pct: ((finalValue - startingCash) / startingCash) * 100,
    trades,
    equity_curve,
    buy_hold_final: buyHoldFinal,
    buy_hold_pnl_pct: ((buyHoldFinal - startingCash) / startingCash) * 100,
    win_rate_pct: wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0,
    total_trades: trades.length,
  };
}
