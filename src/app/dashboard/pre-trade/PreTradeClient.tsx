"use client";

import { useState } from "react";

interface Result {
  symbol: string;
  side: "buy" | "sell";
  qty: number;
  entry: number;
  stop: number | null;
  target: number | null;
  checklist: string;
}

export default function PreTradeClient() {
  const [symbol, setSymbol] = useState("AAPL");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [qty, setQty] = useState("10");
  const [entry, setEntry] = useState("185");
  const [stop, setStop] = useState("180");
  const [target, setTarget] = useState("200");
  const [thesis, setThesis] = useState("");
  const [data, setData] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/pre-trade-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol,
          side,
          qty: Number(qty),
          entry: Number(entry),
          stop: Number(stop),
          target: Number(target),
          thesis,
        }),
      });
      const j = await res.json();
      if (!res.ok) setErr(j.error ?? "Failed");
      else setData(j);
    } catch {
      setErr("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">✅ AI Pre-Trade Checklist</h1>
        <p className="text-[var(--muted)] text-sm">
          10-point structured review before you place an order. Quant Agent
          PASS/WARN/FAIL on each criterion, then verdict.
        </p>
      </div>

      <form
        onSubmit={run}
        className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Symbol" value={symbol} onChange={setSymbol} />
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1">Side</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSide("buy")}
                className={`flex-1 py-2 rounded text-sm font-semibold ${
                  side === "buy" ? "bg-green-700 text-white" : "bg-[var(--background)] border border-[var(--card-border)] text-[var(--muted)]"
                }`}
              >
                BUY
              </button>
              <button
                type="button"
                onClick={() => setSide("sell")}
                className={`flex-1 py-2 rounded text-sm font-semibold ${
                  side === "sell" ? "bg-red-800 text-white" : "bg-[var(--background)] border border-[var(--card-border)] text-[var(--muted)]"
                }`}
              >
                SELL
              </button>
            </div>
          </div>
          <Field label="Quantity" value={qty} onChange={setQty} type="number" />
          <Field label="Entry $" value={entry} onChange={setEntry} type="number" />
          <Field label="Stop $" value={stop} onChange={setStop} type="number" />
          <Field label="Target $" value={target} onChange={setTarget} type="number" />
        </div>
        <div>
          <label className="block text-xs text-[var(--muted)] mb-1">
            Thesis (optional but recommended)
          </label>
          <textarea
            value={thesis}
            onChange={(e) => setThesis(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="Why are you taking this trade? What catalyst, setup, or signal?"
            className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-600 resize-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-3 rounded-lg font-semibold"
        >
          {loading ? "Reviewing…" : "Run Pre-Trade Check"}
        </button>
      </form>

      {err && (
        <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-3 py-2">
          {err}
        </div>
      )}

      {data && (
        <div className="bg-indigo-950 border border-indigo-700 rounded-xl p-6">
          <h2 className="font-semibold mb-3">
            Review: {data.side.toUpperCase()} {data.qty} {data.symbol} @ ${data.entry}
          </h2>
          <pre className="text-sm whitespace-pre-wrap leading-relaxed text-indigo-100 font-sans">
            {data.checklist}
          </pre>
        </div>
      )}

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">
        ⚠️ Checklist is research. Your call. Risk Agent still validates server-side
        on actual order submission.
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-[var(--muted)] mb-1">{label}</label>
      <input
        type={type}
        step={type === "number" ? "any" : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-600"
      />
    </div>
  );
}
