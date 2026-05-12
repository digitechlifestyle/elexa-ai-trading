import type { Metadata } from "next";
import Link from "next/link";
import LeaderboardClient from "./LeaderboardClient";

export const metadata: Metadata = {
  title: "Leaderboard — Top Paper Traders",
  description:
    "See the top performing paper traders on Elexa. Research only — past performance does not predict future results.",
};

export default function LeaderboardPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-3">Leaderboard</h1>
        <p className="text-[var(--muted)] max-w-xl mx-auto">
          Top paper traders ranked by realised P&amp;L. Paper trades only. Past
          performance does not predict future results.
        </p>
      </div>

      <LeaderboardClient />

      <div className="mt-12 text-center space-y-3">
        <p className="text-[var(--muted)] text-sm">
          Want to compete? Sign up free, opt in from Settings.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/signup"
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-lg font-semibold"
          >
            Sign Up Free
          </Link>
          <Link
            href="/"
            className="border border-[var(--card-border)] hover:border-indigo-600 px-6 py-2.5 rounded-lg font-semibold"
          >
            Learn More
          </Link>
        </div>
      </div>

      <p className="mt-12 text-xs text-[var(--muted)] text-center">
        Research-only platform. Not financial advice.{" "}
        <Link href="/legal" className="underline">
          Full disclaimer
        </Link>
        .
      </p>
    </div>
  );
}
