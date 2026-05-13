"use client";

import { useState } from "react";

interface Data {
  price: number; tenkan: number; kijun: number;
  senkou_a: number; senkou_b: number;
  cloud_top: number; cloud_bottom: number; cloud_green: boolean;
  signal: string; color: string;
}

export default function IchimokuClient() {
  const [symbol, setSymbol] = useState("AAPL");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<Data | null>(null);

  async function run() {
    setLoading(true); setErr(null);
    try {
      const res = await fetch("/api/ichimoku", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: symbol.toUpperCase() }),
      });
      const j = await res.json();
      if (!res.ok) { setErr(j.error ?? "Failed"); setData(null); }
      else setData(j);
    } catch { setErr("Network error"); }
    finally { setLoading(false); }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">☁️ Ichimoku Snapshot</h1>
        <p className="text-[var(--muted)] text-sm">
          Cloud (Kumo) analysis. Price above cloud + tenkan &gt; kijun + green cloud = strong trend.
        </p>
      </div>

      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
        <div className="flex gap-2">
          <input value={symbol} onChange={(e) => setSymbol(e.target.value)}
            className="flex-1 bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm font-mono" />
          <button onClick={run} disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-semibold">
            {loading ? "Computing…" : "Analyse"}
          </button>
        </div>
        {err && <div className="mt-3 bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-3 py-2">{err}</div>}
      </div>

      {data && (
        <>
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 text-center">
            <p className="text-xs text-[var(--muted)] mb-1">Ichimoku signal</p>
            <p className={`text-3xl font-bold ${data.color}`}>{data.signal}</p>
            <p className="text-sm text-[var(--muted)] mt-2">
              Cloud is <span className={data.cloud_green ? "text-green-400" : "text-red-400"}>{data.cloud_green ? "green ▲" : "red ▼"}</span>
            </p>
          </div>

          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 space-y-2">
            <Row label="Price" value={`$${data.price.toFixed(2)}`} bold />
            <Row label="Tenkan (Conversion, 9)" value={`$${data.tenkan.toFixed(2)}`} />
            <Row label="Kijun (Base, 26)" value={`$${data.kijun.toFixed(2)}`} />
            <Row label="Senkou A (Leading A)" value={`$${data.senkou_a.toFixed(2)}`} />
            <Row label="Senkou B (Leading B)" value={`$${data.senkou_b.toFixed(2)}`} />
            <Row label="Cloud top (resistance)" value={`$${data.cloud_top.toFixed(2)}`} color="text-red-400" />
            <Row label="Cloud bottom (support)" value={`$${data.cloud_bottom.toFixed(2)}`} color="text-green-400" />
            <Row label="Cloud thickness" value={`$${(data.cloud_top - data.cloud_bottom).toFixed(2)}`} />
          </div>
        </>
      )}

      <div className="bg-indigo-950 border border-indigo-800 rounded-xl p-4 text-indigo-200 text-xs space-y-1">
        <p><strong>Tenkan/Kijun cross</strong>: tenkan crosses above kijun = bullish; below = bearish.</p>
        <p><strong>Cloud</strong>: thick cloud = strong support/resistance. Thin = weak.</p>
        <p><strong>Color</strong>: green = bullish forward bias. Red = bearish.</p>
      </div>

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">⚠️ Ichimoku has lag. Inside-cloud conditions = avoid trend trades. Research only.</div>
    </div>
  );
}

function Row({ label, value, color = "", bold = false }: { label: string; value: string; color?: string; bold?: boolean }) {
  return (
    <div className="flex justify-between text-sm py-2 border-b border-[var(--card-border)] last:border-0">
      <span className="text-[var(--muted)]">{label}</span>
      <span className={`font-mono ${bold ? "font-bold" : ""} ${color}`}>{value}</span>
    </div>
  );
}
