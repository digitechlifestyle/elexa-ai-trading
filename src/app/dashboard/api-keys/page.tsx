import { createClient } from "@/lib/supabase/server";
import { getPlanForUser } from "@/lib/billing/plans";
import ApiKeysClient from "./ApiKeysClient";
import Link from "next/link";

export default async function ApiKeysPage() {
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
        <div>
          <h1 className="text-2xl font-bold mb-1">API Keys</h1>
          <p className="text-[var(--muted)] text-sm">Pro-only feature.</p>
        </div>
        <div className="bg-indigo-950 border border-indigo-700 rounded-xl p-8 text-center space-y-4">
          <div className="text-4xl">🔑</div>
          <h2 className="text-xl font-bold">Upgrade to Pro</h2>
          <p className="text-[var(--muted)] text-sm max-w-md mx-auto">
            Generate API keys to access your account programmatically. Read positions,
            trade history, and account info via REST endpoints.
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

  return <ApiKeysClient />;
}
