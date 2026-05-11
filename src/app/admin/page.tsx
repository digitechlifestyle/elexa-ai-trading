import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Role check — only admin/owner
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "owner"].includes(profile.role)) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        <h1 className="text-2xl font-bold mb-3">Access Denied</h1>
        <p className="text-[var(--muted)]">
          Admin access required to view this page.
        </p>
      </div>
    );
  }

  const adminClient = await createAdminClient();
  const { data: users } = await adminClient
    .from("profiles")
    .select("id, email, role, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const { data: recentTrades } = await adminClient
    .from("trades")
    .select("id, symbol, side, qty, status, is_paper, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: agentRuns } = await adminClient
    .from("agent_runs")
    .select("id, agent, status, tokens_used, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  const liveTradingEnabled = process.env.LIVE_TRADING_ENABLED === "true";

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <div className="flex items-center gap-3">
          <a
            href="/admin/errors"
            className="text-sm bg-[var(--card)] border border-[var(--card-border)] hover:border-indigo-600 px-3 py-1.5 rounded-lg transition-colors"
          >
            Error Dashboard
          </a>
          <a
            href="/admin/setup"
            className="text-sm bg-[var(--card)] border border-[var(--card-border)] hover:border-indigo-600 px-3 py-1.5 rounded-lg transition-colors"
          >
            User Setup
          </a>
          <div
            className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
              liveTradingEnabled
                ? "bg-red-900 border border-red-700 text-red-300"
                : "bg-green-950 border border-green-800 text-green-300"
            }`}
          >
            Live: {liveTradingEnabled ? "⚠️ ENABLED" : "✓ Paper"}
          </div>
        </div>
      </div>

      {liveTradingEnabled && (
        <div className="bg-red-950 border border-red-700 rounded-xl p-4 text-red-300 text-sm">
          <strong>Warning:</strong> LIVE_TRADING_ENABLED is set to true. Real
          money orders can be placed. Ensure Alpaca live API keys are configured
          and all paper trading tests have passed.
        </div>
      )}

      {/* Users */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Users ({users?.length ?? 0})</h2>
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--card-border)]">
              <tr className="text-[var(--muted)] text-xs">
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Role</th>
                <th className="text-left px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {(users ?? []).map((u) => (
                <tr key={u.id} className="border-b border-[var(--card-border)] last:border-0">
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="bg-indigo-950 text-indigo-300 text-xs px-2 py-0.5 rounded">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--muted)]">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Recent trades */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Recent Trades</h2>
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--card-border)]">
              <tr className="text-[var(--muted)] text-xs">
                <th className="text-left px-4 py-3">Symbol</th>
                <th className="text-left px-4 py-3">Side</th>
                <th className="text-left px-4 py-3">Qty</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Mode</th>
                <th className="text-left px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {(recentTrades ?? []).map((t) => (
                <tr key={t.id} className="border-b border-[var(--card-border)] last:border-0">
                  <td className="px-4 py-3 font-medium">{t.symbol}</td>
                  <td className={`px-4 py-3 ${t.side === "buy" ? "text-green-400" : "text-red-400"}`}>
                    {t.side.toUpperCase()}
                  </td>
                  <td className="px-4 py-3">{t.qty}</td>
                  <td className="px-4 py-3 text-[var(--muted)]">{t.status}</td>
                  <td className="px-4 py-3">
                    <span className={t.is_paper ? "text-amber-400" : "text-red-400 font-semibold"}>
                      {t.is_paper ? "Paper" : "⚠️ LIVE"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--muted)]">
                    {new Date(t.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Agent runs */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Agent Runs</h2>
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--card-border)]">
              <tr className="text-[var(--muted)] text-xs">
                <th className="text-left px-4 py-3">Agent</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Tokens</th>
                <th className="text-left px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {(agentRuns ?? []).map((r) => (
                <tr key={r.id} className="border-b border-[var(--card-border)] last:border-0">
                  <td className="px-4 py-3 capitalize">{r.agent}</td>
                  <td className={`px-4 py-3 ${r.status === "completed" ? "text-green-400" : r.status === "failed" ? "text-red-400" : "text-amber-400"}`}>
                    {r.status}
                  </td>
                  <td className="px-4 py-3 text-[var(--muted)]">{r.tokens_used ?? "—"}</td>
                  <td className="px-4 py-3 text-[var(--muted)]">
                    {new Date(r.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
