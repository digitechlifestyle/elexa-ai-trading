"use client";

import { useEffect, useState } from "react";
import {
  Treemap, ResponsiveContainer, Tooltip,
} from "recharts";

interface Position {
  symbol: string; side: string; qty: number;
  avg_entry: number; current_price: number;
  market_value: number; unrealised_pl: number; unrealised_pl_pct: number;
}

interface TreemapNode { name: string; size: number; pnl: number; pl_pct: number; [key: string]: string | number; }

interface TooltipPayload { payload?: TreemapNode; }

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  if (!d) return null;
  return (
    <div className="bg-black/90 border border-[var(--card-border)] rounded p-2 text-xs space-y-0.5">
      <p className="font-mono font-bold">{d.name}</p>
      <p>Market value: <span className="font-mono">${d.size.toFixed(2)}</span></p>
      <p className={d.pnl >= 0 ? "text-green-400" : "text-red-400"}>
        P&L: {d.pnl >= 0 ? "+" : ""}${d.pnl.toFixed(2)} ({d.pl_pct >= 0 ? "+" : ""}{d.pl_pct.toFixed(2)}%)
      </p>
    </div>
  );
}

interface CellProps {
  x?: number; y?: number; width?: number; height?: number;
  name?: string; pl_pct?: number;
}

function CustomCell(props: CellProps) {
  const { x = 0, y = 0, width = 0, height = 0, name, pl_pct = 0 } = props;
  if (width < 1 || height < 1) return null;
  const intensity = Math.min(1, Math.abs(pl_pct) / 10);
  const fill = pl_pct >= 0
    ? `rgba(16, 185, 129, ${0.3 + intensity * 0.6})`
    : `rgba(239, 68, 68, ${0.3 + intensity * 0.6})`;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={fill} stroke="#0a0a0a" />
      {width > 50 && height > 30 && (
        <text x={x + width / 2} y={y + height / 2} textAnchor="middle" fill="#fff" fontSize={12} fontWeight="bold">
          {name}
        </text>
      )}
      {width > 50 && height > 50 && (
        <text x={x + width / 2} y={y + height / 2 + 14} textAnchor="middle" fill="#fff" fontSize={10} opacity={0.8}>
          {pl_pct >= 0 ? "+" : ""}{pl_pct.toFixed(1)}%
        </text>
      )}
    </g>
  );
}

export default function PositionTreemapClient() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/alpaca-account");
        const j = await res.json();
        if (!res.ok) setErr(j.error ?? "Failed");
        else setPositions(j.positions ?? []);
      } catch { setErr("Network error"); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div className="text-sm text-[var(--muted)]">Loading positions…</div>;
  if (err) return <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-3 py-2">{err}</div>;

  if (positions.length === 0) {
    return (
      <div className="space-y-4 max-w-3xl">
        <h1 className="text-2xl font-bold">🗺️ Position Treemap</h1>
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 text-sm text-[var(--muted)]">
          No open positions to visualise. Open a paper trade first.
        </div>
      </div>
    );
  }

  const nodes: TreemapNode[] = positions.map((p) => ({
    name: p.symbol,
    size: Math.abs(p.market_value),
    pnl: p.unrealised_pl,
    pl_pct: p.unrealised_pl_pct,
  }));

  const totalMv = nodes.reduce((s, n) => s + n.size, 0);
  const totalPnl = positions.reduce((s, p) => s + p.unrealised_pl, 0);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">🗺️ Position Treemap</h1>
        <p className="text-[var(--muted)] text-sm">
          Box size = market value. Color intensity = unrealised P&L %.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 text-sm">
        <Stat label="Total market value" value={`$${totalMv.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} />
        <Stat label="Unrealised P&L" value={`${totalPnl >= 0 ? "+" : ""}$${totalPnl.toFixed(2)}`}
          color={totalPnl >= 0 ? "text-green-400" : "text-red-400"} />
        <Stat label="Positions" value={positions.length.toString()} />
      </div>

      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-2">
        <div style={{ width: "100%", height: 500 }}>
          <ResponsiveContainer>
            <Treemap
              data={nodes}
              dataKey="size"
              content={<CustomCell />}
            >
              <Tooltip content={<CustomTooltip />} />
            </Treemap>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">⚠️ Treemap of current Alpaca paper positions. Refresh to update.</div>
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
