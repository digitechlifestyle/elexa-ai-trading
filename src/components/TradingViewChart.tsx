"use client";

import { useEffect, useRef } from "react";

const ALPACA_CRYPTO_SYMBOLS = new Set([
  "AAVE", "ADA", "ARB", "AVAX", "BAT", "BCH", "BONK", "BTC", "CRV",
  "DOGE", "DOT", "ETH", "FIL", "GRT", "HYPE", "LDO", "LINK", "LTC",
  "ONDO", "PAXG", "PEPE", "POL", "RENDER", "SHIB", "SKY", "SOL",
  "SUSHI", "TRUMP", "UNI", "USDC", "USDG", "USDT", "WIF", "XRP",
  "XTZ", "YFI",
]);

/**
 * Map app symbol to TradingView symbol.
 *   Stocks: prefix NASDAQ: or NYSE: — start with NASDAQ as fallback.
 *   Crypto: prefix BINANCE: + concat with USDT.
 *   Slash format (BTC/USD) → strip and use BINANCE:BTCUSDT.
 */
function toTradingViewSymbol(sym: string): string {
  const upper = sym.toUpperCase().replace(/\//g, "");
  if (upper.endsWith("USD") || upper.endsWith("USDT")) {
    const base = upper.replace(/USDT?$/, "");
    if (ALPACA_CRYPTO_SYMBOLS.has(base)) {
      return `BINANCE:${base}USDT`;
    }
  }
  if (ALPACA_CRYPTO_SYMBOLS.has(upper)) {
    return `BINANCE:${upper}USDT`;
  }
  return `NASDAQ:${upper}`;
}

interface Props {
  symbol: string;
  height?: number;
  interval?: "1" | "5" | "15" | "30" | "60" | "240" | "D" | "W";
  theme?: "light" | "dark";
}

export default function TradingViewChart({
  symbol,
  height = 400,
  interval = "D",
  theme = "dark",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";

    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    widgetDiv.style.height = `${height}px`;
    widgetDiv.style.width = "100%";
    containerRef.current.appendChild(widgetDiv);

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: toTradingViewSymbol(symbol),
      interval,
      timezone: "Etc/UTC",
      theme,
      style: "1",
      locale: "en",
      allow_symbol_change: false,
      hide_side_toolbar: false,
      hide_top_toolbar: false,
      details: false,
      withdateranges: true,
      save_image: false,
      backgroundColor: "rgba(18, 18, 26, 1)",
      gridColor: "rgba(30, 30, 46, 1)",
      support_host: "https://www.tradingview.com",
    });
    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, [symbol, height, interval, theme]);

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container w-full"
      style={{ height }}
    />
  );
}
