import type { AlpacaOrder } from "@/types";

const BASE_URL = process.env.ALPACA_BASE_URL ?? "https://paper-api.alpaca.markets";
const KEY = process.env.ALPACA_API_KEY!;
const SECRET = process.env.ALPACA_API_SECRET!;

function alpacaHeaders() {
  return {
    "APCA-API-KEY-ID": KEY,
    "APCA-API-SECRET-KEY": SECRET,
    "Content-Type": "application/json",
  };
}

export async function getAccount() {
  const res = await fetch(`${BASE_URL}/v2/account`, {
    headers: alpacaHeaders(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Alpaca account fetch failed: ${res.statusText}`);
  return res.json();
}

export async function getPositions() {
  const res = await fetch(`${BASE_URL}/v2/positions`, {
    headers: alpacaHeaders(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Alpaca positions fetch failed: ${res.statusText}`);
  return res.json();
}

export async function placePaperOrder(
  symbol: string,
  qty: number,
  side: "buy" | "sell"
): Promise<AlpacaOrder> {
  if (process.env.LIVE_TRADING_ENABLED === "true") {
    throw new Error(
      "Live trading is not permitted. Set LIVE_TRADING_ENABLED=false."
    );
  }

  if (!BASE_URL.includes("paper-api")) {
    throw new Error(
      "ALPACA_BASE_URL must point to the paper trading endpoint. Live trading is not enabled."
    );
  }

  const res = await fetch(`${BASE_URL}/v2/orders`, {
    method: "POST",
    headers: alpacaHeaders(),
    body: JSON.stringify({
      symbol: symbol.toUpperCase(),
      qty: qty.toString(),
      side,
      type: "market",
      time_in_force: "day",
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Alpaca order failed: ${err.message ?? res.statusText}`);
  }

  return res.json();
}

export async function getOrders(): Promise<AlpacaOrder[]> {
  const res = await fetch(`${BASE_URL}/v2/orders?status=all&limit=50`, {
    headers: alpacaHeaders(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Alpaca orders fetch failed: ${res.statusText}`);
  return res.json();
}

export async function getLatestPrice(symbol: string): Promise<number> {
  const res = await fetch(
    `https://data.alpaca.markets/v2/stocks/${symbol.toUpperCase()}/trades/latest`,
    { headers: alpacaHeaders(), cache: "no-store" }
  );
  if (!res.ok) throw new Error(`Price fetch failed for ${symbol}`);
  const data = await res.json();
  return data.trade?.p ?? 0;
}
