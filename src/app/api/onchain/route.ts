import { withApi } from "@/lib/observability/api-handler";
import { NextResponse } from "next/server";

interface CoinMarket {
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

interface GlobalData {
  total_market_cap_usd: number;
  total_volume_usd: number;
  btc_dominance: number;
  eth_dominance: number;
  market_cap_change_24h_pct: number;
}

interface OnChainResponse {
  global: GlobalData | null;
  top_movers: { gainers: CoinMarket[]; losers: CoinMarket[] };
  top_by_volume: CoinMarket[];
  top_by_mcap: CoinMarket[];
}

export const GET = withApi(async function GET() {
  try {
    const [globalRes, marketsRes] = await Promise.all([
      fetch("https://api.coingecko.com/api/v3/global", {
        next: { revalidate: 600 },
      }),
      fetch(
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&price_change_percentage=24h,7d",
        { next: { revalidate: 300 } }
      ),
    ]);

    let global: GlobalData | null = null;
    if (globalRes.ok) {
      const g = await globalRes.json();
      global = {
        total_market_cap_usd: g?.data?.total_market_cap?.usd ?? 0,
        total_volume_usd: g?.data?.total_volume?.usd ?? 0,
        btc_dominance: g?.data?.market_cap_percentage?.btc ?? 0,
        eth_dominance: g?.data?.market_cap_percentage?.eth ?? 0,
        market_cap_change_24h_pct:
          g?.data?.market_cap_change_percentage_24h_usd ?? 0,
      };
    }

    const markets: CoinMarket[] = marketsRes.ok ? await marketsRes.json() : [];

    const sortedByGain = [...markets]
      .filter((m) => Number.isFinite(m.price_change_percentage_24h))
      .sort(
        (a, b) =>
          (b.price_change_percentage_24h ?? 0) -
          (a.price_change_percentage_24h ?? 0)
      );

    const byVol = [...markets].sort((a, b) => b.total_volume - a.total_volume);

    const resp: OnChainResponse = {
      global,
      top_movers: {
        gainers: sortedByGain.slice(0, 5),
        losers: sortedByGain.slice(-5).reverse(),
      },
      top_by_volume: byVol.slice(0, 10),
      top_by_mcap: markets.slice(0, 10),
    };
    return NextResponse.json(resp);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 502 }
    );
  }
});
