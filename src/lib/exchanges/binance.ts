import type { IExchange, ExchangeConfig, Account, Order, Position, Asset, AssetType } from "./types";
import crypto from "crypto";

export class BinanceExchange implements IExchange {
  name = "Binance";
  config: ExchangeConfig;

  constructor(config: ExchangeConfig) {
    this.config = config;
  }

  async validateCredentials(): Promise<boolean> {
    try {
      await this.privateRequest("GET", "/api/v3/account", {});
      return true;
    } catch {
      return false;
    }
  }

  async getAccount(): Promise<Account> {
    const data = await this.privateRequest("GET", "/api/v3/account", {});
    const usdtBalance = data.balances.find((b: any) => b.asset === "USDT") || { free: "0" };
    const cash = parseFloat(usdtBalance.free);
    return {
      cash,
      buying_power: cash,
      portfolio_value: cash,
      equity: cash,
    };
  }

  async getPositions(): Promise<Position[]> {
    const data = await this.privateRequest("GET", "/api/v3/account", {});
    return data.balances
      .filter((b: any) => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0)
      .map((b: any) => ({
        symbol: b.asset,
        qty: parseFloat(b.free) + parseFloat(b.locked),
        avg_fill_price: 0,
        current_price: 0,
        unrealized_pl: 0,
      }));
  }

  async searchAssets(query: string): Promise<Asset[]> {
    const data = await this.publicRequest("GET", "/api/v3/exchangeInfo", {});
    const q = query.toUpperCase();
    return data.symbols
      .filter((s: any) => s.symbol.includes(q) && s.status === "TRADING")
      .slice(0, 10)
      .map((s: any) => ({
        symbol: s.baseAsset,
        name: s.baseAsset,
        type: "crypto" as AssetType,
        exchange: "binance",
      }));
  }

  async getAssetPrice(symbol: string): Promise<number> {
    const pair = `${symbol.toUpperCase()}USDT`;
    const data = await this.publicRequest("GET", "/api/v3/ticker/price", { symbol: pair });
    return parseFloat(data.price);
  }

  async placeOrder(symbol: string, qty: number, side: "buy" | "sell"): Promise<Order> {
    const pair = `${symbol.toUpperCase()}USDT`;
    const data = await this.privateRequest("POST", "/api/v3/order", {
      symbol: pair,
      side: side.toUpperCase(),
      type: "MARKET",
      quantity: qty.toString(),
    });

    return {
      id: data.orderId.toString(),
      symbol,
      qty,
      side,
      status: "pending",
      filled_price: null,
      created_at: new Date(data.transactTime).toISOString(),
    };
  }

  async getOrders(): Promise<Order[]> {
    const data = await this.privateRequest("GET", "/api/v3/allOrders", {});
    return data.slice(0, 50).map((o: any) => ({
      id: o.orderId.toString(),
      symbol: o.symbol.replace("USDT", ""),
      qty: parseFloat(o.origQty),
      side: o.side.toLowerCase() as "buy" | "sell",
      status: o.status === "FILLED" ? "filled" : "pending",
      filled_price: o.executedQty > 0 ? parseFloat(o.cummulativeQuoteQty) / parseFloat(o.executedQty) : null,
      created_at: new Date(o.time).toISOString(),
    }));
  }

  async cancelOrder(): Promise<void> {
    // Implement if needed
  }

  supportedAssetTypes(): AssetType[] {
    return ["crypto", "futures"];
  }

  private async publicRequest(method: string, path: string, params: any): Promise<any> {
    const url = new URL(`https://api.binance.com${path}`);
    Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, String(v)));

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Binance error: ${res.statusText}`);
    return res.json();
  }

  private async privateRequest(method: string, path: string, params: any): Promise<any> {
    const url = new URL(`https://api.binance.com${path}`);
    const queryString = new URLSearchParams({ timestamp: Date.now().toString(), ...params });
    const signature = crypto
      .createHmac("sha256", this.config.api_secret)
      .update(queryString.toString())
      .digest("hex");
    queryString.append("signature", signature);

    const fullUrl = `${url}?${queryString}`;
    const res = await fetch(fullUrl, {
      method,
      headers: { "X-MBX-APIKEY": this.config.api_key },
    });

    if (!res.ok) throw new Error(`Binance error: ${res.statusText}`);
    return res.json();
  }
}
