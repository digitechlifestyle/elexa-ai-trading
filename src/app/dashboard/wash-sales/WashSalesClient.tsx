"use client";

import { useEffect, useState } from "react";

interface Flag {
  symbol: string;
  loss_exit_time: string;
  loss_pnl: number;
  rebuy_time: string;
  rebuy_price: number;
  days_apart: number;
  rule: "30-day before" | "30-day after";
}

interface Data {
  losses_checked: number;
  flags_found: number;
  total_disallowed_loss: number;
  flags: Flag[];
}

export default function WashSalesClient() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/wash-sales");
        const j = await res.json();
        if (!res.ok) setErr(j.error ?? "Failed");
        else setData(j);
      } catch { setErr("Network error"); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div className="text-sm text-[var(--muted)]">Scanning…</div>;
  if (err || !data) return <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-3 py-2">{err}</div>;

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">🧾 Wash Sale Detector</h1>
        <p className="text-[var(--muted)] text-sm">
          US wash-sale rule: loss disallowed if you buy same security within ±30 days. Scans your trade history.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 text-sm">
        <Stat label="Losses checked" value={data.losses_checked.toString()} />
        <Stat label="Flags found" value={data.flags_found.toString()} color={data.flags_found > 0 ? "text-amber-400" : "text-green-400"} />
        <Stat label="Disallowed loss ($)" value={`$${data.total_disallowed_loss.toFixed(2)}`} color="text-red-400" />
      </div>

      {data.flags.length === 0 ? (
        <div className="bg-green-950 border border-green-700 text-green-300 text-sm rounded-xl p-4">
          ✅ No wash sales detected in your trade history.
        </div>
      ) : (
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-[var(--muted)]">
              <tr className="text-left border-b border-[var(--card-border)]">
                <th className="py-2 pr-3">Symbol</th>
                <th className="py-2 pr-3">Loss exited</th>
                <th className="py-2 pr-3 text-right">Loss</th>
                <th className="py-2 pr-3">Re-bought</th>
                <th className="py-2 pr-3 text-right">Rebuy $</th>
                <th className="py-2 pr-3 text-right">Days apart</th>
                <th className="py-2 pr-3">Rule</th>
              </tr>
            </thead>
            <tbody>
              {data.flags.map((f, i) => (
                <tr key={i} className="border-b border-[var(--card-border)] last:border-0">
                  <td className="py-2 pr-3 font-mono font-semibold">{f.symbol}</td>
                  <td className="py-2 pr-3 text-xs text-[var(--muted)] font-mono">{f.loss_exit_time.slice(0, 10)}</td>
                  <td className="py-2 pr-3 text-right font-mono text-red-400">${f.loss_pnl.toFixed(2)}</td>
                  <td className="py-2 pr-3 text-xs text-[var(--muted)] font-mono">{f.rebuy_time.slice(0, 10)}</td>
                  <td className="py-2 pr-3 text-right font-mono">${f.rebuy_price.toFixed(2)}</td>
                  <td className="py-2 pr-3 text-right font-mono">{f.days_apart > 0 ? `+${f.days_apart}` : f.days_apart}</td>
                  <td className="py-2 pr-3 text-xs">{f.rule}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="bg-indigo-950 border border-indigo-800 rounded-xl p-4 text-indigo-200 text-xs space-y-1">
        <p><strong>Wash sale</strong>: sell at loss, buy substantially identical security within 30 days before or after. Loss disallowed; basis adjusted on replacement shares.</p>
        <p><strong>To avoid</strong>: wait 31 days, or buy correlated-but-not-identical (different ETF, different sector).</p>
        <p><strong>Crypto note</strong>: as of 2026 wash-sale rule does not currently apply to crypto in US — but pending legislation may change this.</p>
      </div>

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">
        ⚠️ Paper trades don&apos;t produce real tax events. This tool is for habit-building. Consult a CPA for real tax situations. Not tax advice.
      </div>
    </div>
  );
}

function Stat({ label, value, color = "" }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-3">
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className={`text-lg font-bold font-mono ${color}`}>{value}</p>
    </div>
  );
}
