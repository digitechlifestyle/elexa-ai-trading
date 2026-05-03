/**
 * Exchange Plugin Interface
 * Each exchange (Alpaca, Kraken, Coinbase, Binance) implements this interface
 */

export type AssetType = "stock" | "crypto" | "forex" | "futures";

export interface Asset {
  symbol: string;
  name: string;
  type: AssetType;
  exchange: string;
}

export interface Order {
  id: string;
  symbol: string;
  qty: number;
  side: "buy" | "sell";
  status: "pending" | "filled" | "cancelled" | "rejected";
  filled_price: number | null;
  created_at: string;
}

export interface Account {
  cash: number;
  buying_power: number;
  portfolio_value: number;
  equity: number;
}

export interface Position {
  symbol: string;
  qty: number;
  avg_fill_price: number;
  current_price: number;
  unrealized_pl: number;
}

export interface ExchangeConfig {
  name: string;
  api_key: string;
  api_secret: string;
  base_url: string;
  sandbox_url?: string;
  use_sandbox?: boolean;
}

export interface IExchange {
  name: string;
  config: ExchangeConfig;

  // Account info
  getAccount(): Promise<Account>;
  getPositions(): Promise<Position[]>;

  // Assets
  searchAssets(query: string): Promise<Asset[]>;
  getAssetPrice(symbol: string): Promise<number>;

  // Trading
  placeOrder(symbol: string, qty: number, side: "buy" | "sell"): Promise<Order>;
  getOrders(status?: string): Promise<Order[]>;
  cancelOrder(orderId: string): Promise<void>;

  // Validation
  validateCredentials(): Promise<boolean>;
  supportedAssetTypes(): AssetType[];
}
