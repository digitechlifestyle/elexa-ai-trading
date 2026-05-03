import type { IExchange, ExchangeConfig } from "./types";
import { AlpacaExchange } from "./alpaca";
import { KrakenExchange } from "./kraken";

export type ExchangeName = "alpaca" | "kraken" | "coinbase" | "binance";

const EXCHANGES: { [key in ExchangeName]: { name: string; assets: string[] } } = {
  alpaca: { name: "Alpaca", assets: ["stocks", "options"] },
  kraken: { name: "Kraken", assets: ["crypto"] },
  coinbase: { name: "Coinbase", assets: ["crypto"] },
  binance: { name: "Binance", assets: ["crypto", "futures"] },
};

export function createExchange(name: ExchangeName, config: ExchangeConfig): IExchange {
  switch (name) {
    case "alpaca":
      return new AlpacaExchange(config);
    case "kraken":
      return new KrakenExchange(config);
    // case "coinbase":
    //   return new CoinbaseExchange(config);
    // case "binance":
    //   return new BinanceExchange(config);
    default:
      throw new Error(`Unknown exchange: ${name}`);
  }
}

export function getAvailableExchanges() {
  return Object.entries(EXCHANGES).map(([key, info]) => ({
    id: key,
    name: info.name,
    assets: info.assets,
  }));
}

export function getExchangeInfo(name: ExchangeName) {
  return EXCHANGES[name];
}
