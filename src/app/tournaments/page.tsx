import type { Metadata } from "next";
import Link from "next/link";
import TournamentClient from "./TournamentClient";

export const metadata: Metadata = {
  title: "Monthly Tournaments — Paper Trading Competition",
  description:
    "Compete on Elexa's monthly paper trading leaderboard. Top traders win bragging rights, free Pro months, and profile badges.",
};

export default function TournamentsPage() {
  const now = new Date();
  const thisMonthName = now.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthName = lastMonth.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-10">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">🏆 Monthly Tournaments</h1>
        <p className="text-[var(--muted)] max-w-xl mx-auto">
          Opt-in leaderboard reset each month. Top 3 traders earn badges +
          free Pro months. Paper trading research only — not financial advice.
        </p>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-2xl font-bold">{thisMonthName} — in progress</h2>
          <span className="bg-green-950 border border-green-800 text-green-400 text-xs px-2 py-1 rounded">
            Live
          </span>
        </div>
        <TournamentClient period="this_month" />
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-bold">{lastMonthName} — final</h2>
        <TournamentClient period="last_month" archived />
      </section>

      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 space-y-4">
        <h2 className="font-semibold">Prizes</h2>
        <ul className="space-y-2 text-sm">
          <li>🥇 1st: 6 months Pro free + Champion badge</li>
          <li>🥈 2nd: 3 months Pro free + Silver badge</li>
          <li>🥉 3rd: 1 month Pro free + Bronze badge</li>
          <li>🎖 Top 10: Pro discount + Top 10 badge</li>
        </ul>
        <p className="text-xs text-[var(--muted)]">
          Prizes awarded manually each month while user count is small. Prize
          fulfillment via Stripe coupon. No purchase necessary to compete.
        </p>
      </div>

      <div className="text-center space-y-3 pt-4 border-t border-[var(--card-border)]">
        <p className="text-[var(--muted)] text-sm">
          Not in the running yet? Sign up and opt in from Settings.
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
            All-time Leaderboard
          </Link>
        </div>
      </div>
    </div>
  );
}
