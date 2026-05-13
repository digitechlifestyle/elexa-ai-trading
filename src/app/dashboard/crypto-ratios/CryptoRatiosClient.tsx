"use client";

import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

interface Pair {
  name: string;
  current: number | null;
  change_pct: number | null;
  series: { date: string; ratio: number }[];
  hint: string;
}

export default function CryptoRatiosClient() {
  const [days, setDays] = useState(180);
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true); setErr(null);
    try {
      const res = await fetch(`/api/crypto-ratios?days=${days}`);
      const j = await res.json();
      if (!res.ok) setErr(j.error ?? "Failed");
      else setPairs(j.pairs);
    } catch { setErr("Network error"); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [days]);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex justify-between items-start gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold mb-1">🪙 Crypto Ratios</h1>
          <p className="text-[var(--muted)] text-sm">
            Relative strength between major crypto. Rising ETH/BTC = alt season.
          </p>
        </div>
        <select value={days} onChange={(e) => setDays(Number(e.target.value))}
          className="bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm">
          <option value={90}>90d</option><option value={180}>180d</option>
          <option value={365}>365d</option><option value={730}>730d</option>
        </select>
      </div>

      {loading && <div className="text-sm text-[var(--muted)]">Loading…</div>}
      {err && <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-3 py-2">{err}</div>}

      {pairs.map((p) => (
        <div key={p.name} className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4">
          <div className="flex justify-between items-start mb-3 flex-wrap gap-2">
            <div>
              <h2 className="font-semibold font-mono text-lg">{p.name}</h2>
              <p className="text-xs text-[var(--muted)]">{p.hint}</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold font-mono">{p.current != null ? p.current.toFixed(5) : "—"}</p>
              <p className={`text-sm font-mono ${(p.change_pct ?? 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
                {p.change_pct != null ? `${p.change_pct >= 0 ? "+" : ""}${p.change_pct.toFixed(2)}%` : "—"}
              </p>
            </div>
          </div>
          <div style={{ width: "100%", height: 200 }}>
            <ResponsiveContainer>
              <LineChart data={p.series}>
                <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} minTickGap={40} />
                <YAxis tick={{ fontSize: 10 }} domain={["auto", "auto"]} />
                <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #374151" }}
                  formatter={(v) => [`${Number(v).toFixed(5)}`, p.name]} />
                <Line type="monotone" dataKey="ratio" stroke="#fb923c" dot={false} strokeWidth={1.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ))}

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">
        ⚠️ Ratios reveal relative momentum, not absolute direction. All three pairs can fall in absolute terms while ratios rise. Research only.
      </div>
    </div>
  );
}
