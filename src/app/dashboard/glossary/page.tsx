interface Term {
  term: string;
  category: string;
  definition: string;
  formula?: string;
  example?: string;
}

const TERMS: Term[] = [
  { term: "Alpha", category: "Performance", definition: "Excess return after adjusting for benchmark beta. Positive alpha = genuine outperformance.", formula: "α = R_p - (R_f + β(R_m - R_f))" },
  { term: "Beta", category: "Risk", definition: "Sensitivity to benchmark. β=1 moves with market; β>1 amplifies; β<0 inverse.", formula: "β = Cov(R_a, R_m) / Var(R_m)" },
  { term: "Sharpe Ratio", category: "Performance", definition: "Risk-adjusted return per unit of volatility. >1 good, >2 great, >3 elite.", formula: "(R - R_f) / σ" },
  { term: "Sortino Ratio", category: "Performance", definition: "Sharpe variant penalising only downside volatility.", formula: "(R - R_f) / σ_downside" },
  { term: "Calmar Ratio", category: "Performance", definition: "CAGR divided by max drawdown. Captures return per unit of pain.", formula: "CAGR / |Max DD|" },
  { term: "CAGR", category: "Performance", definition: "Compound Annual Growth Rate. Smoothed annualised return.", formula: "(End/Start)^(1/years) - 1" },
  { term: "Max Drawdown", category: "Risk", definition: "Largest peak-to-trough decline. Sets psychological survival ceiling.", formula: "min((P_t - max_{s≤t}(P_s)) / max)" },
  { term: "VaR", category: "Risk", definition: "Value at Risk. Worst expected loss at confidence level over horizon.", example: "95% VaR = $1000 means 95% confident loss won't exceed $1000." },
  { term: "Expectancy", category: "Trade stats", definition: "Average expected $ per trade. Positive = system has edge.", formula: "(WinRate × AvgWin) - (LossRate × AvgLoss)" },
  { term: "Profit Factor", category: "Trade stats", definition: "Gross wins divided by gross losses. >1.5 strong, >2 elite.", formula: "Σ(wins) / Σ(|losses|)" },
  { term: "R-multiple", category: "Trade stats", definition: "Profit measured in units of initial risk (R). +2R = made 2x what you risked.", example: "Risk $100, gain $300 = 3R trade." },
  { term: "Kelly Criterion", category: "Sizing", definition: "Optimal bet fraction for max long-run growth.", formula: "f* = (bp - q) / b where b=payoff, p=win rate, q=1-p" },
  { term: "ATR", category: "Volatility", definition: "Average True Range — Wilder's volatility measure. Used for stops, sizing.", formula: "EMA(max(H-L, |H-Cp|, |L-Cp|), n)" },
  { term: "Implied Volatility (IV)", category: "Volatility", definition: "Market's expected forward volatility implied by option prices. Annualised %." },
  { term: "Implied Move", category: "Volatility", definition: "Expected 1-sigma move by expiry. ~68% chance stock stays inside the band.", formula: "price × IV × √(days/365), or 0.85 × straddle" },
  { term: "RSI", category: "Momentum", definition: "Relative Strength Index. Oscillator 0-100. >70 overbought, <30 oversold.", formula: "100 - 100/(1+RS), RS = avg gain / avg loss" },
  { term: "MACD", category: "Momentum", definition: "Moving Average Convergence Divergence. Trend + momentum hybrid.", formula: "EMA(12) - EMA(26); signal = EMA(MACD, 9)" },
  { term: "Bollinger Bands", category: "Volatility", definition: "20-period SMA ± 2 standard deviations. Squeeze = low vol, expansion = move.", formula: "SMA ± 2σ" },
  { term: "VWAP", category: "Microstructure", definition: "Volume-Weighted Average Price. Institutional cost basis proxy.", formula: "Σ(price × volume) / Σ(volume)" },
  { term: "POC", category: "Volume Profile", definition: "Point of Control. Price with most volume in window. Acts as magnet/S-R." },
  { term: "Value Area", category: "Volume Profile", definition: "Price range containing 70% of session volume. Boundaries (VAH/VAL) act as S/R." },
  { term: "Hurst Exponent", category: "Regime", definition: "Persistence measure. <0.5 mean-reverting, ≈0.5 random, >0.5 trending." },
  { term: "Z-score", category: "Statistics", definition: "Standard deviations from mean. |z|≥2 = statistically stretched." },
  { term: "Correlation", category: "Statistics", definition: "Linear association between -1 and 1. 0=independent, ±1=perfect.", formula: "Cov(X,Y) / (σ_X · σ_Y)" },
  { term: "Donchian Channel", category: "Breakout", definition: "N-day high/low channel. Turtle Trading system base.", formula: "Upper = max(H, N), Lower = min(L, N)" },
  { term: "Ichimoku Cloud", category: "Trend", definition: "Multi-line system. Price above cloud + green cloud = bullish trend." },
  { term: "Heikin-Ashi", category: "Trend", definition: "Smoothed candle technique. Filters noise; consecutive same-colour = trend strength.", formula: "Close = (O+H+L+C)/4; Open = (prev HA O + prev HA C)/2" },
  { term: "ADX", category: "Trend", definition: "Average Directional Index. >25 trend, <20 chop. Strength only, not direction." },
  { term: "SuperTrend", category: "Trend", definition: "ATR-based trailing stop. Flips direction when price crosses." },
  { term: "TTM Squeeze", category: "Volatility", definition: "Bollinger Band inside Keltner Channel = compressed vol. Fires when bands expand." },
  { term: "Connors RSI", category: "Momentum", definition: "Composite of RSI(3), streak RSI(2), and 100-day ROC percent rank." },
  { term: "Money Flow Index", category: "Momentum", definition: "Volume-weighted RSI. Combines price + flow into one oscillator." },
  { term: "Wash Sale", category: "Tax", definition: "US: loss disallowed if you buy substantially identical security within ±30 days." },
  { term: "Tax-Loss Harvesting", category: "Tax", definition: "Sell losers to offset gains. Watch wash-sale rule." },
  { term: "Pattern Day Trader (PDT)", category: "Regulation", definition: "US: 4+ day trades in 5 days triggers PDT designation; min $25k equity required." },
  { term: "Slippage", category: "Execution", definition: "Difference between expected and executed price. Worse in low liquidity." },
  { term: "Spread", category: "Execution", definition: "Bid-ask gap. Narrow = liquid; wide = costly to enter/exit." },
  { term: "Drawdown Recovery", category: "Risk", definition: "Return required to break even from drawdown. 50% loss needs 100% gain." },
  { term: "Risk Parity", category: "Allocation", definition: "Equalise risk contribution per asset (not capital). Inverse-vol weighting." },
  { term: "Monte Carlo Simulation", category: "Risk", definition: "Random sampling of return distribution to estimate range of outcomes." },
  { term: "Efficient Frontier", category: "Allocation", definition: "Set of portfolios with best return per unit of risk (Markowitz)." },
  { term: "Pivot Point", category: "Levels", definition: "S/R levels derived from prior period H/L/C. Floor, Camarilla, Fibonacci variants." },
  { term: "Fibonacci Retracement", category: "Levels", definition: "S/R at 23.6%, 38.2%, 50%, 61.8%, 78.6% of prior swing." },
  { term: "Pair Trade", category: "Strategy", definition: "Long-short two correlated symbols. Profit from spread mean reversion." },
  { term: "Cointegration", category: "Statistics", definition: "Stronger than correlation — spread is stationary. Required for stat-arb pairs." },
  { term: "Halving", category: "Crypto", definition: "Bitcoin protocol event every ~4 years that cuts block reward in half." },
];

export default function GlossaryPage() {
  const cats = Array.from(new Set(TERMS.map((t) => t.category))).sort();

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">📖 Glossary</h1>
        <p className="text-[var(--muted)] text-sm">
          Plain-English definitions for every metric on this site.
        </p>
      </div>

      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4 flex flex-wrap gap-2 text-xs">
        {cats.map((c) => (
          <a key={c} href={`#${c.replace(/\s+/g, "-")}`}
            className="bg-[var(--background)] border border-[var(--card-border)] hover:border-indigo-600 px-3 py-1 rounded">
            {c}
          </a>
        ))}
      </div>

      {cats.map((cat) => (
        <div key={cat} id={cat.replace(/\s+/g, "-")} className="space-y-2">
          <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wide">{cat}</h2>
          <div className="grid gap-2">
            {TERMS.filter((t) => t.category === cat).map((t) => (
              <div key={t.term} className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4">
                <p className="font-semibold">{t.term}</p>
                <p className="text-sm text-[var(--muted)] mt-1">{t.definition}</p>
                {t.formula && (
                  <p className="text-xs font-mono mt-2 bg-[var(--background)] border border-[var(--card-border)] rounded px-2 py-1 inline-block">
                    {t.formula}
                  </p>
                )}
                {t.example && (
                  <p className="text-xs text-indigo-300 mt-2">Example: {t.example}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
