import type { IExchange, ExchangeConfig, Account, Order, Position, Asset, AssetType } from "./types";

export class AlpacaExchange implements IExchange {
  name = "Alpaca";
  config: ExchangeConfig;

  constructor(config: ExchangeConfig) {
    this.config = config;
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const res = await this.request("GET", "/v2/account");
      return !!res.id;
    } catch {
      return false;
    }
  }

  async getAccount(): Promise<Account> {
    const data = await this.request("GET", "/v2/account");
    return {
      cash: parseFloat(data.cash),
      buying_power: parseFloat(data.buying_power),
      portfolio_value: parseFloat(data.portfolio_value),
      equity: parseFloat(data.equity),
    };
  }

  async getPositions(): Promise<Position[]> {
    const data = await this.request("GET", "/v2/positions");
    return data.map((p: any) => ({
      symbol: p.symbol,
      qty: parseFloat(p.qty),
      avg_fill_price: parseFloat(p.avg_fill_price),
      current_price: parseFloat(p.current_price),
      unrealized_pl: parseFloat(p.unrealized_pl),
    }));
  }

  async searchAssets(query: string): Promise<Asset[]> {
    const data = await this.request("GET", `/v2/assets?status=active&class=us_equity`);
    return data
      .filter((a: any) => a.symbol.includes(query.toUpperCase()) || a.name.includes(query))
      .map((a: any) => ({
        symbol: a.symbol,
        name: a.name,
        type: "stock" as AssetType,
        exchange: "alpaca",
      }));
  }

  async getAssetPrice(symbol: string): Promise<number> {
    const res = await this.request(
      "GET",
      `/v2/stocks/${symbol.toUpperCase()}/trades/latest`
    );
    return parseFloat(res.trade.p);
  }

  async placeOrder(symbol: string, qty: number, side: "buy" | "sell"): Promise<Order> {
    const data = await this.request("POST", "/v2/orders", {
      symbol: symbol.toUpperCase(),
      qty: qty.toString(),
      side,
      type: "market",
      time_in_force: "day",
    });

    return {
      id: data.id,
      symbol: data.symbol,
      qty: parseFloat(data.qty),
      side: data.side,
      status: this.normalizeStatus(data.status),
      filled_price: data.filled_avg_price ? parseFloat(data.filled_avg_price) : null,
      created_at: data.created_at,
    };
  }

  async getOrders(status?: string): Promise<Order[]> {
    const query = status ? `?status=${status}` : "?status=all";
    const data = await this.request("GET", `/v2/orders${query}`);
    return data.map((o: any) => ({
      id: o.id,
      symbol: o.symbol,
      qty: parseFloat(o.qty),
      side: o.side,
      status: this.normalizeStatus(o.status),
      filled_price: o.filled_avg_price ? parseFloat(o.filled_avg_price) : null,
      created_at: o.created_at,
    }));
  }

  async cancelOrder(orderId: string): Promise<void> {
    await this.request("DELETE", `/v2/orders/${orderId}`);
  }

  supportedAssetTypes(): AssetType[] {
    return ["stock"];
  }

  private normalizeStatus(alpacaStatus: string): "pending" | "filled" | "cancelled" | "rejected" {
    if (!alpacaStatus) return "pending";
    if (alpacaStatus === "filled" || alpacaStatus === "partially_filled") return "filled";
    if (alpacaStatus === "new" || alpacaStatus === "pending") return "pending";
    if (alpacaStatus === "cancelled" || alpacaStatus === "expired") return "cancelled";
    return "rejected";
  }

  // Helper
  private async request(method: string, path: string, body?: any): Promise<any> {
    const url = `${this.config.base_url}${path}`;
    const options: RequestInit = {
      method,
      headers: {
        "APCA-API-KEY-ID": this.config.api_key,
        "APCA-API-SECRET-KEY": this.config.api_secret,
        "Content-Type": "application/json",
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const res = await fetch(url, options);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Alpaca error: ${err.message ?? res.statusText}`);
    }

    return res.json();
  }
}
