import EconomicCalendar from "@/components/EconomicCalendar";

export default function CalendarPage() {
  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">📅 Economic Calendar</h1>
        <p className="text-[var(--muted)] text-sm">
          Upcoming high-impact macro events that may move markets. Plan your
          trades around them.
        </p>
      </div>
      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl overflow-hidden">
        <EconomicCalendar height={700} />
      </div>
      <p className="text-xs text-[var(--muted)] text-center">
        Data via TradingView. Forecasts are not predictions. Not financial advice.
      </p>
    </div>
  );
}
