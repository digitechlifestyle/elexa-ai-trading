import type {
  IExchange,
  ExchangeConfig,
  Account,
  Order,
  Position,
  Asset,
  AssetType,
} from "./types";

/**
 * Kraken — paper-only adapter.
 *
 * Kraken does not provide a paper trading sandbox. We do NOT send real orders.
 * This adapter uses Kraken's public API for live market prices, then returns
 * a synthetic "filled" Order at the last trade price. The order is persisted
 * to our database as is_paper=true so simulated P&L tracking still works.
 *
 * Use Kraken specifically for symbols not available on Alpaca's crypto API:
 * HBAR (Hedera), XLM (Stellar), DAI, ATOM, ALGO, KAVA, NEAR, ICP, etc.
 */
const KRAKEN_PAIR_OVERRIDES: Record<string, string> = {
  BTC: "XBTUSD",
  XBT: "XBTUSD",
  ETH: "ETHUSD",
  XRP: "XRPUSD",
  SOL: "SOLUSD",
  DOGE: "XDGUSD",
  ADA: "ADAUSD",
  DOT: "DOTUSD",
  LINK: "LINKUSD",
  LTC: "LTCUSD",
  BCH: "BCHUSD",
  HBAR: "HBARUSD",
  XLM: "XLMUSD",
  DAI: "DAIUSD",
  USDT: "USDTUSD",
  USDC: "USDCUSD",
  ATOM: "ATOMUSD",
  ALGO: "ALGOUSD",
  AVAX: "AVAXUSD",
  MATIC: "MATICUSD",
  NEAR: "NEARUSD",
  ICP: "ICPUSD",
  FIL: "FILUSD",
  AAVE: "AAVEUSD",
  UNI: "UNIUSD",
  SHIB: "SHIBUSD",
  PEPE: "PEPEUSD",
  KAVA: "KAVAUSD",
  GRT: "GRTUSD",
  SAND: "SANDUSD",
  MANA: "MANAUSD",
  CRV: "CRVUSD",
  COMP: "COMPUSD",
};

export class KrakenExchange implements IExchange {
  name = "Kraken (paper)";
  config: ExchangeConfig;

  constructor(config: ExchangeConfig) {
    this.config = config;
  }

  async validateCredentials(): Promise<boolean> {
    // No auth needed for public price endpoints we use. Always valid.
    return true;
  }

  async getAccount(): Promise<Account> {
    // Paper-only — return a fixed simulated balance
    return {
      cash: 100_000,
      buying_power: 100_000,
      portfolio_value: 100_000,
      equity: 100_000,
    };
  }

  async getPositions(): Promise<Position[]> {
    // Positions are tracked in the trades table, not here
    return [];
  }

  async searchAssets(query: string): Promise<Asset[]> {
    try {
      const data = await this.publicRequest("AssetPairs", {});
      const q = query.toUpperCase();
      return Object.entries(data as Record<string, { altname?: string }>)
        .filter(([name]) => name.includes(q))
        .slice(0, 10)
        .map(([symbol, info]) => ({
          symbol: (info?.altname || symbol).replace(/USD$/, ""),
          name: info?.altname || symbol,
          type: "crypto" as AssetType,
          exchange: "kraken",
        }));
    } catch {
      return [];
    }
  }

  async getAssetPrice(symbol: string): Promise<number> {
    const pair = this.formatPair(symbol);
    const data = await this.publicRequest("Ticker", { pair });
    const tickers = Object.values(data as Record<string, { c: string[] }>);
    if (tickers.length === 0 || !tickers[0]?.c?.[0]) {
      throw new Error(`No price data for ${symbol} on Kraken`);
    }
    return parseFloat(tickers[0].c[0]);
  }

  async placeOrder(
    symbol: string,
    qty: number,
    side: "buy" | "sell"
  ): Promise<Order> {
    // Paper-only: fetch real price, return synthetic filled order
    const price = await this.getAssetPrice(symbol);
    return {
      id: `kraken-paper-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      symbol: symbol.toUpperCase(),
      qty,
      side,
      status: "filled",
      filled_price: price,
      created_at: new Date().toISOString(),
    };
  }

  async getOrders(): Promise<Order[]> {
    // Paper-only — no real orders to fetch
    return [];
  }

  async cancelOrder(): Promise<void> {
    // Paper-only — no real orders to cancel
  }

  supportedAssetTypes(): AssetType[] {
    return ["crypto"];
  }

  private formatPair(symbol: string): string {
    const upper = symbol.toUpperCase();
    if (KRAKEN_PAIR_OVERRIDES[upper]) return KRAKEN_PAIR_OVERRIDES[upper];
    return `${upper}USD`;
  }

  private async publicRequest(
    endpoint: string,
    params: Record<string, string | number>
  ): Promise<unknown> {
    const url = new URL(`https://api.kraken.com/0/public/${endpoint}`);
    Object.entries(params).forEach(([k, v]) =>
      url.searchParams.append(k, String(v))
    );

    const res = await fetch(url);
    const data = (await res.json()) as {
      error?: string[];
      result?: unknown;
    };
    if (data.error && data.error.length > 0) {
      throw new Error(`Kraken error: ${data.error[0]}`);
    }
    return data.result;
  }
}
