import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: recentTrades } = await supabase
    .from("trades")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: agentRuns } = await supabase
    .from("agent_runs")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(3);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
        <p className="text-[var(--muted)] text-sm">
          Paper trading research — simulated environment only
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Paper Trades", value: recentTrades?.length ?? 0 },
          { label: "Agent Runs", value: agentRuns?.length ?? 0 },
          { label: "Mode", value: "Paper" },
          { label: "Live Trading", value: "Disabled" },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4"
          >
            <p className="text-xs text-[var(--muted)] mb-1">{s.label}</p>
            <p
              className={`text-2xl font-bold ${
                s.value === "Disabled"
                  ? "text-red-400"
                  : s.value === "Paper"
                  ? "text-amber-400"
                  : ""
              }`}
            >
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Recent trades */}
      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
        <h2 className="font-semibold mb-4">Recent Paper Trades</h2>
        {!recentTrades || recentTrades.length === 0 ? (
          <p className="text-[var(--muted)] text-sm">
            No paper trades yet. Head to Portfolio to place your first
            simulated trade.
          </p>
        ) : (
          <div className="space-y-2">
            {recentTrades.map((t) => (
              <div
                key={t.id}
                className="flex justify-between items-center text-sm py-2 border-b border-[var(--card-border)] last:border-0"
              >
                <span className="font-medium">{t.symbol}</span>
                <span
                  className={t.side === "buy" ? "text-green-400" : "text-red-400"}
                >
                  {t.side.toUpperCase()}
                </span>
                <span className="text-[var(--muted)]">{t.qty} shares</span>
                <span className="text-[var(--muted)]">{t.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent agent runs */}
      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
        <h2 className="font-semibold mb-4">Recent Agent Activity</h2>
        {!agentRuns || agentRuns.length === 0 ? (
          <p className="text-[var(--muted)] text-sm">
            No agent runs yet. Visit the Agents tab to trigger analysis.
          </p>
        ) : (
          <div className="space-y-2">
            {agentRuns.map((r) => (
              <div
                key={r.id}
                className="flex justify-between items-center text-sm py-2 border-b border-[var(--card-border)] last:border-0"
              >
                <span className="capitalize font-medium">{r.agent} agent</span>
                <span
                  className={
                    r.status === "completed"
                      ? "text-green-400"
                      : r.status === "failed"
                      ? "text-red-400"
                      : "text-amber-400"
                  }
                >
                  {r.status}
                </span>
                <span className="text-[var(--muted)] text-xs">
                  {new Date(r.created_at).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
