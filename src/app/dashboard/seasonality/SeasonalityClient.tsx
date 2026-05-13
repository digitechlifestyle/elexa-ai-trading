"use client";

import { useEffect, useState } from "react";

interface DayStat {
  day: string;
  count: number;
  avg_return_pct: number;
  win_rate_pct: number;
}

interface MonthStat {
  month: string;
  count: number;
  avg_return_pct: number;
  win_rate_pct: number;
}

interface Data {
  symbol: string;
  years: number;
  sample_days: number;
  day_of_week: DayStat[];
  month_of_year: MonthStat[];
}

function bgFor(v: number, max: number): string {
  const ratio = max === 0 ? 0 : v / max;
  if (ratio > 0.7) return "bg-green-700";
  if (ratio > 0.3) return "bg-green-800";
  if (ratio > 0) return "bg-green-900/60";
  if (ratio < -0.7) return "bg-red-700";
  if (ratio < -0.3) return "bg-red-800";
  if (ratio < 0) return "bg-red-900/60";
  return "bg-[var(--background)]";
}

export default function SeasonalityClient() {
  const [symbol, setSymbol] = useState("SPY");
  const [input, setInput] = useState("");
  const [years, setYears] = useState("10");
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load(sym: string, y: number) {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/seasonality?symbol=${sym}&years=${y}`);
      const j = await res.json();
      if (!res.ok) setErr(j.error ?? "Failed");
      else setData(j);
    } catch {
      setErr("Network error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(symbol, Number(years));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const monthMax = data
    ? Math.max(...data.month_of_year.map((m) => Math.abs(m.avg_return_pct)))
    : 0;
  const dayMax = data
    ? Math.max(...data.day_of_week.map((d) => Math.abs(d.avg_return_pct)))
    : 0;

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">📊 Seasonality</h1>
        <p className="text-[var(--muted)] text-sm">
          Day-of-week and month-of-year statistical bias from real history.
          Used by every desk for tactical timing.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const s = input.trim().toUpperCase();
          if (s) {
            setSymbol(s);
            setInput("");
            load(s, Number(years));
          }
        }}
        className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4 flex flex-wrap gap-2 items-end"
      >
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs text-[var(--muted)] mb-1">
            Symbol — currently {symbol}
          </label>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase())}
            placeholder="e.g. SPY, AAPL, QQQ"
            className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-600"
          />
        </div>
        <div>
          <label className="block text-xs text-[var(--muted)] mb-1">Years</label>
          <input
            type="number"
            value={years}
            onChange={(e) => setYears(e.target.value)}
            min={1}
            max={20}
            className="w-24 bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-semibold"
        >
          {loading ? "Loading…" : "Load"}
        </button>
      </form>

      {err && (
        <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-3 py-2">
          {err}
        </div>
      )}

      {data && (
        <>
          <p className="text-xs text-[var(--muted)]">
            {data.symbol} · {data.years} years · {data.sample_days} samples
          </p>

          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
            <h2 className="font-semibold mb-4">Day of week</h2>
            <div className="grid grid-cols-5 gap-2">
              {data.day_of_week.map((d) => (
                <div
                  key={d.day}
                  className={`${bgFor(d.avg_return_pct, dayMax)} border border-[var(--card-border)] rounded-lg p-3 text-center text-white`}
                >
                  <p className="text-xs font-semibold">{d.day.slice(0, 3)}</p>
                  <p className="text-xl font-bold mt-1">
                    {d.avg_return_pct >= 0 ? "+" : ""}
                    {d.avg_return_pct.toFixed(3)}%
                  </p>
                  <p className="text-xs opacity-80 mt-1">
                    Win {d.win_rate_pct.toFixed(0)}% · {d.count}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
            <h2 className="font-semibold mb-4">Month of year</h2>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {data.month_of_year.map((m) => (
                <div
                  key={m.month}
                  className={`${bgFor(m.avg_return_pct, monthMax)} border border-[var(--card-border)] rounded-lg p-3 text-center text-white`}
                >
                  <p className="text-xs font-semibold">{m.month}</p>
                  <p className="text-lg font-bold mt-1">
                    {m.avg_return_pct >= 0 ? "+" : ""}
                    {m.avg_return_pct.toFixed(3)}%
                  </p>
                  <p className="text-xs opacity-80 mt-1">
                    Win {m.win_rate_pct.toFixed(0)}%
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">
        ⚠️ Historical bias only. Sample-size dependent. A &quot;positive&quot;
        average day means little if the win rate is 51%. Use as tactical
        flavour, not setup. Not financial advice.
      </div>
    </div>
  );
}
