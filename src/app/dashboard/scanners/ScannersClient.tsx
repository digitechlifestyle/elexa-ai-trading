"use client";

import { useState } from "react";

type ScannerType = "squeeze" | "rsi" | "volume" | "zscore" | "supertrend" | "ttm" | "connors" | "mfi";

interface Result {
  symbol: string;
  price?: number;
  error?: boolean;
  bandwidth?: number | null;
  squeeze_rank?: number | null;
  rsi?: number | null;
  volume_ratio?: number | null;
  z?: number | null;
  supertrend?: { direction: number; level: number | null; flipped_recent: boolean };
  ttm?: { squeeze_on: boolean; momentum: number; firing: "up" | "down" | null };
  connors?: number | null;
  mfi?: number | null;
}

const PRESETS: Record<string, string> = {
  "Mega tech": "AAPL,MSFT,NVDA,GOOGL,META,AMZN,TSLA",
  "Top crypto": "BTC,ETH,SOL,XRP,DOGE,ADA,AVAX,LINK,LTC",
  "Sector ETFs": "XLK,XLF,XLE,XLV,XLY,XLI,XLP,XLU,XLB,XLRE,XLC",
  "Index ETFs": "SPY,QQQ,IWM,DIA,VTI,VEA,VWO,EFA",
};

const TABS: { id: ScannerType; label: string; icon: string }[] = [
  { id: "squeeze", label: "BB Squeeze", icon: "🤏" },
  { id: "rsi", label: "RSI", icon: "📈" },
  { id: "volume", label: "Volume Spike", icon: "📊" },
  { id: "zscore", label: "Z-Score", icon: "📐" },
  { id: "supertrend", label: "SuperTrend", icon: "🟢" },
  { id: "ttm", label: "TTM Squeeze", icon: "💥" },
  { id: "connors", label: "Connors RSI", icon: "🎢" },
  { id: "mfi", label: "Money Flow", icon: "💧" },
];

export default function ScannersClient() {
  const [tab, setTab] = useState<ScannerType>("squeeze");
  const [input, setInput] = useState("AAPL,MSFT,NVDA,GOOGL,META,AMZN,TSLA,SPY,QQQ,XLK,XLF,XLE");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [results, setResults] = useState<Result[]>([]);

  async function run() {
    setLoading(true); setErr(null);
    const symbols = input.split(/[,\s]+/).map((s) => s.trim()).filter(Boolean);
    try {
      const res = await fetch("/api/scanners", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbols, scanner: tab }),
      });
      const j = await res.json();
      if (!res.ok) { setErr(j.error ?? "Failed"); setResults([]); }
      else setResults(j.results);
    } catch { setErr("Network error"); }
    finally { setLoading(false); }
  }

  const sorted = sortFor(tab, results);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">🔭 Market Scanners</h1>
        <p className="text-[var(--muted)] text-sm">
          Find setups across symbol lists. Bollinger squeeze, RSI extremes, volume spikes, statistical z-score.
        </p>
      </div>

      <div className="flex gap-1 border-b border-[var(--card-border)]">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-semibold transition-colors ${
              tab === t.id ? "border-b-2 border-indigo-500 text-white" : "text-[var(--muted)] hover:text-white"
            }`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 space-y-3">
        <label className="block text-xs text-[var(--muted)]">Symbols (max 50)</label>
        <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={2}
          className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm font-mono" />
        <div className="flex flex-wrap gap-2">
          {Object.entries(PRESETS).map(([name, syms]) => (
            <button key={name} onClick={() => setInput(syms)}
              className="text-xs bg-[var(--background)] border border-[var(--card-border)] hover:border-indigo-600 px-3 py-1.5 rounded">
              {name}
            </button>
          ))}
        </div>
        <button onClick={run} disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-semibold">
          {loading ? "Scanning…" : "Scan"}
        </button>
        {err && <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-3 py-2">{err}</div>}
      </div>

      {sorted.length > 0 && (
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4 overflow-x-auto">
          {renderTable(tab, sorted)}
        </div>
      )}

      <div className="bg-indigo-950 border border-indigo-800 rounded-xl p-4 text-indigo-200 text-xs">
        {hints(tab)}
      </div>

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">
        ⚠️ Scanners surface candidates, not signals. Confirm with structure + volume. Research only.
      </div>
    </div>
  );
}

function sortFor(tab: ScannerType, rows: Result[]): Result[] {
  const valid = rows.filter((r) => !r.error);
  if (tab === "squeeze") return [...valid].sort((a, b) => (a.squeeze_rank ?? 999) - (b.squeeze_rank ?? 999));
  if (tab === "rsi") return [...valid].sort((a, b) => (a.rsi ?? 50) - (b.rsi ?? 50));
  if (tab === "volume") return [...valid].sort((a, b) => (b.volume_ratio ?? 0) - (a.volume_ratio ?? 0));
  if (tab === "zscore") return [...valid].sort((a, b) => Math.abs(b.z ?? 0) - Math.abs(a.z ?? 0));
  if (tab === "supertrend") return [...valid].sort((a, b) => {
    const flipA = a.supertrend?.flipped_recent ? 1 : 0;
    const flipB = b.supertrend?.flipped_recent ? 1 : 0;
    if (flipA !== flipB) return flipB - flipA;
    return (b.supertrend?.direction ?? 0) - (a.supertrend?.direction ?? 0);
  });
  if (tab === "ttm") return [...valid].sort((a, b) => {
    const fA = a.ttm?.firing ? 1 : 0;
    const fB = b.ttm?.firing ? 1 : 0;
    if (fA !== fB) return fB - fA;
    return Math.abs(b.ttm?.momentum ?? 0) - Math.abs(a.ttm?.momentum ?? 0);
  });
  if (tab === "connors") return [...valid].sort((a, b) => (a.connors ?? 50) - (b.connors ?? 50));
  if (tab === "mfi") return [...valid].sort((a, b) => (a.mfi ?? 50) - (b.mfi ?? 50));
  return valid;
}

function renderTable(tab: ScannerType, rows: Result[]) {
  if (tab === "squeeze") {
    return (
      <table className="w-full text-sm">
        <thead className="text-xs text-[var(--muted)]">
          <tr className="text-left border-b border-[var(--card-border)]">
            <th className="py-2 pr-3">Symbol</th>
            <th className="py-2 pr-3 text-right">Price</th>
            <th className="py-2 pr-3 text-right">Bandwidth %</th>
            <th className="py-2 pr-3 text-right">Squeeze percentile</th>
            <th className="py-2 pr-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const rank = r.squeeze_rank ?? 50;
            const status = rank < 10 ? { text: "Extreme squeeze", color: "text-red-400" } :
                          rank < 25 ? { text: "Tight", color: "text-amber-400" } :
                          rank > 90 ? { text: "Expanded", color: "text-green-400" } :
                          { text: "Normal", color: "text-[var(--muted)]" };
            return (
              <tr key={r.symbol} className="border-b border-[var(--card-border)] last:border-0">
                <td className="py-2 pr-3 font-mono font-semibold">{r.symbol}</td>
                <td className="py-2 pr-3 text-right font-mono">${(r.price ?? 0).toFixed(2)}</td>
                <td className="py-2 pr-3 text-right font-mono">{r.bandwidth?.toFixed(2)}%</td>
                <td className="py-2 pr-3 text-right font-mono">{rank.toFixed(0)}</td>
                <td className={`py-2 pr-3 ${status.color}`}>{status.text}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }
  if (tab === "rsi") {
    return (
      <table className="w-full text-sm">
        <thead className="text-xs text-[var(--muted)]">
          <tr className="text-left border-b border-[var(--card-border)]">
            <th className="py-2 pr-3">Symbol</th>
            <th className="py-2 pr-3 text-right">Price</th>
            <th className="py-2 pr-3 text-right">RSI(14)</th>
            <th className="py-2 pr-3">Zone</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const rsi = r.rsi ?? 50;
            const zone = rsi >= 70 ? { text: "Overbought", color: "text-red-400" } :
                        rsi <= 30 ? { text: "Oversold", color: "text-green-400" } :
                        { text: "Neutral", color: "text-[var(--muted)]" };
            return (
              <tr key={r.symbol} className="border-b border-[var(--card-border)] last:border-0">
                <td className="py-2 pr-3 font-mono font-semibold">{r.symbol}</td>
                <td className="py-2 pr-3 text-right font-mono">${(r.price ?? 0).toFixed(2)}</td>
                <td className="py-2 pr-3 text-right font-mono">{rsi.toFixed(1)}</td>
                <td className={`py-2 pr-3 ${zone.color}`}>{zone.text}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }
  if (tab === "volume") {
    return (
      <table className="w-full text-sm">
        <thead className="text-xs text-[var(--muted)]">
          <tr className="text-left border-b border-[var(--card-border)]">
            <th className="py-2 pr-3">Symbol</th>
            <th className="py-2 pr-3 text-right">Price</th>
            <th className="py-2 pr-3 text-right">Vol vs 20-day avg</th>
            <th className="py-2 pr-3">Spike level</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const ratio = r.volume_ratio ?? 1;
            const level = ratio >= 3 ? { text: "Extreme", color: "text-red-400" } :
                         ratio >= 2 ? { text: "High", color: "text-amber-400" } :
                         ratio >= 1.5 ? { text: "Elevated", color: "text-yellow-400" } :
                         { text: "Normal", color: "text-[var(--muted)]" };
            return (
              <tr key={r.symbol} className="border-b border-[var(--card-border)] last:border-0">
                <td className="py-2 pr-3 font-mono font-semibold">{r.symbol}</td>
                <td className="py-2 pr-3 text-right font-mono">${(r.price ?? 0).toFixed(2)}</td>
                <td className="py-2 pr-3 text-right font-mono">{ratio.toFixed(2)}×</td>
                <td className={`py-2 pr-3 ${level.color}`}>{level.text}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }
  if (tab === "supertrend") {
    return (
      <table className="w-full text-sm">
        <thead className="text-xs text-[var(--muted)]">
          <tr className="text-left border-b border-[var(--card-border)]">
            <th className="py-2 pr-3">Symbol</th>
            <th className="py-2 pr-3 text-right">Price</th>
            <th className="py-2 pr-3 text-right">Trail level</th>
            <th className="py-2 pr-3">Direction</th>
            <th className="py-2 pr-3">Flipped</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const dir = r.supertrend?.direction ?? 0;
            const dirLabel = dir === 1 ? { text: "↑ Long", color: "text-green-400" } :
                            dir === -1 ? { text: "↓ Short", color: "text-red-400" } :
                            { text: "—", color: "text-[var(--muted)]" };
            return (
              <tr key={r.symbol} className="border-b border-[var(--card-border)] last:border-0">
                <td className="py-2 pr-3 font-mono font-semibold">{r.symbol}</td>
                <td className="py-2 pr-3 text-right font-mono">${(r.price ?? 0).toFixed(2)}</td>
                <td className="py-2 pr-3 text-right font-mono">{r.supertrend?.level != null ? `$${r.supertrend.level.toFixed(2)}` : "—"}</td>
                <td className={`py-2 pr-3 font-bold ${dirLabel.color}`}>{dirLabel.text}</td>
                <td className="py-2 pr-3">{r.supertrend?.flipped_recent ? <span className="text-amber-400 font-bold">⚡ TODAY</span> : "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }
  if (tab === "ttm") {
    return (
      <table className="w-full text-sm">
        <thead className="text-xs text-[var(--muted)]">
          <tr className="text-left border-b border-[var(--card-border)]">
            <th className="py-2 pr-3">Symbol</th>
            <th className="py-2 pr-3 text-right">Price</th>
            <th className="py-2 pr-3 text-right">Momentum</th>
            <th className="py-2 pr-3">Squeeze</th>
            <th className="py-2 pr-3">Firing</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.symbol} className="border-b border-[var(--card-border)] last:border-0">
              <td className="py-2 pr-3 font-mono font-semibold">{r.symbol}</td>
              <td className="py-2 pr-3 text-right font-mono">${(r.price ?? 0).toFixed(2)}</td>
              <td className={`py-2 pr-3 text-right font-mono ${(r.ttm?.momentum ?? 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
                {r.ttm?.momentum != null ? r.ttm.momentum.toFixed(2) : "—"}
              </td>
              <td className="py-2 pr-3">{r.ttm?.squeeze_on ? <span className="text-red-400 font-bold">ON 🔒</span> : <span className="text-[var(--muted)]">off</span>}</td>
              <td className="py-2 pr-3">
                {r.ttm?.firing === "up" && <span className="text-green-400 font-bold">↑ FIRING UP</span>}
                {r.ttm?.firing === "down" && <span className="text-red-400 font-bold">↓ FIRING DOWN</span>}
                {!r.ttm?.firing && <span className="text-[var(--muted)]">—</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
  if (tab === "connors") {
    return (
      <table className="w-full text-sm">
        <thead className="text-xs text-[var(--muted)]">
          <tr className="text-left border-b border-[var(--card-border)]">
            <th className="py-2 pr-3">Symbol</th>
            <th className="py-2 pr-3 text-right">Price</th>
            <th className="py-2 pr-3 text-right">Connors RSI</th>
            <th className="py-2 pr-3">Zone</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const c = r.connors ?? 50;
            const zone = c < 5 ? { text: "Deep oversold ✨", color: "text-green-400" } :
                        c < 15 ? { text: "Oversold", color: "text-green-300" } :
                        c > 95 ? { text: "Extreme overbought ⚠️", color: "text-red-400" } :
                        c > 85 ? { text: "Overbought", color: "text-red-300" } :
                        { text: "Neutral", color: "text-[var(--muted)]" };
            return (
              <tr key={r.symbol} className="border-b border-[var(--card-border)] last:border-0">
                <td className="py-2 pr-3 font-mono font-semibold">{r.symbol}</td>
                <td className="py-2 pr-3 text-right font-mono">${(r.price ?? 0).toFixed(2)}</td>
                <td className="py-2 pr-3 text-right font-mono">{r.connors != null ? r.connors.toFixed(1) : "—"}</td>
                <td className={`py-2 pr-3 ${zone.color}`}>{zone.text}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }
  if (tab === "mfi") {
    return (
      <table className="w-full text-sm">
        <thead className="text-xs text-[var(--muted)]">
          <tr className="text-left border-b border-[var(--card-border)]">
            <th className="py-2 pr-3">Symbol</th>
            <th className="py-2 pr-3 text-right">Price</th>
            <th className="py-2 pr-3 text-right">MFI(14)</th>
            <th className="py-2 pr-3">Flow</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const m = r.mfi ?? 50;
            const flow = m < 20 ? { text: "Money flowing OUT (oversold)", color: "text-green-400" } :
                        m > 80 ? { text: "Money flowing IN (overbought)", color: "text-red-400" } :
                        { text: "Neutral", color: "text-[var(--muted)]" };
            return (
              <tr key={r.symbol} className="border-b border-[var(--card-border)] last:border-0">
                <td className="py-2 pr-3 font-mono font-semibold">{r.symbol}</td>
                <td className="py-2 pr-3 text-right font-mono">${(r.price ?? 0).toFixed(2)}</td>
                <td className="py-2 pr-3 text-right font-mono">{r.mfi != null ? r.mfi.toFixed(1) : "—"}</td>
                <td className={`py-2 pr-3 ${flow.color}`}>{flow.text}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }
  // zscore
  return (
    <table className="w-full text-sm">
      <thead className="text-xs text-[var(--muted)]">
        <tr className="text-left border-b border-[var(--card-border)]">
          <th className="py-2 pr-3">Symbol</th>
          <th className="py-2 pr-3 text-right">Price</th>
          <th className="py-2 pr-3 text-right">Z (vs 20-day mean)</th>
          <th className="py-2 pr-3">Position</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const z = r.z ?? 0;
          const pos = z >= 2 ? { text: "Stretched up", color: "text-red-400" } :
                     z <= -2 ? { text: "Stretched down", color: "text-green-400" } :
                     Math.abs(z) >= 1 ? { text: "Trending", color: "text-amber-400" } :
                     { text: "Neutral", color: "text-[var(--muted)]" };
          return (
            <tr key={r.symbol} className="border-b border-[var(--card-border)] last:border-0">
              <td className="py-2 pr-3 font-mono font-semibold">{r.symbol}</td>
              <td className="py-2 pr-3 text-right font-mono">${(r.price ?? 0).toFixed(2)}</td>
              <td className={`py-2 pr-3 text-right font-mono ${z >= 0 ? "text-green-400" : "text-red-400"}`}>{z.toFixed(2)}σ</td>
              <td className={`py-2 pr-3 ${pos.color}`}>{pos.text}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function hints(tab: ScannerType) {
  if (tab === "squeeze") return (
    <div className="space-y-1">
      <p><strong>Bollinger Squeeze:</strong> low percentile = tight bands = imminent volatility expansion.</p>
      <p>Pair with breakout direction (close above/below band).</p>
    </div>
  );
  if (tab === "rsi") return (
    <div className="space-y-1">
      <p><strong>RSI &gt; 70:</strong> overbought — fade in range markets, hold in trends.</p>
      <p><strong>RSI &lt; 30:</strong> oversold — bounce candidates.</p>
    </div>
  );
  if (tab === "volume") return (
    <div className="space-y-1">
      <p><strong>Volume &gt; 2× avg:</strong> something happened. News, breakout, capitulation.</p>
      <p>Volume confirms price moves. Big move on thin volume = suspect.</p>
    </div>
  );
  if (tab === "supertrend") return (
    <div className="space-y-1">
      <p><strong>SuperTrend:</strong> ATR-based trailing stop. Above price = short, below = long.</p>
      <p><strong>Flipped today:</strong> regime change candidate — directional bet with stop at the trail level.</p>
    </div>
  );
  if (tab === "ttm") return (
    <div className="space-y-1">
      <p><strong>TTM Squeeze (John Carter):</strong> Bollinger inside Keltner = volatility compression.</p>
      <p><strong>Firing</strong>: squeeze just released; momentum sign points entry direction.</p>
    </div>
  );
  if (tab === "connors") return (
    <div className="space-y-1">
      <p><strong>Connors RSI</strong>: composite of fast RSI, streak RSI, and 100-day ROC rank.</p>
      <p><strong>&lt; 5</strong>: deep oversold — Connors mean-reversion entry signal. <strong>&gt; 95</strong>: extreme overbought.</p>
    </div>
  );
  if (tab === "mfi") return (
    <div className="space-y-1">
      <p><strong>Money Flow Index</strong>: volume-weighted RSI. Combines price + volume into single oscillator.</p>
      <p><strong>&lt; 20</strong>: capitulation, potential reversal. <strong>&gt; 80</strong>: distribution, potential top.</p>
    </div>
  );
  return (
    <div className="space-y-1">
      <p><strong>|z| ≥ 2:</strong> price 2+ standard deviations from 20-day mean. Statistically stretched.</p>
      <p>Mean-reversion candidates if Hurst &lt; 0.5; trend-continuation otherwise.</p>
    </div>
  );
}
