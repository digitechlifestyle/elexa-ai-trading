"use client";

import { useState } from "react";

interface Bin { price_low: number; price_high: number; price_mid: number; volume: number; }

export default function VolumeProfileClient() {
  const [symbol, setSymbol] = useState("AAPL");
  const [days, setDays] = useState(90);
  const [bins, setBins] = useState(30);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [profile, setProfile] = useState<Bin[]>([]);
  const [poc, setPoc] = useState<number | null>(null);
  const [vah, setVah] = useState<number | null>(null);
  const [val, setVal] = useState<number | null>(null);
  const [price, setPrice] = useState<number | null>(null);

  async function run() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/volume-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: symbol.toUpperCase(), days, bins }),
      });
      const j = await res.json();
      if (!res.ok) { setErr(j.error ?? "Failed"); setProfile([]); }
      else {
        setProfile(j.profile ?? []);
        setPoc(j.poc); setVah(j.value_area_high); setVal(j.value_area_low); setPrice(j.current_price);
      }
    } catch { setErr("Network error"); }
    finally { setLoading(false); }
  }

  const maxV = profile.length ? Math.max(...profile.map((p) => p.volume)) : 1;
  const reversed = [...profile].reverse(); // high price on top

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">📊 Volume Profile (VPVR)</h1>
        <p className="text-[var(--muted)] text-sm">
          Volume distribution by price. POC = price with most volume. Value area = 70% volume band. Institutional support/resistance map.
        </p>
      </div>

      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1">Symbol</label>
            <input value={symbol} onChange={(e) => setSymbol(e.target.value)}
              className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm font-mono" />
          </div>
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1">Days</label>
            <select value={days} onChange={(e) => setDays(Number(e.target.value))}
              className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm">
              <option value={30}>30</option><option value={90}>90</option>
              <option value={180}>180</option><option value={365}>365</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1">Bins</label>
            <select value={bins} onChange={(e) => setBins(Number(e.target.value))}
              className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm">
              <option value={20}>20</option><option value={30}>30</option>
              <option value={50}>50</option><option value={100}>100</option>
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={run} disabled={loading || !symbol}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold">
              {loading ? "Computing…" : "Compute"}
            </button>
          </div>
        </div>
        {err && <div className="mt-3 bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-3 py-2">{err}</div>}
      </div>

      {profile.length > 0 && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
            <Stat label="Price" value={price ? `$${price.toFixed(2)}` : "—"} />
            <Stat label="POC" value={poc ? `$${poc.toFixed(2)}` : "—"} color="text-amber-400" />
            <Stat label="VA High" value={vah ? `$${vah.toFixed(2)}` : "—"} color="text-green-400" />
            <Stat label="VA Low" value={val ? `$${val.toFixed(2)}` : "—"} color="text-red-400" />
          </div>

          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4">
            <div className="space-y-0.5 font-mono text-xs">
              {reversed.map((b, i) => {
                const pct = (b.volume / maxV) * 100;
                const isPoc = poc != null && b.price_low <= poc && poc <= b.price_high;
                const inVA = vah != null && val != null && b.price_mid >= val && b.price_mid <= vah;
                const atPrice = price != null && b.price_low <= price && price <= b.price_high;
                return (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-20 text-right text-[var(--muted)]">${b.price_mid.toFixed(2)}</span>
                    <div className="flex-1 h-4 bg-[var(--background)] rounded relative">
                      <div
                        className={`h-full rounded ${isPoc ? "bg-amber-500" : inVA ? "bg-indigo-500" : "bg-indigo-700/50"}`}
                        style={{ width: `${pct}%` }}
                      />
                      {atPrice && <div className="absolute inset-y-0 right-0 w-0.5 bg-white" />}
                    </div>
                    <span className="w-16 text-right text-[var(--muted)]">{(b.volume / 1e6).toFixed(1)}M</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex gap-4 text-xs text-[var(--muted)]">
              <span><span className="inline-block w-3 h-3 bg-amber-500 rounded mr-1 align-middle" />POC</span>
              <span><span className="inline-block w-3 h-3 bg-indigo-500 rounded mr-1 align-middle" />Value area (70%)</span>
              <span><span className="inline-block w-3 h-3 bg-indigo-700/50 rounded mr-1 align-middle" />Low-volume node</span>
            </div>
          </div>
        </>
      )}

      <div className="bg-indigo-950 border border-indigo-800 rounded-xl p-4 text-indigo-200 text-xs space-y-1">
        <p><strong>POC</strong> = fair value magnet. Price often returns to it.</p>
        <p><strong>Value Area</strong> = 70% of volume traded. Boundaries act as S/R.</p>
        <p><strong>Low-volume nodes</strong> = price typically moves through quickly.</p>
      </div>

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">⚠️ Research only — not financial advice.</div>
    </div>
  );
}

function Stat({ label, value, color = "" }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-3">
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className={`text-base font-bold font-mono ${color}`}>{value}</p>
    </div>
  );
}
