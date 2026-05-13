"use client";

import { useEffect, useState } from "react";

interface Coin {
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  total_volume: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency: number;
  ath: number;
  ath_change_percentage: number;
}

interface Data {
  global: {
    total_market_cap_usd: number;
    total_volume_usd: number;
    btc_dominance: number;
    eth_dominance: number;
    market_cap_change_24h_pct: number;
  } | null;
  top_movers: { gainers: Coin[]; losers: Coin[] };
  top_by_volume: Coin[];
  top_by_mcap: Coin[];
}

function bn(n: number) {
  if (n > 1_000_000_000_000) return `$${(n / 1_000_000_000_000).toFixed(2)}T`;
  if (n > 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n > 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  return `$${n.toLocaleString()}`;
}

function CoinRow({ c }: { c: Coin }) {
  const ch24 = c.price_change_percentage_24h;
  return (
    <tr className="border-b border-[var(--card-border)] last:border-0">
      <td className="py-2 px-3 font-medium flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={c.image} alt="" className="w-5 h-5 rounded-full" />
        <span className="uppercase">{c.symbol}</span>
      </td>
      <td className="py-2 px-3 text-right">${c.current_price.toLocaleString()}</td>
      <td className="py-2 px-3 text-right text-[var(--muted)]">
        {bn(c.market_cap)}
      </td>
      <td className="py-2 px-3 text-right text-[var(--muted)]">
        {bn(c.total_volume)}
      </td>
      <td
        className={`py-2 px-3 text-right font-semibold ${
          ch24 >= 0 ? "text-green-400" : "text-red-400"
        }`}
      >
        {ch24 >= 0 ? "+" : ""}
        {ch24?.toFixed(2)}%
      </td>
    </tr>
  );
}

export default function OnChainClient() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/onchain")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-12 text-center text-[var(--muted)]">
        Loading on-chain data…
      </div>
    );
  }
  if (!data) {
    return (
      <div className="bg-red-950 border border-red-800 rounded-xl p-6 text-red-300 text-sm">
        Failed to load.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">⛓ Crypto On-Chain</h1>
        <p className="text-[var(--muted)] text-sm">
          Top 50 by market cap, dominance, biggest 24h movers. Source: CoinGecko.
        </p>
      </div>

      {data.global && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4">
            <p className="text-xs text-[var(--muted)] mb-1">Total mcap</p>
            <p className="text-xl font-bold">{bn(data.global.total_market_cap_usd)}</p>
            <p
              className={`text-xs font-semibold mt-1 ${
                data.global.market_cap_change_24h_pct >= 0
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {data.global.market_cap_change_24h_pct >= 0 ? "+" : ""}
              {data.global.market_cap_change_24h_pct.toFixed(2)}% 24h
            </p>
          </div>
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4">
            <p className="text-xs text-[var(--muted)] mb-1">24h volume</p>
            <p className="text-xl font-bold">{bn(data.global.total_volume_usd)}</p>
          </div>
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4">
            <p className="text-xs text-[var(--muted)] mb-1">BTC dominance</p>
            <p className="text-xl font-bold">{data.global.btc_dominance.toFixed(1)}%</p>
          </div>
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4">
            <p className="text-xs text-[var(--muted)] mb-1">ETH dominance</p>
            <p className="text-xl font-bold">{data.global.eth_dominance.toFixed(1)}%</p>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4">
          <h2 className="font-semibold mb-3">🚀 Top 5 gainers (24h)</h2>
          <table className="w-full text-sm">
            <tbody>
              {data.top_movers.gainers.map((c) => (
                <tr key={c.symbol} className="border-b border-[var(--card-border)] last:border-0">
                  <td className="py-1.5 uppercase font-medium">{c.symbol}</td>
                  <td className="py-1.5 text-right">${c.current_price.toLocaleString()}</td>
                  <td className="py-1.5 text-right text-green-400 font-semibold">
                    +{c.price_change_percentage_24h.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4">
          <h2 className="font-semibold mb-3">📉 Top 5 losers (24h)</h2>
          <table className="w-full text-sm">
            <tbody>
              {data.top_movers.losers.map((c) => (
                <tr key={c.symbol} className="border-b border-[var(--card-border)] last:border-0">
                  <td className="py-1.5 uppercase font-medium">{c.symbol}</td>
                  <td className="py-1.5 text-right">${c.current_price.toLocaleString()}</td>
                  <td className="py-1.5 text-right text-red-400 font-semibold">
                    {c.price_change_percentage_24h.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl overflow-hidden">
        <h2 className="font-semibold p-4 border-b border-[var(--card-border)]">
          Top 10 by market cap
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-[var(--muted)]">
              <tr>
                <th className="text-left py-2 px-3">Coin</th>
                <th className="text-right py-2 px-3">Price</th>
                <th className="text-right py-2 px-3">Mcap</th>
                <th className="text-right py-2 px-3">Volume</th>
                <th className="text-right py-2 px-3">24h</th>
              </tr>
            </thead>
            <tbody>
              {data.top_by_mcap.map((c) => (
                <CoinRow key={c.symbol} c={c} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">
        ⚠️ Source: CoinGecko. Free tier rate-limited. Research only — not financial advice.
      </div>
    </div>
  );
}
