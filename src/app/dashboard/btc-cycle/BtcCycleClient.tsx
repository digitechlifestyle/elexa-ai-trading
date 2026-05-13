"use client";

import { useEffect, useState } from "react";

interface Data {
  height: number | null;
  btc_price: number | null;
  last_halving: string;
  next_halving: string | null;
  days_since_halving: number;
  days_to_halving: number | null;
  est_days_to_halving_by_blocks: number | null;
  blocks_to_halving: number | null;
  block_reward_btc: number;
  next_block_reward_btc: number;
  cycle_progress_pct: number | null;
  phase: string;
  phase_color: string;
  last_halving_block: number;
  next_halving_block: number;
}

export default function BtcCycleClient() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/btc-cycle");
        const j = await res.json();
        if (!res.ok) setErr(j.error ?? "Failed");
        else setData(j);
      } catch { setErr("Network error"); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div className="text-sm text-[var(--muted)]">Loading BTC cycle…</div>;
  if (err || !data) return <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-3 py-2">{err}</div>;

  const progress = data.cycle_progress_pct ?? 0;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">₿ Bitcoin Cycle Tracker</h1>
        <p className="text-[var(--muted)] text-sm">
          Halving countdown, current cycle position, supply schedule. Live block height from blockchain.info, price from CoinGecko.
        </p>
      </div>

      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 text-center">
        <p className="text-xs text-[var(--muted)] mb-1">Current cycle phase</p>
        <p className={`text-3xl font-bold ${data.phase_color}`}>{data.phase}</p>
        <p className="text-sm text-[var(--muted)] mt-2">
          Day {data.days_since_halving} after last halving · {data.cycle_progress_pct?.toFixed(1)}% through cycle
        </p>
        <div className="mt-4 h-3 bg-[var(--background)] rounded overflow-hidden">
          <div className="h-full bg-orange-500" style={{ width: `${Math.min(100, progress)}%` }} />
        </div>
        <div className="flex justify-between text-xs text-[var(--muted)] mt-1">
          <span>{data.last_halving}</span>
          <span>{data.next_halving ?? "—"}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
        <Stat label="BTC price" value={data.btc_price ? `$${data.btc_price.toLocaleString()}` : "—"} bold />
        <Stat label="Block height" value={data.height ? data.height.toLocaleString() : "—"} />
        <Stat label="Block reward" value={`${data.block_reward_btc} BTC`} />
        <Stat label="Next reward" value={`${data.next_block_reward_btc} BTC`} color="text-amber-400" />
      </div>

      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 space-y-2">
        <Row label="Last halving" value={data.last_halving} />
        <Row label="Next halving (estimated)" value={data.next_halving ?? "—"} />
        <Row label="Days since halving" value={`${data.days_since_halving} days`} />
        <Row label="Days to next halving (calendar)" value={data.days_to_halving != null ? `${data.days_to_halving} days` : "—"} />
        <Row label="Days to next halving (block estimate)"
          value={data.est_days_to_halving_by_blocks != null ? `${data.est_days_to_halving_by_blocks} days` : "—"} />
        <Row label="Blocks to next halving" value={data.blocks_to_halving != null ? data.blocks_to_halving.toLocaleString() : "—"} />
        <Row label="Next halving block height" value={data.next_halving_block.toLocaleString()} />
      </div>

      <div className="bg-indigo-950 border border-indigo-800 rounded-xl p-4 text-indigo-200 text-xs space-y-1">
        <p><strong>Historical pattern:</strong> bull peaks typically 12-18 months after halving. Bear bottoms 12-18 months before next halving.</p>
        <p><strong>Halving</strong>: block reward cuts in half, halving new supply issuance — supply shock thesis.</p>
        <p><strong>Caveat</strong>: 3 cycle samples is small. Pattern may break or fade with ETF era.</p>
      </div>

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">⚠️ Halving narrative is a heuristic, not a guarantee. Research only.</div>
    </div>
  );
}

function Stat({ label, value, color = "", bold = false }: { label: string; value: string; color?: string; bold?: boolean }) {
  return (
    <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-3">
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className={`${bold ? "text-xl" : "text-lg"} font-bold font-mono ${color}`}>{value}</p>
    </div>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm py-2 border-b border-[var(--card-border)] last:border-0">
      <span className="text-[var(--muted)]">{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}
