import type { Metadata } from "next";
import { createClient as createAdminSdk } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";

interface UserProfile {
  userId: string;
  display_name: string;
  joined_at: string;
}

interface Stats {
  total_pnl: number;
  total_trades: number;
  active_days: number;
  symbols: { symbol: string; pnl: number }[];
  shared_trades: {
    id: string;
    symbol: string;
    side: string;
    qty: number;
    filled_price: number | null;
    created_at: string;
  }[];
}

async function findProfile(name: string): Promise<UserProfile | null> {
  const admin = createAdminSdk(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
  for (const u of data?.users ?? []) {
    const dn = u.user_metadata?.display_name as string | undefined;
    if (
      dn &&
      dn.toLowerCase() === name.toLowerCase() &&
      u.user_metadata?.public_leaderboard_opt_in
    ) {
      return { userId: u.id, display_name: dn, joined_at: u.created_at };
    }
  }
  return null;
}

async function getStats(userId: string): Promise<Stats> {
  const supabase = await createAdminClient();
  const { data: trades } = await supabase
    .from("trades")
    .select("id, symbol, side, qty, filled_price, status, created_at")
    .eq("user_id", userId)
    .eq("status", "filled")
    .eq("is_paper", true);

  const symMap = new Map<string, number>();
  let total = 0;
  const days = new Set<string>();
  for (const t of trades ?? []) {
    const val = Number(t.filled_price ?? 0) * Number(t.qty);
    const sign = t.side === "sell" ? 1 : -1;
    total += sign * val;
    symMap.set(t.symbol, (symMap.get(t.symbol) ?? 0) + sign * val);
    days.add(t.created_at.slice(0, 10));
  }
  const symbols = Array.from(symMap.entries())
    .map(([symbol, pnl]) => ({ symbol, pnl }))
    .sort((a, b) => b.pnl - a.pnl)
    .slice(0, 5);

  // Recent shared trades (from user_metadata.shared_trade_ids)
  const admin = createAdminSdk(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  const { data: userResp } = await admin.auth.admin.getUserById(userId);
  const sharedIds = (userResp?.user?.user_metadata?.shared_trade_ids ?? []) as string[];

  let shared: Stats["shared_trades"] = [];
  if (Array.isArray(sharedIds) && sharedIds.length > 0) {
    const { data: sharedTrades } = await supabase
      .from("trades")
      .select("id, symbol, side, qty, filled_price, created_at")
      .in("id", sharedIds.slice(0, 10))
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);
    shared = sharedTrades ?? [];
  }

  return {
    total_pnl: total,
    total_trades: (trades ?? []).length,
    active_days: days.size,
    symbols,
    shared_trades: shared,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ name: string }>;
}): Promise<Metadata> {
  const { name } = await params;
  const profile = await findProfile(name);
  if (!profile) return { title: "Trader not found" };
  return {
    title: `${profile.display_name} — Paper Trader Profile`,
    description: `Public paper trading profile of ${profile.display_name} on Elexa AI Trading. Research only — not financial advice.`,
  };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const profile = await findProfile(name);
  if (!profile) notFound();

  const stats = await getStats(profile.userId);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      <div className="text-center space-y-2">
        <div className="text-6xl">👤</div>
        <h1 className="text-3xl font-bold">{profile.display_name}</h1>
        <p className="text-sm text-[var(--muted)]">
          Joined {new Date(profile.joined_at).toLocaleDateString()} · Paper trading research
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4">
          <p className="text-xs text-[var(--muted)] mb-1">Realised P&L</p>
          <p
            className={`text-2xl font-bold ${
              stats.total_pnl >= 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {stats.total_pnl >= 0 ? "+" : ""}${stats.total_pnl.toFixed(2)}
          </p>
        </div>
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4">
          <p className="text-xs text-[var(--muted)] mb-1">Total trades</p>
          <p className="text-2xl font-bold">{stats.total_trades}</p>
        </div>
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4">
          <p className="text-xs text-[var(--muted)] mb-1">Active days</p>
          <p className="text-2xl font-bold">{stats.active_days}</p>
        </div>
      </div>

      {stats.symbols.length > 0 && (
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
          <h2 className="font-semibold mb-4">Top symbols by P&L</h2>
          <ul className="space-y-2 text-sm">
            {stats.symbols.map((s) => (
              <li
                key={s.symbol}
                className="flex justify-between border-b border-[var(--card-border)] last:border-0 pb-2"
              >
                <span className="font-medium">{s.symbol}</span>
                <span className={s.pnl >= 0 ? "text-green-400" : "text-red-400"}>
                  {s.pnl >= 0 ? "+" : ""}${s.pnl.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {stats.shared_trades.length > 0 && (
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
          <h2 className="font-semibold mb-4">Recent shared trades</h2>
          <ul className="space-y-2 text-sm">
            {stats.shared_trades.map((t) => (
              <li
                key={t.id}
                className="flex justify-between border-b border-[var(--card-border)] last:border-0 py-2"
              >
                <span>
                  <span
                    className={
                      t.side === "buy" ? "text-green-400" : "text-red-400"
                    }
                  >
                    {t.side.toUpperCase()}
                  </span>{" "}
                  <span className="font-medium">{t.symbol}</span>{" "}
                  <span className="text-[var(--muted)]">
                    {t.qty} @ ${t.filled_price != null ? Number(t.filled_price).toFixed(2) : "—"}
                  </span>
                </span>
                <span className="text-xs text-[var(--muted)]">
                  {new Date(t.created_at).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">
        ⚠️ Paper trades only. Past performance does not predict future results.
        Not financial advice.{" "}
        <Link href="/legal" className="underline">Full disclaimer</Link>.
      </div>

      <div className="text-center space-y-3 pt-4 border-t border-[var(--card-border)]">
        <p className="text-[var(--muted)] text-sm">
          Want to track your own AI-assisted paper trading?
        </p>
        <Link
          href="/signup"
          className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-lg font-semibold"
        >
          Start Free on Elexa
        </Link>
      </div>
    </div>
  );
}
