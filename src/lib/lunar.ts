/**
 * Lunar phase calculator + Gann seasonality helpers.
 * Deterministic math — no API calls.
 */

// Known new moon: 2000-01-06 18:14 UTC = JD 2451550.0917
const REFERENCE_NEW_MOON_MS = Date.UTC(2000, 0, 6, 18, 14, 0);
const SYNODIC_MONTH_MS = 29.530588853 * 86400 * 1000;

export type Phase =
  | "new"
  | "waxing_crescent"
  | "first_quarter"
  | "waxing_gibbous"
  | "full"
  | "waning_gibbous"
  | "last_quarter"
  | "waning_crescent";

export interface LunarInfo {
  date: string;
  phase: Phase;
  phase_emoji: string;
  illumination_pct: number; // 0-100
  days_since_new: number;
  days_until_next_phase: number;
  age_pct: number; // 0-1 through synodic cycle
}

const PHASE_EMOJI: Record<Phase, string> = {
  new: "🌑",
  waxing_crescent: "🌒",
  first_quarter: "🌓",
  waxing_gibbous: "🌔",
  full: "🌕",
  waning_gibbous: "🌖",
  last_quarter: "🌗",
  waning_crescent: "🌘",
};

function phaseFromAge(age: number): Phase {
  // age is fraction 0-1 of synodic cycle from new moon
  if (age < 0.03 || age >= 0.97) return "new";
  if (age < 0.22) return "waxing_crescent";
  if (age < 0.28) return "first_quarter";
  if (age < 0.47) return "waxing_gibbous";
  if (age < 0.53) return "full";
  if (age < 0.72) return "waning_gibbous";
  if (age < 0.78) return "last_quarter";
  return "waning_crescent";
}

export function lunarInfoFor(date: Date = new Date()): LunarInfo {
  const ms = date.getTime() - REFERENCE_NEW_MOON_MS;
  const age = ((ms % SYNODIC_MONTH_MS) + SYNODIC_MONTH_MS) % SYNODIC_MONTH_MS;
  const ageFrac = age / SYNODIC_MONTH_MS;
  const phase = phaseFromAge(ageFrac);

  // Illumination — approximation via 0.5 * (1 - cos(2π * age))
  const illumination = 0.5 * (1 - Math.cos(2 * Math.PI * ageFrac));

  // Days until next major phase (new, first quarter, full, last quarter)
  const major = [0, 0.25, 0.5, 0.75, 1];
  let nextDays = Infinity;
  for (const m of major) {
    let delta = m - ageFrac;
    if (delta <= 0) delta += 1;
    const days = (delta * SYNODIC_MONTH_MS) / 86400000;
    if (days < nextDays) nextDays = days;
  }

  return {
    date: date.toISOString().slice(0, 10),
    phase,
    phase_emoji: PHASE_EMOJI[phase],
    illumination_pct: Math.round(illumination * 100),
    days_since_new: age / 86400000,
    days_until_next_phase: nextDays,
    age_pct: ageFrac,
  };
}

/** Phases for next N days. */
export function upcomingPhases(daysAhead = 30): LunarInfo[] {
  const out: LunarInfo[] = [];
  const today = new Date();
  for (let i = 0; i < daysAhead; i++) {
    const d = new Date(today.getTime() + i * 86400000);
    out.push(lunarInfoFor(d));
  }
  return out;
}

/** Find dates of upcoming full + new moons. */
export function nextMajorMoons(daysAhead = 60): {
  type: "new" | "full";
  date: string;
}[] {
  const out: { type: "new" | "full"; date: string }[] = [];
  const today = new Date();
  let prev = phaseFromAge(((today.getTime() - REFERENCE_NEW_MOON_MS) % SYNODIC_MONTH_MS) / SYNODIC_MONTH_MS);
  for (let i = 1; i < daysAhead; i++) {
    const d = new Date(today.getTime() + i * 86400000);
    const info = lunarInfoFor(d);
    if (info.phase === "new" && prev !== "new") out.push({ type: "new", date: info.date });
    if (info.phase === "full" && prev !== "full") out.push({ type: "full", date: info.date });
    prev = info.phase;
  }
  return out;
}

/** W.D. Gann seasonality bias — generalised tendencies, not predictions. */
export interface GannSeasonality {
  month: string;
  bias: "bullish" | "bearish" | "neutral";
  note: string;
}

const GANN_BIAS: GannSeasonality[] = [
  { month: "January", bias: "bullish", note: "January Effect — small caps often outperform" },
  { month: "February", bias: "neutral", note: "Often choppy; second half historically weak" },
  { month: "March", bias: "bullish", note: "Quarter-end window-dressing" },
  { month: "April", bias: "bullish", note: "Historically the strongest month for DJIA" },
  { month: "May", bias: "bearish", note: "Sell in May — start of weaker season" },
  { month: "June", bias: "neutral", note: "Mixed; mid-year balancing" },
  { month: "July", bias: "bullish", note: "Earnings season often supportive" },
  { month: "August", bias: "bearish", note: "Low-volume drift, vacation lull" },
  { month: "September", bias: "bearish", note: "Historically worst month for equities" },
  { month: "October", bias: "neutral", note: "Volatile; many historic crashes but also bottoms" },
  { month: "November", bias: "bullish", note: "Start of 'best six months' Nov-Apr" },
  { month: "December", bias: "bullish", note: "Santa Claus rally typically last 5 sessions" },
];

export function gannBiasFor(date: Date = new Date()): GannSeasonality {
  return GANN_BIAS[date.getMonth()];
}

export function allGannBias(): GannSeasonality[] {
  return GANN_BIAS;
}
