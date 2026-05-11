"use client";

import { useEffect, useState } from "react";

interface ReferralInfo {
  code: string;
  referred: {
    id: string;
    email: string | null;
    created_at: string;
    active: boolean;
  }[];
  total_referrals: number;
  active_referrals: number;
  reward_threshold: number;
  earned_rewards: number;
  next_reward_in: number;
}

export default function ReferralsClient({
  code,
  link,
}: {
  code: string;
  link: string;
}) {
  const [info, setInfo] = useState<ReferralInfo | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/referrals")
      .then((r) => r.json())
      .then((d) => setInfo(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: prompt
      prompt("Copy your link:", link);
    }
  }

  function shareTwitter() {
    const text = `I'm researching AI-powered paper trading on Elexa. Join me — 6 AI agents propose trades, validate risk, and journal every decision. Free to start.`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`,
      "_blank"
    );
  }

  function shareLinkedIn() {
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`,
      "_blank"
    );
  }

  function shareEmail() {
    const subject = "Try Elexa AI Trading (free paper trading)";
    const body = `Hey,\n\nI've been using Elexa AI Trading — paper trading research platform with AI agents. Thought you might like it. Sign up here:\n\n${link}\n\nIt's free.`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">Refer friends, earn free months</h1>
        <p className="text-[var(--muted)] text-sm">
          For every 3 friends who sign up <strong>and place a trade</strong>,
          you earn a free month of any paid plan. (Stripe coupon application
          coming soon.)
        </p>
      </div>

      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 space-y-4">
        <h2 className="font-semibold">Your link</h2>
        <div className="flex gap-2 items-center">
          <input
            value={link}
            readOnly
            className="flex-1 bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2.5 text-sm font-mono"
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <button
            onClick={copyLink}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-lg font-semibold text-sm whitespace-nowrap"
          >
            {copied ? "✓ Copied" : "Copy link"}
          </button>
        </div>
        <p className="text-xs text-[var(--muted)]">
          Your code: <span className="font-mono font-semibold">{code}</span>
        </p>
        <div className="flex flex-wrap gap-2 pt-2">
          <button
            onClick={shareTwitter}
            className="bg-[var(--background)] border border-[var(--card-border)] hover:border-indigo-600 text-sm px-3 py-2 rounded-lg"
          >
            𝕏 Share on Twitter
          </button>
          <button
            onClick={shareLinkedIn}
            className="bg-[var(--background)] border border-[var(--card-border)] hover:border-indigo-600 text-sm px-3 py-2 rounded-lg"
          >
            💼 LinkedIn
          </button>
          <button
            onClick={shareEmail}
            className="bg-[var(--background)] border border-[var(--card-border)] hover:border-indigo-600 text-sm px-3 py-2 rounded-lg"
          >
            ✉️ Email
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Total referrals" value={info?.total_referrals ?? "…"} />
        <Stat label="Active (placed trade)" value={info?.active_referrals ?? "…"} tone="good" />
        <Stat label="Free months earned" value={info?.earned_rewards ?? "…"} tone="good" />
        <Stat label="Next reward in" value={info ? `${info.next_reward_in} more` : "…"} />
      </div>

      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
        <h2 className="font-semibold mb-4">Your referrals</h2>
        {loading ? (
          <p className="text-sm text-[var(--muted)]">Loading…</p>
        ) : !info || info.referred.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            No referrals yet. Share your link to start earning.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-xs text-[var(--muted)] border-b border-[var(--card-border)]">
              <tr>
                <th className="text-left py-2 px-2">Email</th>
                <th className="text-left py-2 px-2">Joined</th>
                <th className="text-left py-2 px-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {info.referred.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-[var(--card-border)] last:border-0"
                >
                  <td className="py-2 px-2">{r.email ?? "—"}</td>
                  <td className="py-2 px-2 text-[var(--muted)] text-xs">
                    {new Date(r.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-2 px-2">
                    {r.active ? (
                      <span className="bg-green-950 text-green-400 text-xs px-2 py-0.5 rounded">
                        Active
                      </span>
                    ) : (
                      <span className="bg-amber-950 text-amber-400 text-xs px-2 py-0.5 rounded">
                        Signed up
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: "good";
}) {
  return (
    <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4">
      <p className="text-xs text-[var(--muted)] mb-1">{label}</p>
      <p className={`text-xl font-bold ${tone === "good" ? "text-green-400" : ""}`}>
        {value}
      </p>
    </div>
  );
}
