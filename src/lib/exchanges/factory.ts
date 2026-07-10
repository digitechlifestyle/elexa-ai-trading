import type { IExchange, ExchangeConfig } from "./types";
import { AlpacaExchange } from "./alpaca";
import { KrakenExchange } from "./kraken";

// Only list exchanges with a real IExchange implementation below — this
// type/map directly drives the exchange picker in the trading UI, so an
// entry here with no case in createExchange() is a selectable option that
// always fails with "Unknown exchange" on submit.
export type ExchangeName = "alpaca" | "kraken";

const EXCHANGES: { [key in ExchangeName]: { name: string; assets: string[] } } = {
  alpaca: { name: "Alpaca (real paper API)", assets: ["stocks, ETFs, commodities (GLD, SLV, USO)", "crypto (BTC, ETH, XRP, SOL, DOGE, PEPE, SHIB...)"] },
  kraken: { name: "Kraken (simulated)", assets: ["extended crypto (HBAR, XLM, DAI, ATOM, ALGO, ICP, NEAR, KAVA)"] },
};

export function createExchange(name: ExchangeName, config: ExchangeConfig): IExchange {
  switch (name) {
    case "alpaca":
      return new AlpacaExchange(config);
    case "kraken":
      return new KrakenExchange(config);
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
