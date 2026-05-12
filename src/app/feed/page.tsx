import type { Metadata } from "next";
import { createClient as createAdminSdk } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/server";
import { makeShareToken } from "@/lib/share";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Trade Ideas Feed — Public Paper Trades",
  description:
    "Live feed of shared paper trades from Elexa traders. Research only — not financial advice.",
};

interface FeedItem {
  share_token: string;
  display_name: string;
  symbol: string;
  side: "buy" | "sell";
  qty: number;
  filled_price: number | null;
  created_at: string;
  user_pnl_pct: number | null;
}

async function loadFeed(): Promise<FeedItem[]> {
  const admin = createAdminSdk(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  const { data: users } = await admin.auth.admin.listUsers({ perPage: 1000 });

  const optedIn = (users?.users ?? []).filter(
    (u) =>
      u.user_metadata?.public_leaderboard_opt_in &&
      Array.isArray(u.user_metadata?.shared_trade_ids) &&
      (u.user_metadata.shared_trade_ids as string[]).length > 0
  );
  if (optedIn.length === 0) return [];

  const tradeIds = new Set<string>();
  const userByTrade = new Map<string, { id: string; display_name: string }>();
  for (const u of optedIn) {
    const ids = (u.user_metadata!.shared_trade_ids as string[]).slice(0, 20);
    const displayName =
      (u.user_metadata!.display_name as string | undefined) ?? `trader_${u.id.slice(0, 4)}`;
    for (const id of ids) {
      tradeIds.add(id);
      userByTrade.set(id, { id: u.id, display_name: displayName });
    }
  }
  if (tradeIds.size === 0) return [];

  const supabase = await createAdminClient();
  const { data: trades } = await supabase
    .from("trades")
    .select("id, user_id, symbol, side, qty, filled_price, created_at")
    .in("id", Array.from(tradeIds))
    .order("created_at", { ascending: false })
    .limit(60);

  return (trades ?? []).map((t) => {
    const profile = userByTrade.get(t.id);
    return {
      share_token: profile ? makeShareToken(profile.id, t.id) : "",
      display_name: profile?.display_name ?? "trader",
      symbol: t.symbol,
      side: t.side as "buy" | "sell",
      qty: Number(t.qty),
      filled_price: t.filled_price != null ? Number(t.filled_price) : null,
      created_at: t.created_at,
      user_pnl_pct: null,
    };
  });
}

export default async function FeedPage() {
  const items = await loadFeed();

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">📰 Trade Ideas Feed</h1>
        <p className="text-[var(--muted)] text-sm">
          Public paper trades from Elexa traders. Sort by newest. Research only — not financial advice.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-12 text-center">
          <p className="text-[var(--muted)]">
            No trades shared yet. Be the first — sign up and share a trade.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, i) => (
            <Link
              key={`${item.share_token}-${i}`}
              href={`/share/${item.share_token}`}
              className="block bg-[var(--card)] border border-[var(--card-border)] hover:border-indigo-600 rounded-xl p-4 transition-colors"
            >
              <div className="flex justify-between items-start gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">👤</span>
                  <div>
                    <p className="text-sm">
                      <Link
                        href={`/u/${encodeURIComponent(item.display_name)}`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-semibold hover:text-indigo-400"
                      >
                        {item.display_name}
                      </Link>{" "}
                      <span
                        className={
                          item.side === "buy" ? "text-green-400" : "text-red-400"
                        }
                      >
                        {item.side === "buy" ? "bought" : "sold"}
                      </span>{" "}
                      <span className="font-bold">{item.qty}</span>{" "}
                      <span className="font-bold">{item.symbol}</span>
                    </p>
                    <p className="text-xs text-[var(--muted)] mt-1">
                      @ ${item.filled_price != null ? item.filled_price.toFixed(2) : "—"} ·{" "}
                      {new Date(item.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-indigo-400 self-center">View →</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="text-center space-y-3 pt-4 border-t border-[var(--card-border)]">
        <p className="text-[var(--muted)] text-sm">
          Share your own trades + climb the leaderboard.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link
            href="/signup"
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-lg font-semibold"
          >
            Sign Up Free
          </Link>
          <Link
            href="/leaderboard"
            className="border border-[var(--card-border)] hover:border-indigo-600 px-6 py-2.5 rounded-lg font-semibold"
          >
            View Leaderboard
          </Link>
        </div>
      </div>
    </div>
  );
}
