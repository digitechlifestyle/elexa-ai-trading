/**
 * Trade analytics: FIFO-match buys → sells to compute closed-trade outcomes.
 * Then bucket by R-multiple, hour, weekday, and build equity curve.
 */

export interface RawTrade {
  symbol: string;
  side: "buy" | "sell";
  qty: number;
  filled_price: number | null;
  status: string;
  created_at: string;
}

export interface ClosedTrade {
  symbol: string;
  qty: number;
  entry_price: number;
  exit_price: number;
  entry_time: string;
  exit_time: string;
  pnl: number;
  r_multiple: number; // pnl / abs(entry_price) — proxy when no stop is logged
  return_pct: number;
}

interface Lot {
  qty: number;
  price: number;
  time: string;
}

export function matchTrades(trades: RawTrade[]): ClosedTrade[] {
  const filled = trades.filter(
    (t) => t.status === "filled" && t.filled_price != null && t.qty > 0
  );
  const lotsBySym = new Map<string, Lot[]>();
  const closed: ClosedTrade[] = [];

  for (const t of filled) {
    const price = Number(t.filled_price);
    let remaining = Number(t.qty);
    if (t.side === "buy") {
      const arr = lotsBySym.get(t.symbol) ?? [];
      arr.push({ qty: remaining, price, time: t.created_at });
      lotsBySym.set(t.symbol, arr);
    } else {
      // sell — match against oldest lots
      const arr = lotsBySym.get(t.symbol) ?? [];
      while (remaining > 0 && arr.length > 0) {
        const lot = arr[0];
        const take = Math.min(lot.qty, remaining);
        const pnl = (price - lot.price) * take;
        closed.push({
          symbol: t.symbol,
          qty: take,
          entry_price: lot.price,
          exit_price: price,
          entry_time: lot.time,
          exit_time: t.created_at,
          pnl,
          // R-multiple proxy: pnl per dollar entered. Real R needs stop.
          r_multiple: lot.price > 0 ? (price - lot.price) / lot.price : 0,
          return_pct: lot.price > 0 ? ((price - lot.price) / lot.price) * 100 : 0,
        });
        lot.qty -= take;
        remaining -= take;
        if (lot.qty === 0) arr.shift();
      }
      lotsBySym.set(t.symbol, arr);
    }
  }
  return closed;
}

export interface RBucket { label: string; count: number; pnl: number; }
export function rDistribution(closed: ClosedTrade[]): RBucket[] {
  const edges = [-Infinity, -3, -2, -1, -0.5, 0, 0.5, 1, 2, 3, Infinity];
  const labels = ["< -3R", "-3 to -2R", "-2 to -1R", "-1 to -0.5R", "-0.5 to 0R",
    "0 to 0.5R", "0.5 to 1R", "1 to 2R", "2 to 3R", "> 3R"];
  const buckets: RBucket[] = labels.map((l) => ({ label: l, count: 0, pnl: 0 }));
  for (const t of closed) {
    // r_multiple is decimal return; map to R as multiple of 1% baseline.
    // Without a logged stop, use return_pct/100 normalised to "R-ish" buckets via direct return.
    const r = t.r_multiple; // -0.05 = -5% etc.
    for (let i = 0; i < edges.length - 1; i++) {
      if (r >= edges[i] && r < edges[i + 1]) {
        buckets[i].count += 1;
        buckets[i].pnl += t.pnl;
        break;
      }
    }
  }
  return buckets;
}

export interface HourBucket { hour: number; trades: number; wins: number; pnl: number; }
export function byHour(closed: ClosedTrade[]): HourBucket[] {
  const arr: HourBucket[] = Array.from({ length: 24 }, (_, h) => ({ hour: h, trades: 0, wins: 0, pnl: 0 }));
  for (const t of closed) {
    const h = new Date(t.exit_time).getUTCHours();
    arr[h].trades += 1;
    if (t.pnl > 0) arr[h].wins += 1;
    arr[h].pnl += t.pnl;
  }
  return arr;
}

export interface DowBucket { day: string; trades: number; wins: number; pnl: number; }
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export function byWeekday(closed: ClosedTrade[]): DowBucket[] {
  const arr: DowBucket[] = DOW.map((d) => ({ day: d, trades: 0, wins: 0, pnl: 0 }));
  for (const t of closed) {
    const i = new Date(t.exit_time).getUTCDay();
    arr[i].trades += 1;
    if (t.pnl > 0) arr[i].wins += 1;
    arr[i].pnl += t.pnl;
  }
  return arr;
}

export interface EquityPoint { date: string; equity: number; drawdown_pct: number; }
export function equityCurve(closed: ClosedTrade[]): EquityPoint[] {
  const sorted = [...closed].sort((a, b) => (a.exit_time < b.exit_time ? -1 : 1));
  let eq = 0;
  let peak = 0;
  const pts: EquityPoint[] = [];
  for (const t of sorted) {
    eq += t.pnl;
    if (eq > peak) peak = eq;
    const dd = peak > 0 ? ((eq - peak) / peak) * 100 : 0;
    pts.push({ date: t.exit_time.slice(0, 10), equity: eq, drawdown_pct: dd });
  }
  return pts;
}
