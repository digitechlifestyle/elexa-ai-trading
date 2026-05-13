"use client";

import { useState } from "react";

interface Article {
  id?: number;
  headline?: string;
  summary?: string;
  source?: string;
  url?: string;
  created_at?: string;
}

interface NewsResponse {
  symbol: string;
  articles: Article[];
  summary: string | null;
}

const POPULAR = ["AAPL", "MSFT", "NVDA", "TSLA", "BTC", "ETH", "SPY", "GLD"];

export default function NewsClient() {
  const [symbol, setSymbol] = useState("AAPL");
  const [input, setInput] = useState("");
  const [data, setData] = useState<NewsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load(sym: string, withAi: boolean) {
    setLoading(true);
    setErr(null);
    if (withAi) setAiLoading(true);
    try {
      const url = `/api/news?symbol=${encodeURIComponent(sym)}${withAi ? "&summarize=1" : ""}`;
      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok) {
        setErr(json.error ?? "Failed");
      } else {
        setData(json);
      }
    } catch {
      setErr("Network error");
    } finally {
      setLoading(false);
      setAiLoading(false);
    }
  }

  function pick(s: string) {
    setSymbol(s);
    load(s, false);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const s = input.trim().toUpperCase();
    if (!s) return;
    setSymbol(s);
    setInput("");
    load(s, false);
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">📰 News + AI Summary</h1>
        <p className="text-[var(--muted)] text-sm">
          Latest headlines per symbol from Alpaca news feed. Click &quot;AI
          Summary&quot; for Quant Agent take.
        </p>
      </div>

      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4 space-y-3">
        <form onSubmit={submit} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase())}
            placeholder={`Symbol — currently ${symbol}`}
            className="flex-1 bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-600"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-semibold"
          >
            Load
          </button>
        </form>
        <div className="flex gap-1 flex-wrap">
          {POPULAR.map((s) => (
            <button
              key={s}
              onClick={() => pick(s)}
              className={`text-xs px-2.5 py-1.5 rounded ${
                symbol === s
                  ? "bg-indigo-600 text-white"
                  : "bg-[var(--background)] border border-[var(--card-border)] text-[var(--muted)] hover:border-indigo-600"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {err && (
        <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-3 py-2">
          {err}
        </div>
      )}

      {data && (
        <>
          <div className="flex justify-between items-center gap-4 flex-wrap">
            <h2 className="font-semibold">
              {data.articles.length} headlines for {data.symbol}
            </h2>
            <button
              onClick={() => load(symbol, true)}
              disabled={aiLoading || data.articles.length === 0}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-1.5 rounded-lg text-xs font-semibold"
            >
              {aiLoading ? "Summarizing…" : "✨ AI Summary"}
            </button>
          </div>

          {data.summary && (
            <div className="bg-indigo-950 border border-indigo-700 rounded-xl p-5">
              <p className="text-xs text-indigo-300 mb-2">
                📊 Quant Agent summary
              </p>
              <pre className="text-sm whitespace-pre-wrap leading-relaxed text-indigo-100 font-sans">
                {data.summary}
              </pre>
            </div>
          )}

          <div className="space-y-2">
            {data.articles.length === 0 ? (
              <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-8 text-center text-[var(--muted)] text-sm">
                No news for {data.symbol}.
              </div>
            ) : (
              data.articles.map((a) => (
                <a
                  key={a.id}
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-[var(--card)] border border-[var(--card-border)] hover:border-indigo-600 rounded-xl p-4 transition-colors"
                >
                  <div className="flex justify-between items-start gap-3 flex-wrap">
                    <p className="font-medium text-sm flex-1">{a.headline}</p>
                    <span className="text-xs text-[var(--muted)] whitespace-nowrap">
                      {a.source} ·{" "}
                      {a.created_at
                        ? new Date(a.created_at).toLocaleDateString()
                        : ""}
                    </span>
                  </div>
                  {a.summary && (
                    <p className="text-xs text-[var(--muted)] mt-2 leading-relaxed">
                      {a.summary.slice(0, 240)}
                      {a.summary.length > 240 ? "…" : ""}
                    </p>
                  )}
                </a>
              ))
            )}
          </div>
        </>
      )}

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">
        ⚠️ News is one input. AI summary is research-grade — verify any thesis
        independently. Source: Alpaca news API. Not financial advice.
      </div>
    </div>
  );
}
