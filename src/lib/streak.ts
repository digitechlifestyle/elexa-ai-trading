/**
 * Compute consecutive-day activity streak.
 * "Active" = at least one trade or agent run on that calendar day (UTC).
 *
 * Current streak counts back from today (or yesterday if no activity yet today).
 * If neither today nor yesterday has activity, current streak = 0.
 */

function dayKey(iso: string): string {
  return iso.slice(0, 10); // YYYY-MM-DD UTC
}

export function computeStreak(activityDates: string[]): {
  current_streak: number;
  longest_streak: number;
  active_days: number;
  last_active_date: string | null;
} {
  if (activityDates.length === 0) {
    return { current_streak: 0, longest_streak: 0, active_days: 0, last_active_date: null };
  }
  const days = Array.from(new Set(activityDates.map(dayKey))).sort();
  const activeSet = new Set(days);

  // Longest streak — walk sorted days, count consecutive runs
  let longest = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1] + "T00:00:00Z").getTime();
    const cur = new Date(days[i] + "T00:00:00Z").getTime();
    if ((cur - prev) / 86400000 === 1) {
      run++;
      if (run > longest) longest = run;
    } else {
      run = 1;
    }
  }

  // Current streak — count back from today
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  let cursor: string;
  if (activeSet.has(today)) cursor = today;
  else if (activeSet.has(yesterday)) cursor = yesterday;
  else
    return {
      current_streak: 0,
      longest_streak: longest,
      active_days: days.length,
      last_active_date: days[days.length - 1],
    };

  let current = 0;
  while (activeSet.has(cursor)) {
    current++;
    const prev = new Date(cursor + "T00:00:00Z").getTime() - 86400000;
    cursor = new Date(prev).toISOString().slice(0, 10);
  }

  return {
    current_streak: current,
    longest_streak: Math.max(longest, current),
    active_days: days.length,
    last_active_date: days[days.length - 1],
  };
}
