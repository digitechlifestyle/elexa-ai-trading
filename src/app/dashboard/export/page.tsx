export default function ExportPage() {
  const items = [
    { kind: "trades", label: "Trades", desc: "All paper trades — entry, exit, status." },
    { kind: "journal", label: "Journal", desc: "All journal entries with tags." },
    { kind: "agent-runs", label: "Agent runs", desc: "AI agent invocations + outputs." },
  ];
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">📤 Export</h1>
        <p className="text-[var(--muted)] text-sm">
          Download your data as CSV. Open in Excel, Google Sheets, or import to other tools.
        </p>
      </div>
      <div className="grid gap-3">
        {items.map((i) => (
          <a key={i.kind}
            href={`/api/export?kind=${i.kind}`}
            download
            className="bg-[var(--card)] border border-[var(--card-border)] hover:border-indigo-600 rounded-xl p-5 flex justify-between items-center transition-colors">
            <div>
              <p className="font-semibold">{i.label}</p>
              <p className="text-xs text-[var(--muted)]">{i.desc}</p>
            </div>
            <span className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-semibold">
              Download CSV
            </span>
          </a>
        ))}
      </div>
      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">
        ⚠️ CSVs contain your trading history. Treat as personal data.
      </div>
    </div>
  );
}
