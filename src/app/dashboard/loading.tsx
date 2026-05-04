export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-[var(--card)] rounded animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-32 bg-[var(--card)] border border-[var(--card-border)] rounded-xl animate-pulse"
          />
        ))}
      </div>
      <div className="h-64 bg-[var(--card)] border border-[var(--card-border)] rounded-xl animate-pulse" />
    </div>
  );
}
