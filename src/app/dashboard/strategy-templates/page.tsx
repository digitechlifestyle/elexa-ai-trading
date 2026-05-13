import { TEMPLATES } from "@/lib/strategy-templates";

export default function StrategyTemplatesPage() {
  const byCat = TEMPLATES.reduce((acc, t) => {
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category].push(t);
    return acc;
  }, {} as Record<string, typeof TEMPLATES>);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">📚 Strategy Templates</h1>
        <p className="text-[var(--muted)] text-sm">
          Battle-tested rule sets. Read pros + cons, then test in Backtest before risking capital.
        </p>
      </div>

      {Object.entries(byCat).map(([cat, items]) => (
        <div key={cat} className="space-y-3">
          <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wide">{cat}</h2>
          <div className="grid gap-3">
            {items.map((t) => (
              <div key={t.id} className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5">
                <div className="flex justify-between items-start gap-3 flex-wrap mb-2">
                  <h3 className="text-lg font-bold">{t.name}</h3>
                  <span className="text-xs bg-[var(--background)] border border-[var(--card-border)] rounded px-2 py-1">{t.category}</span>
                </div>
                <p className="text-sm text-[var(--muted)] mb-4">{t.description}</p>

                <div className="grid sm:grid-cols-2 gap-3 mb-4">
                  <div className="bg-green-950/40 border border-green-900 rounded-lg p-3 text-xs">
                    <p className="font-semibold text-green-400 mb-1">Pros</p>
                    <p className="text-green-200">{t.pros}</p>
                  </div>
                  <div className="bg-red-950/40 border border-red-900 rounded-lg p-3 text-xs">
                    <p className="font-semibold text-red-400 mb-1">Cons</p>
                    <p className="text-red-200">{t.cons}</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-[var(--muted)] mb-1 font-semibold">Entry rules</p>
                    <ul className="space-y-1">
                      {t.rules.entry.map((r, i) => (
                        <li key={i} className="font-mono bg-[var(--background)] border border-[var(--card-border)] rounded px-2 py-1">
                          {r.indicator} {r.op} {r.value}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-[var(--muted)] mb-1 font-semibold">Exit rules</p>
                    <ul className="space-y-1">
                      {t.rules.exit.map((r, i) => (
                        <li key={i} className="font-mono bg-[var(--background)] border border-[var(--card-border)] rounded px-2 py-1">
                          {r.indicator} {r.op} {r.value}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <a href="/dashboard/backtest" className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded font-semibold">
                    Backtest →
                  </a>
                  <a href="/dashboard/strategy-builder" className="text-xs bg-[var(--background)] border border-[var(--card-border)] hover:border-indigo-600 px-3 py-1.5 rounded font-semibold">
                    Open in builder →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">
        ⚠️ Templates are educational. All require parameter tuning, position sizing, and stop discipline. Paper-test first. Research only.
      </div>
    </div>
  );
}
