"use client";

import { useMemo, useState } from "react";

export default function AtrSizerClient() {
  const [symbol, setSymbol] = useState("AAPL");
  const [equity, setEquity] = useState(10000);
  const [riskPct, setRiskPct] = useState(1);
  const [atrMult, setAtrMult] = useState(2);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [atr, setAtr] = useState<number | null>(null);
  const [price, setPrice] = useState<number | null>(null);
  const [atrPct, setAtrPct] = useState<number | null>(null);

  async function fetchAtr() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/atr-sizer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: symbol.toUpperCase() }),
      });
      const j = await res.json();
      if (!res.ok) setErr(j.error ?? "Failed");
      else { setAtr(j.atr); setPrice(j.price); setAtrPct(j.atr_pct); }
    } catch { setErr("Network error"); }
    finally { setLoading(false); }
  }

  const calc = useMemo(() => {
    if (atr == null || price == null) return null;
    const stopDistance = atr * atrMult;
    const stopLong = price - stopDistance;
    const stopShort = price + stopDistance;
    const riskDollar = equity * (riskPct / 100);
    const shares = stopDistance > 0 ? Math.floor(riskDollar / stopDistance) : 0;
    const positionValue = shares * price;
    return { stopDistance, stopLong, stopShort, riskDollar, shares, positionValue };
  }, [atr, price, atrMult, equity, riskPct]);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">📏 ATR Position Sizer</h1>
        <p className="text-[var(--muted)] text-sm">
          Volatility-adjusted position sizing. Stop placed N × ATR from entry, size set so loss = fixed % of equity.
        </p>
      </div>

      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1">Symbol</label>
            <div className="flex gap-2">
              <input value={symbol} onChange={(e) => setSymbol(e.target.value)}
                className="flex-1 bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm font-mono" />
              <button onClick={fetchAtr} disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold">
                {loading ? "…" : "Fetch ATR"}
              </button>
            </div>
          </div>
          <Field label="Account equity ($)" value={equity} setValue={setEquity} step={100} />
          <Field label="Risk per trade (%)" value={riskPct} setValue={setRiskPct} step={0.1} />
          <Field label="ATR multiplier" value={atrMult} setValue={setAtrMult} step={0.5} />
        </div>
        {err && <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-3 py-2">{err}</div>}
      </div>

      {calc && atr != null && price != null && (
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 space-y-2">
          <Row label="Price" value={`$${price.toFixed(2)}`} />
          <Row label="ATR(14)" value={`$${atr.toFixed(2)} (${atrPct?.toFixed(2)}% of price)`} />
          <Row label="Stop distance" value={`$${calc.stopDistance.toFixed(2)}`} color="text-amber-400" />
          <Row label="Long stop" value={`$${calc.stopLong.toFixed(2)}`} color="text-red-400" />
          <Row label="Short stop" value={`$${calc.stopShort.toFixed(2)}`} color="text-red-400" />
          <Row label="Risk ($)" value={`$${calc.riskDollar.toFixed(2)}`} />
          <Row label="Shares to buy" value={calc.shares.toString()} color="text-indigo-400" />
          <Row label="Position value" value={`$${calc.positionValue.toFixed(2)}`} color="text-indigo-400" />
        </div>
      )}

      <div className="bg-indigo-950 border border-indigo-800 rounded-xl p-4 text-indigo-200 text-xs space-y-1">
        <p><strong>ATR multiplier</strong>: 1.5-2x = tight, 2.5-3x = swing, 4x+ = position trade.</p>
        <p><strong>Risk %</strong>: pros use 0.5-2%. 2% × 50% win rate × bad R:R = blown account fast.</p>
        <p>Sizing keeps loss constant in dollars regardless of volatility.</p>
      </div>

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">⚠️ Slippage and gaps can exceed stop. Research only.</div>
    </div>
  );
}

function Field({ label, value, setValue, step }: { label: string; value: number; setValue: (n: number) => void; step: number }) {
  return (
    <div>
      <label className="block text-xs text-[var(--muted)] mb-1">{label}</label>
      <input type="number" value={value} step={step}
        onChange={(e) => setValue(Number(e.target.value))}
        className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm font-mono" />
    </div>
  );
}
function Row({ label, value, color = "" }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex justify-between text-sm py-2 border-b border-[var(--card-border)] last:border-0">
      <span className="text-[var(--muted)]">{label}</span>
      <span className={`font-mono font-semibold ${color}`}>{value}</span>
    </div>
  );
}
