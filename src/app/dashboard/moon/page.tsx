import {
  lunarInfoFor,
  upcomingPhases,
  nextMajorMoons,
  allGannBias,
  gannBiasFor,
} from "@/lib/lunar";

export default function MoonPage() {
  const now = lunarInfoFor();
  const upcoming = upcomingPhases(30);
  const majors = nextMajorMoons(60);
  const gann = allGannBias();
  const thisMonthGann = gannBiasFor();
  const currentMonthIdx = new Date().getMonth();

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">🌙 Lunar &amp; Gann Cycles</h1>
        <p className="text-[var(--muted)] text-sm">
          Lunar phase + W.D. Gann seasonal bias. Historical tendencies — not
          predictions. Use as one input among many.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 text-center">
          <div className="text-6xl mb-2">{now.phase_emoji}</div>
          <p className="text-lg font-bold capitalize">
            {now.phase.replace(/_/g, " ")}
          </p>
          <p className="text-sm text-[var(--muted)] mt-1">
            {now.illumination_pct}% illuminated
          </p>
        </div>
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
          <p className="text-xs text-[var(--muted)] mb-1">Days since new moon</p>
          <p className="text-3xl font-bold">{now.days_since_new.toFixed(1)}</p>
          <p className="text-xs text-[var(--muted)] mt-2">
            Synodic age: {(now.age_pct * 100).toFixed(1)}%
          </p>
        </div>
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
          <p className="text-xs text-[var(--muted)] mb-1">Next major phase in</p>
          <p className="text-3xl font-bold">
            {now.days_until_next_phase.toFixed(1)}d
          </p>
          <p className="text-xs text-[var(--muted)] mt-2">
            Volatility often clusters near new/full
          </p>
        </div>
      </div>

      <section className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
        <h2 className="font-semibold mb-4">Next 60 days — major moons</h2>
        {majors.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">None in window.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {majors.map((m, i) => (
              <li
                key={i}
                className="flex justify-between border-b border-[var(--card-border)] last:border-0 py-1.5"
              >
                <span>{m.type === "new" ? "🌑 New moon" : "🌕 Full moon"}</span>
                <span className="text-[var(--muted)]">
                  {new Date(m.date).toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
        <h2 className="font-semibold mb-4">30-day phase strip</h2>
        <div className="flex gap-1 overflow-x-auto">
          {upcoming.map((p, i) => (
            <div
              key={i}
              className="flex-shrink-0 text-center"
              title={`${p.date} — ${p.phase}`}
            >
              <div className="text-2xl">{p.phase_emoji}</div>
              <div className="text-[10px] text-[var(--muted)]">
                {new Date(p.date).getDate()}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-indigo-950 border border-indigo-700 rounded-xl p-6">
        <h2 className="font-semibold mb-3">
          📜 This month: {thisMonthGann.month}
        </h2>
        <p className="text-sm">
          <span
            className={`font-bold ${
              thisMonthGann.bias === "bullish"
                ? "text-green-400"
                : thisMonthGann.bias === "bearish"
                ? "text-red-400"
                : "text-amber-400"
            }`}
          >
            {thisMonthGann.bias.toUpperCase()}
          </span>{" "}
          historical bias — {thisMonthGann.note}
        </p>
      </section>

      <section className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
        <h2 className="font-semibold mb-4">W.D. Gann seasonal bias — full year</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {gann.map((g, i) => (
            <div
              key={g.month}
              className={`border rounded-lg p-3 ${
                i === currentMonthIdx
                  ? "border-indigo-500 bg-indigo-950"
                  : "border-[var(--card-border)] bg-[var(--background)]"
              }`}
            >
              <p className="font-semibold text-sm">{g.month}</p>
              <p
                className={`text-xs font-bold mt-1 ${
                  g.bias === "bullish"
                    ? "text-green-400"
                    : g.bias === "bearish"
                    ? "text-red-400"
                    : "text-amber-400"
                }`}
              >
                {g.bias.toUpperCase()}
              </p>
              <p className="text-xs text-[var(--muted)] mt-1 leading-relaxed">
                {g.note}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">
        ⚠️ Lunar and seasonal data are descriptive of historical tendencies, not
        predictions. Past patterns do not guarantee future outcomes. Use only as
        one input in a broader research process. Not financial advice.
      </div>
    </div>
  );
}
