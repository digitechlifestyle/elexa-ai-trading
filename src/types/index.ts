export type UserRole = "user" | "admin" | "owner";

export interface Trade {
  id: string;
  user_id: string;
  symbol: string;
  side: "buy" | "sell";
  qty: number;
  filled_price: number | null;
  status: "pending" | "filled" | "cancelled" | "rejected";
  is_paper: boolean;
  created_at: string;
  alpaca_order_id: string | null;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  trade_id: string | null;
  title: string;
  notes: string;
  created_at: string;
}

export interface AgentRun {
  id: string;
  user_id: string;
  agent: AgentName;
  input: string;
  output: string | null;
  status: "running" | "completed" | "failed";
  tokens_used: number | null;
  created_at: string;
}

export type AgentName =
  | "quant"
  | "risk"
  | "ceo"
  | "compliance"
  | "seo"
  | "support";

export interface RiskLimits {
  max_position_size_usd: number;
  max_daily_loss_usd: number;
  max_open_positions: number;
  stop_loss_pct: number;
}

export interface AlpacaOrder {
  id: string;
  symbol: string;
  qty: string;
  side: "buy" | "sell";
  type: string;
  status: string;
  filled_avg_price: string | null;
}
