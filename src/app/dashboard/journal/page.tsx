import { createClient } from "@/lib/supabase/server";

export default async function JournalPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: entries } = await supabase
    .from("journal_entries")
    .select("*, trades(symbol, side, qty, created_at)")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">Trade Journal</h1>
        <p className="text-[var(--muted)] text-sm">
          Log and review notes on your paper trading decisions.
        </p>
      </div>

      {!entries || entries.length === 0 ? (
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-8 text-center">
          <p className="text-[var(--muted)]">No journal entries yet.</p>
          <p className="text-sm text-[var(--muted)] mt-2">
            Place paper trades and add notes to build your research record.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold">{entry.title}</h3>
                <span className="text-xs text-[var(--muted)]">
                  {new Date(entry.created_at).toLocaleDateString()}
                </span>
              </div>
              {entry.trades && (
                <p className="text-xs text-indigo-400 mb-2">
                  Linked: {entry.trades.side?.toUpperCase()} {entry.trades.qty}×{" "}
                  {entry.trades.symbol}
                </p>
              )}
              <p className="text-sm text-[var(--muted)] whitespace-pre-wrap">
                {entry.notes}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
