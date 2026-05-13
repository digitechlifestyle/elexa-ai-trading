/**
 * Preset strategy templates. Compatible with the custom-strategy interpreter.
 */

export interface StrategyTemplate {
  id: string;
  name: string;
  category: "Trend" | "Mean reversion" | "Momentum" | "Breakout" | "Volatility";
  description: string;
  pros: string;
  cons: string;
  rules: {
    entry: { indicator: string; op: string; value: number | string }[];
    exit: { indicator: string; op: string; value: number | string }[];
  };
}

export const TEMPLATES: StrategyTemplate[] = [
  {
    id: "sma-cross",
    name: "Golden / Death Cross",
    category: "Trend",
    description: "Buy when 50-SMA crosses above 200-SMA. Sell on opposite cross.",
    pros: "Catches major bull/bear regimes. Mechanical. Low frequency.",
    cons: "Late entries/exits. Whipsaws in sideways markets. ~6 trades/year.",
    rules: {
      entry: [{ indicator: "SMA(50)", op: ">", value: "SMA(200)" }],
      exit: [{ indicator: "SMA(50)", op: "<", value: "SMA(200)" }],
    },
  },
  {
    id: "rsi-mean-revert",
    name: "RSI Mean Reversion",
    category: "Mean reversion",
    description: "Buy when RSI(2) < 10 (deep oversold). Exit when RSI(2) > 70.",
    pros: "Connors-style. Works in ranging markets. Tight stops.",
    cons: "Dies in strong trends. Needs trend filter (price > 200 SMA).",
    rules: {
      entry: [{ indicator: "RSI(2)", op: "<", value: 10 }, { indicator: "Close", op: ">", value: "SMA(200)" }],
      exit: [{ indicator: "RSI(2)", op: ">", value: 70 }],
    },
  },
  {
    id: "donchian-20",
    name: "Turtle Breakout (20-day)",
    category: "Breakout",
    description: "Buy on close above 20-day high. Exit on close below 10-day low.",
    pros: "Classic. Catches major trends. Survives drawdowns long-term.",
    cons: "Many small losses. 30-40% win rate. Whipsaw heavy.",
    rules: {
      entry: [{ indicator: "Close", op: ">", value: "High(20)" }],
      exit: [{ indicator: "Close", op: "<", value: "Low(10)" }],
    },
  },
  {
    id: "bb-reversion",
    name: "Bollinger Reversion",
    category: "Mean reversion",
    description: "Buy when close touches lower BB. Exit at middle band (20 SMA).",
    pros: "Fast turnover. Statistical edge in range markets.",
    cons: "Catches knives in trending breakdowns. Needs vol filter.",
    rules: {
      entry: [{ indicator: "Close", op: "<", value: "BB Lower(20,2)" }],
      exit: [{ indicator: "Close", op: ">", value: "SMA(20)" }],
    },
  },
  {
    id: "macd-momentum",
    name: "MACD Momentum",
    category: "Momentum",
    description: "Buy when MACD line crosses above signal AND price > 200 SMA.",
    pros: "Confirmed momentum. Trend filter avoids countertrend signals.",
    cons: "Lag in fast moves. Misses bottoms.",
    rules: {
      entry: [{ indicator: "MACD", op: ">", value: "MACD Signal" }, { indicator: "Close", op: ">", value: "SMA(200)" }],
      exit: [{ indicator: "MACD", op: "<", value: "MACD Signal" }],
    },
  },
  {
    id: "atr-trailing",
    name: "ATR Trailing Stop",
    category: "Trend",
    description: "Buy on EMA(20) > EMA(50). Trail stop at close - 3×ATR(14).",
    pros: "Lets winners run, cuts losers fast. ATR adapts to volatility.",
    cons: "Wide stops in volatile markets reduce position size.",
    rules: {
      entry: [{ indicator: "EMA(20)", op: ">", value: "EMA(50)" }],
      exit: [{ indicator: "Close", op: "<", value: "Close - 3*ATR(14)" }],
    },
  },
  {
    id: "vol-breakout",
    name: "Volatility Squeeze Breakout",
    category: "Volatility",
    description: "Buy on close above BB upper after BB bandwidth percentile < 20%.",
    pros: "Catches expansion off compression. Strong directional moves.",
    cons: "False breakouts in news-driven markets.",
    rules: {
      entry: [{ indicator: "Close", op: ">", value: "BB Upper(20,2)" }, { indicator: "BB Bandwidth %ile", op: "<", value: 20 }],
      exit: [{ indicator: "Close", op: "<", value: "SMA(20)" }],
    },
  },
  {
    id: "supertrend-flip",
    name: "SuperTrend Flip",
    category: "Trend",
    description: "Buy on SuperTrend(10,3) flip to bullish. Exit on flip to bearish.",
    pros: "Simple, clear stop level (the trail). Few whipsaws.",
    cons: "Misses early entries on slow trends.",
    rules: {
      entry: [{ indicator: "SuperTrend(10,3) direction", op: "==", value: 1 }],
      exit: [{ indicator: "SuperTrend(10,3) direction", op: "==", value: -1 }],
    },
  },
];
