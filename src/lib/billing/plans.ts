export type PlanTier = "free" | "researcher" | "pro" | "team" | "owner";

export interface PlanDef {
  id: PlanTier;
  name: string;
  price_usd: number; // monthly
  stripe_price_id: string | undefined;
  features: string[];
  limits: {
    agent_runs_per_day: number;
    portfolios: number;
    journal_retention_days: number;
    watchlist_symbols: number;
    csv_export: boolean;
    auto_trade: boolean;
  };
}

export const PLANS: Record<PlanTier, PlanDef> = {
  free: {
    id: "free",
    name: "Free",
    price_usd: 0,
    stripe_price_id: undefined,
    features: [
      "1 paper portfolio",
      "5 AI agent runs / day",
      "30-day journal retention",
      "Community Discord",
    ],
    limits: {
      agent_runs_per_day: 5,
      portfolios: 1,
      journal_retention_days: 30,
      watchlist_symbols: 5,
      csv_export: false,
      auto_trade: false,
    },
  },
  researcher: {
    id: "researcher",
    name: "Researcher",
    price_usd: 29,
    stripe_price_id: process.env.STRIPE_PRICE_RESEARCHER,
    features: [
      "Unlimited agent runs",
      "3 portfolios",
      "1-year journal retention",
      "All 6 AI agents",
      "CSV export",
      "Priority support",
    ],
    limits: {
      agent_runs_per_day: 100,
      portfolios: 3,
      journal_retention_days: 365,
      watchlist_symbols: 30,
      csv_export: true,
      auto_trade: false,
    },
  },
  pro: {
    id: "pro",
    name: "Pro",
    price_usd: 99,
    stripe_price_id: process.env.STRIPE_PRICE_PRO,
    features: [
      "Everything in Researcher, plus:",
      "Auto-trade workflow (Quant → Risk → execute)",
      "Custom risk profiles",
      "API access (read-only)",
      "Advanced agent orchestration",
      "Live trading (when activated)",
    ],
    limits: {
      agent_runs_per_day: 500,
      portfolios: 10,
      journal_retention_days: 3650,
      watchlist_symbols: 100,
      csv_export: true,
      auto_trade: true,
    },
  },
  team: {
    id: "team",
    name: "Team",
    price_usd: 499,
    stripe_price_id: process.env.STRIPE_PRICE_TEAM,
    features: [
      "10 seats",
      "Shared journal",
      "Admin panel",
      "White-label option",
      "Dedicated onboarding",
    ],
    limits: {
      agent_runs_per_day: 5000,
      portfolios: 100,
      journal_retention_days: 3650,
      watchlist_symbols: 500,
      csv_export: true,
      auto_trade: true,
    },
  },
  owner: {
    id: "owner",
    name: "Owner",
    price_usd: 0,
    stripe_price_id: undefined,
    features: ["Full access — internal account"],
    limits: {
      agent_runs_per_day: Number.MAX_SAFE_INTEGER,
      portfolios: Number.MAX_SAFE_INTEGER,
      journal_retention_days: Number.MAX_SAFE_INTEGER,
      watchlist_symbols: Number.MAX_SAFE_INTEGER,
      csv_export: true,
      auto_trade: true,
    },
  },
};

interface UserLike {
  app_metadata?: Record<string, unknown> | null;
}

/**
 * Resolve the effective plan for a user.
 * Order of precedence:
 *   1. Profile role = owner/admin → "owner" plan (unlimited bypass)
 *   2. app_metadata.plan (set by Stripe webhook on subscription update)
 *   3. Default "free"
 *
 * Reads app_metadata, not user_metadata: user_metadata can be edited by the
 * user themselves via the client SDK (supabase.auth.updateUser()), which
 * would make every paid plan a free self-service upgrade. app_metadata is
 * only writable with the service-role key (billing webhook + checkout
 * route), so it's the only place billing state can live safely.
 */
export function getPlanForUser(
  user: UserLike,
  profileRole?: string | null
): PlanDef {
  if (profileRole === "owner" || profileRole === "admin") {
    return PLANS.owner;
  }
  const planId = user.app_metadata?.plan as PlanTier | undefined;
  if (planId && PLANS[planId]) {
    const status = user.app_metadata?.subscription_status as string | undefined;
    if (status === "active" || status === "trialing") {
      return PLANS[planId];
    }
  }
  return PLANS.free;
}
