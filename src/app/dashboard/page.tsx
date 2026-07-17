import { createClient } from "@/lib/supabase/server";
import { computeStreak } from "@/lib/streak";

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

  // Streak — pull last 90 days of activity for snappy compute.
  // async Server Component: runs once per request server-side, not subject
  // to client render-purity/memoization rules (no hooks available here).
  // eslint-disable-next-line react-hooks/purity
  const since90 = new Date(Date.now() - 90 * 86400 * 1000).toISOString();
    const [allTrades, allAgents] = await Promise.all([
          supabase
            .from("trades")
            .select("created_at")
            .eq("user_id", user!.id)
            .gte("created_at", since90),
          supabase
            .from("agent_runs")
            .select("created_at")
            .eq("user_id", user!.id)
            .gte("created_at", since90),
        ]);

  const streak = computeStreak([
        ...((allTrades.data ?? []).map((r) => r.created_at)),
        ...((allAgents.data ?? []).map((r) => r.created_at)),
      ]);

  const briefing = user?.user_metadata?.daily_briefing as
        | { content: string; generated_at: string }
    | undefined;

  const weekly = user?.user_metadata?.weekly_review as
        | { content: string; generated_at: string; trades_count: number; realised_pnl: number }
    | undefined;

  return (
        <div className="space-y-8">
              <div>
                      <h1 className="text-2xl font-bold mb-1">Dashboard</h1>h1>
                      <p className="text-[var(--muted)] text-sm">
                                Paper trading research — simulated environment only
                      </p>p>
              </div>div>
        
          {(recentTrades?.length ?? 0) === 0 && (
                  <div className="bg-indigo-950 border border-indigo-700 rounded-xl p-6 flex justify-between items-center gap-4 flex-wrap">
                            <div>
                                        <h2 className="font-semibold mb-1">👋 New here? Try the demo first.</h2>h2>
                                        <p className="text-sm text-indigo-200">
                                                      Populate your dashboard with sample trades so equity curve, trade stats, and AI summaries have data to work with.
                                        </p>p>
                            </div>div>
                            <a
                                          href="/dashboard/demo"
                                          className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap"
                                        >
                                        Seed demo data →
                            </a>a>
                  </div>div>
              )}
        
          {briefing?.content && (
                  <div className="bg-indigo-950 border border-indigo-700 rounded-xl p-6">
                            <div className="flex justify-between items-start mb-3 gap-4 flex-wrap">
                                        <h2 className="font-semibold flex items-center gap-2">
                                                      👔 CEO Agent — Daily Briefing
                                        </h2>h2>
                                        <span className="text-xs text-indigo-300">
                                          {new Date(briefing.generated_at).toLocaleString()}
                                        </span>span>
                            </div>div>
                            <pre className="text-sm whitespace-pre-wrap leading-relaxed text-indigo-100 font-sans">
                              {briefing.content}
                            </pre>pre>
                  </div>div>
              )}
        
          {weekly?.content && (
                  <details className="bg-purple-950 border border-purple-700 rounded-xl p-6">
                            <summary className="cursor-pointer flex justify-between items-center gap-4 flex-wrap">
                                        <h2 className="font-semibold flex items-center gap-2">
                                                      📋 Weekly Review — {weekly.trades_count} trades · {" "}
                                                      <span
                                                                        className={
                                                                                            weekly.realised_pnl >= 0 ? "text-green-400" : "text-red-400"
                                                                        }
                                                                      >
                                                        {weekly.realised_pnl >= 0 ? "+" : ""}${weekly.realised_pnl.toFixed(2)}
                                                      </span>span>
                                        </h2>h2>
                                        <span className="text-xs text-purple-300">
                                          {new Date(weekly.generated_at).toLocaleDateString()}
                                        </span>span>
                            </summary>summary>
                            <pre className="text-sm whitespace-pre-wrap leading-relaxed text-purple-100 font-sans mt-4">
                              {weekly.content}
                            </pre>pre>
                  </details>details>
              )}
        
          {/* Stats row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
          {
                        label: "🔥 Streak",
                        value: streak.current_streak > 0 ? `${streak.current_streak} days` : "—",
          },
          { label: "Paper Trades", value: recentTrades?.length ?? 0 },
          { label: "Agent Runs", value: agentRuns?.length ?? 0 },
          { label: "Mode", value: "Paper" },
                  ].map((s) => (
                              <div
                                            key={s.label}
                                            className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4"
                                          >
                                          <p className="text-xs text-[var(--muted)] mb-1">{s.label}</p>p>
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
                                          </p>p>
                              </div>div>
                            ))}
              </div>div>
        
          {/* Recent trades */}
              <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
                      <h2 className="font-semibold mb-4">Recent Paper Trades</h2>h2>
                {!recentTrades || recentTrades.length === 0 ? (
                    <p className="text-[var(--muted)] text-sm">
                                No paper trades yet. Head to Portfolio to place your first
                                simulated trade.
                    </p>p>
                  ) : (
                    <div className="space-y-2">
                      {recentTrades.map((t) => (
                                    <div
                                                      key={t.id}
                                                      className="grid grid-cols-[1fr_70px_100px_80px] gap-2 items-center text-sm py-2 border-b border-[var(--card-border)] last:border-0"
                                                    >
                                                    <span className="font-medium">{t.symbol}</span>span>
                                                    <span
                                                                        className={t.side === "buy" ? "text-green-400" : "text-red-400"}
                                                                      >
                                                      {t.side.toUpperCase()}
                                                    </span>span>
                                                    <span className="text-[var(--muted)] text-right">{t.qty} shares</span>span>
                                                    <span className="text-[var(--muted)] text-right">{t.status}</span>span>
                                    </div>div>
                                  ))}
                    </div>div>
                      )}
              </div>div>
        
          {/* Recent agent runs */}
              <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
                      <h2 className="font-semibold mb-4">Recent Agent Activity</h2>h2>
                {!agentRuns || agentRuns.length === 0 ? (
                    <p className="text-[var(--muted)] text-sm">
                                No agent runs yet. Visit the Agents tab to trigger analysis.
                    </p>p>
                  ) : (
                    <div className="space-y-2">
                      {agentRuns.map((r) => (
                                    <div
                                                      key={r.id}
                                                      className="grid grid-cols-[1fr_90px_70px] gap-2 items-center text-sm py-2 border-b border-[var(--card-border)] last:border-0"
                                                    >
                                                    <span className="capitalize font-medium">{r.agent} agent</span>span>
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
                                                    </span>span>
                                                    <span className="text-[var(--muted)] text-xs text-right">
                                                      {new Date(r.created_at).toLocaleTimeString()}
                                                    </span>span>
                                    </div>div>
                                  ))}
                    </div>div>
                      )}
              </div>div>
        </div>div>
      );
}</div>
