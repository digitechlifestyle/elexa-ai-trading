import { createClient } from "@/lib/supabase/server";
import { getPlanForUser } from "@/lib/billing/plans";
import StrategyBuilderClient from "./StrategyBuilderClient";
import Link from "next/link";

export default async function StrategyBuilderPage() {
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

  if (plan.id !== "pro" && plan.id !== "team" && plan.id !== "owner") {
    return (
      <div className="max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold">Strategy Builder</h1>
        <div className="bg-indigo-950 border border-indigo-700 rounded-xl p-8 text-center space-y-4">
          <div className="text-4xl">🛠</div>
          <h2 className="text-xl font-bold">Upgrade to Pro</h2>
          <p className="text-[var(--muted)] text-sm max-w-md mx-auto">
            Build custom strategies with visual rules and backtest them on real
            historical data.
          </p>
          <Link
            href="/pricing"
            className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-lg font-semibold text-sm"
          >
            View Pricing
          </Link>
        </div>
      </div>
    );
  }

  return <StrategyBuilderClient />;
}
