import { createClient } from "@/lib/supabase/server";
import { getPlanForUser } from "@/lib/billing/plans";
import AutoTradeClient from "./AutoTradeClient";
import Link from "next/link";

export default async function AutoTradePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single();

  const plan = getPlanForUser(user!, profile?.role ?? null);

  if (!plan.limits.auto_trade) {
    return (
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Auto Trade</h1>
          <p className="text-[var(--muted)] text-sm">
            Pro-only feature.
          </p>
        </div>
        <div className="bg-indigo-950 border border-indigo-700 rounded-xl p-8 text-center space-y-4">
          <div className="text-4xl">✨</div>
          <h2 className="text-xl font-bold">Upgrade to Pro</h2>
          <p className="text-[var(--muted)] text-sm max-w-md mx-auto">
            Auto-Trade lets the Quant Agent propose a structured paper trade,
            the Risk Agent validates it, and you execute with one click. Pro
            tier — $99/month.
          </p>
          <Link
            href="/pricing"
            className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-lg font-semibold text-sm"
          >
            View Pricing
          </Link>
          <p className="text-xs text-[var(--muted)] pt-2">
            Current plan: <span className="font-semibold">{plan.name}</span>
          </p>
        </div>
      </div>
    );
  }

  return <AutoTradeClient />;
}
