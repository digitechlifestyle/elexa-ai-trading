import type { IExchange, ExchangeConfig, Account, Order, Position, Asset, AssetType } from "./types";
import crypto from "crypto";

export class KrakenExchange implements IExchange {
  name = "Kraken";
  config: ExchangeConfig;

  constructor(config: ExchangeConfig) {
    this.config = config;
  }

  async validateCredentials(): Promise<boolean> {
    try {
      await this.privateRequest("GetAccountBalance", {});
      return true;
    } catch {
      return false;
    }
  }

  async getAccount(): Promise<Account> {
    const data = await this.privateRequest("GetAccountBalance", {});
    const total = Object.values(data).reduce((sum: number, val: any) => sum + parseFloat(val), 0);
    return {
      cash: total,
      buying_power: total,
      portfolio_value: total,
      equity: total,
    };
  }

  async getPositions(): Promise<Position[]> {
    const data = await this.privateRequest("OpenPositions", {});
    return Object.entries(data).map(([, pos]: [string, any]) => ({
      symbol: pos.pair,
      qty: parseFloat(pos.posstatus),
      avg_fill_price: parseFloat(pos.cost),
      current_price: parseFloat(pos.value),
      unrealized_pl: parseFloat(pos.unrealised_pl),
    }));
  }

  async searchAssets(query: string): Promise<Asset[]> {
    const data = await this.publicRequest("AssetPairs", {});
    const q = query.toUpperCase();
    return Object.entries(data)
      .filter(([name]) => name.includes(q))
      .slice(0, 10)
      .map(([symbol, info]: [string, any]) => ({
        symbol: symbol.replace("X", "").replace("Z", ""),
        name: info.altname || symbol,
        type: "crypto" as AssetType,
        exchange: "kraken",
      }));
  }

  async getAssetPrice(symbol: string): Promise<number> {
    const pair = this.formatPair(symbol);
    const data = await this.publicRequest("Ticker", { pair });
    const ticker = Object.values(data)[0] as any;
    return parseFloat(ticker.c[0]);
  }

  async placeOrder(symbol: string, qty: number, side: "buy" | "sell"): Promise<Order> {
    const pair = this.formatPair(symbol);
    const data = await this.privateRequest("AddOrder", {
      pair,
      type: side,
      ordertype: "market",
      volume: qty.toString(),
    });

    const txid = data.txid[0];
    return {
      id: txid,
      symbol,
      qty,
      side,
      status: "pending",
      filled_price: null,
      created_at: new Date().toISOString(),
    };
  }

  async getOrders(): Promise<Order[]> {
    const data = await this.privateRequest("OpenOrders", {});
    return Object.entries(data.open || {}).map(([id, order]: [string, any]) => ({
      id,
      symbol: order.pair,
      qty: parseFloat(order.vol),
      side: order.type as "buy" | "sell",
      status: "pending",
      filled_price: null,
      created_at: order.opentm,
    }));
  }

  async cancelOrder(orderId: string): Promise<void> {
    await this.privateRequest("CancelOrder", { txid: orderId });
  }

  supportedAssetTypes(): AssetType[] {
    return ["crypto"];
  }

  private formatPair(symbol: string): string {
    const map: { [key: string]: string } = {
      BTC: "XXBTZUSD",
      XRP: "XXRPZUSD",
      SOL: "SOLDUSD",
      ETH: "XETHZUSD",
    };
    return map[symbol.toUpperCase()] || `${symbol.toUpperCase()}USD`;
  }

  private async publicRequest(endpoint: string, params: any): Promise<any> {
    const url = new URL(`https://api.kraken.com/0/public/${endpoint}`);
    Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, String(v)));

    const res = await fetch(url);
    const data = await res.json();
    if (data.error?.length) throw new Error(data.error[0]);
    return data.result;
  }

  private async privateRequest(endpoint: string, params: any): Promise<any> {
    const nonce = Date.now() * 1000;
    const postdata = new URLSearchParams({ nonce: nonce.toString(), ...params });
    const message = `${endpoint}${postdata}`;
    const signature = crypto
      .createHmac("sha512", Buffer.from(this.config.api_secret, "base64"))
      .update(message)
      .digest("base64");

    const res = await fetch(`https://api.kraken.com/0/private/${endpoint}`, {
      method: "POST",
      headers: {
        "API-Key": this.config.api_key,
        "API-Sign": signature,
      },
      body: postdata,
    });

    const data = await res.json();
    if (data.error?.length) throw new Error(data.error[0]);
    return data.result;
  }
}
