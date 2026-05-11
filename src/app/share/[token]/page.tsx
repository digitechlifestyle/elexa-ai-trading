import type { Metadata } from "next";
import { createClient as createAdminSdk } from "@supabase/supabase-js";
import { parseShareToken } from "@/lib/share";
import { notFound } from "next/navigation";
import Link from "next/link";

interface Trade {
  id: string;
  user_id: string;
  symbol: string;
  side: "buy" | "sell";
  qty: number;
  filled_price: number | null;
  status: string;
  is_paper: boolean;
  created_at: string;
}

async function getSharedTrade(token: string) {
  const parsed = parseShareToken(token);
  if (!parsed) return null;
  const admin = createAdminSdk(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Check that the trade is in the user's shared list
  const { data: userResp } = await admin.auth.admin.getUserById(parsed.userId);
  const sharedIds = (userResp?.user?.user_metadata?.shared_trade_ids ?? []) as string[];
  if (!Array.isArray(sharedIds) || !sharedIds.includes(parsed.tradeId)) {
    return null;
  }

  const { data: trade } = await admin
    .from("trades")
    .select("*")
    .eq("id", parsed.tradeId)
    .eq("user_id", parsed.userId)
    .single();
  if (!trade) return null;

  const displayName =
    (userResp?.user?.user_metadata?.display_name as string | undefined) ||
    (userResp?.user?.email?.split("@")[0] ?? "an Elexa trader");

  return { trade: trade as Trade, displayName };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const shared = await getSharedTrade(token);
  if (!shared) return { title: "Trade not found" };
  const { trade, displayName } = shared;
  const title = `${displayName} ${trade.side === "buy" ? "bought" : "sold"} ${trade.qty} ${trade.symbol}`;
  return {
    title,
    description: `Paper trade on Elexa AI Trading. ${trade.qty} ${trade.symbol} at $${trade.filled_price ?? "—"}. Research only — not financial advice.`,
    openGraph: {
      title,
      description: `Paper-only research. Join Elexa to track your own AI-assisted strategies.`,
    },
  };
}

export default async function SharedTradePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const shared = await getSharedTrade(token);
  if (!shared) notFound();
  const { trade, displayName } = shared;

  const notional =
    trade.filled_price != null
      ? Number(trade.filled_price) * Number(trade.qty)
      : null;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl space-y-6">
        {/* Card */}
        <div className="bg-[var(--card)] border-2 border-indigo-700 rounded-2xl p-8 space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-[var(--muted)] mb-1">Shared by</p>
              <p className="font-semibold">{displayName}</p>
            </div>
            <span className="bg-amber-950 border border-amber-800 text-amber-300 text-xs px-2 py-1 rounded-full">
              Paper Trade
            </span>
          </div>

          <div className="text-center py-4">
            <p className="text-xs text-[var(--muted)] uppercase tracking-wider mb-1">
              {trade.side}
            </p>
            <p className="text-5xl font-bold mb-2">{trade.symbol}</p>
            <p className="text-2xl">
              <span className="text-[var(--muted)]">{trade.qty} @</span>{" "}
              <span className="font-bold">
                ${trade.filled_price != null ? Number(trade.filled_price).toFixed(2) : "—"}
              </span>
            </p>
            {notional != null && (
              <p className="text-sm text-[var(--muted)] mt-2">
                Notional: ${notional.toFixed(2)}
              </p>
            )}
          </div>

          <div className="flex justify-around text-sm pt-4 border-t border-[var(--card-border)]">
            <div>
              <p className="text-xs text-[var(--muted)]">Status</p>
              <p className="font-medium">{trade.status}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--muted)]">Date</p>
              <p className="font-medium">
                {new Date(trade.created_at).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--muted)]">Mode</p>
              <p className="font-medium text-amber-400">
                {trade.is_paper ? "Paper" : "Live"}
              </p>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs leading-relaxed">
          <strong>This is research, not financial advice.</strong> Paper trades
          are simulated. Past performance does not predict future results.
          Trading involves substantial risk of loss.{" "}
          <Link href="/legal" className="underline hover:text-amber-100">
            Full legal disclaimer
          </Link>
          .
        </div>

        {/* CTA */}
        <div className="text-center space-y-3">
          <p className="text-[var(--muted)] text-sm">
            Want to track your own AI-assisted paper trades?
          </p>
          <Link
            href="/signup"
            className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-lg font-semibold"
          >
            Try Elexa AI Trading — Free
          </Link>
          <p className="text-xs text-[var(--muted)]">
            <Link href="/" className="hover:underline">
              elexa-ai-trading.vercel.app
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
