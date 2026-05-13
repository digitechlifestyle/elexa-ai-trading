"use client";

import { useEffect, useState } from "react";

interface Filing {
  title: string;
  company: string;
  filed_at: string;
  url: string;
  cik: string;
}

export default function InsiderClient() {
  const [filings, setFilings] = useState<Filing[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/insider")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.filings)) setFilings(d.filings);
        else setErr(d.error ?? "No data");
      })
      .catch(() => setErr("Network error"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">🕵 Insider Trading Filings</h1>
        <p className="text-[var(--muted)] text-sm">
          Latest SEC Form 4 filings — corporate insiders disclose their buys
          and sells. Updates every 15 minutes from EDGAR.
        </p>
      </div>

      {err && (
        <div className="bg-red-950 border border-red-800 text-red-300 rounded-xl p-4 text-sm">
          {err}
        </div>
      )}

      {loading ? (
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-12 text-center text-[var(--muted)]">
          Loading SEC EDGAR…
        </div>
      ) : filings.length === 0 ? (
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-12 text-center text-[var(--muted)]">
          No filings.
        </div>
      ) : (
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-[var(--muted)] border-b border-[var(--card-border)]">
                <tr>
                  <th className="text-left py-3 px-4">Company</th>
                  <th className="text-left py-3 px-4">CIK</th>
                  <th className="text-left py-3 px-4">Filed</th>
                  <th className="text-right py-3 px-4">SEC link</th>
                </tr>
              </thead>
              <tbody>
                {filings.map((f, i) => (
                  <tr
                    key={i}
                    className="border-b border-[var(--card-border)] last:border-0"
                  >
                    <td className="py-3 px-4 font-medium">{f.company}</td>
                    <td className="py-3 px-4 text-xs text-[var(--muted)] font-mono">
                      {f.cik}
                    </td>
                    <td className="py-3 px-4 text-xs text-[var(--muted)]">
                      {new Date(f.filed_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <a
                        href={f.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-indigo-400 hover:underline"
                      >
                        Open →
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">
        ⚠️ Insider buys/sells have many motivations (10b5-1 plans, taxes, vesting).
        Not necessarily a directional signal. Source: SEC EDGAR. Research only —
        not financial advice.
      </div>
    </div>
  );
}
