import { AlpacaExchange } from "@/lib/exchanges/alpaca";
import { getBuffettIndicator } from "@/lib/market/buffett";
import { isValidSymbolFormat } from "@/lib/trading/risk-limits";

// Common uppercase English words that would otherwise false-positive as tickers
const STOPWORDS = new Set([
  "I", "A", "AN", "THE", "OR", "AND", "TO", "IN", "ON", "IS", "IT", "OF",
  "BUY", "SELL", "GO", "UP", "DOWN", "AI", "USD", "CEO", "PRO",
]);

/** Best-effort ticker extraction from freeform user text — e.g. "should I buy AAPL" -> "AAPL". */
export function extractSymbol(input: string): string | null {
  const matches = input.toUpperCase().match(/\b[A-Z]{1,5}\b/g) ?? [];
  for (const candidate of matches) {
    if (STOPWORDS.has(candidate)) continue;
    if (isValidSymbolFormat(candidate)) return candidate;
  }
  return null;
}

export interface MarketContext {
  contextBlock: string;
  symbol: string | null;
  price: number | null;
}

/**
 * Real, verifiable market data to ground the Quant Agent's proposal in —
 * instead of letting the model invent prices. Anything not found here is
 * explicitly marked unavailable so the agent's system prompt can tell it
 * not to fabricate a substitute.
 */
export async function buildMarketContext(input: string): Promise<MarketContext> {
  const lines: string[] = [];

  const buffett = await getBuffettIndicator().catch(() => null);
  if (buffett?.ratio != null) {
    lines.push(
      `Buffett Indicator (US total market cap / GDP): ${buffett.ratio.toFixed(1)}% — ${buffett.classification?.label} (as of ${buffett.mcap_date})`
    );
  } else {
    lines.push("Buffett Indicator: unavailable");
  }

  const symbol = extractSymbol(input);
  let price: number | null = null;
  if (symbol) {
    try {
      const exchange = new AlpacaExchange({
        name: "alpaca",
        api_key: process.env.ALPACA_API_KEY || "",
        api_secret: process.env.ALPACA_API_SECRET || "",
        base_url: process.env.ALPACA_BASE_URL || "https://paper-api.alpaca.markets",
      });
      price = await exchange.getAssetPrice(symbol);
      lines.push(`${symbol} current price: $${price}`);
    } catch {
      lines.push(`${symbol}: current price unavailable (could not fetch from Alpaca)`);
    }
  }

  return { contextBlock: lines.join("\n"), symbol, price };
}
