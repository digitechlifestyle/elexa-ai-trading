import { createClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/observability/api-handler";
import { NextRequest, NextResponse } from "next/server";

const HALVING_DATES = [
  "2012-11-28",
  "2016-07-09",
  "2020-05-11",
  "2024-04-20",
  "2028-04-15", // estimate; updates if next halving differs
];
const BLOCKS_PER_HALVING = 210_000;
const TARGET_BLOCK_TIME_SEC = 600;

export const GET = withApi(async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch current block height + price from public APIs
  const [heightRes, priceRes] = await Promise.all([
    fetch("https://blockchain.info/q/getblockcount", { cache: "no-store" }),
    fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd", { cache: "no-store" }),
  ]);

  const height = heightRes.ok ? Number(await heightRes.text()) : null;
  const priceJson = priceRes.ok ? await priceRes.json() : null;
  const btcPrice = priceJson?.bitcoin?.usd ?? null;

  // Find current halving epoch
  const now = new Date();
  let lastHalvingIdx = HALVING_DATES.length - 1;
  for (let i = HALVING_DATES.length - 1; i >= 0; i--) {
    if (new Date(HALVING_DATES[i]) <= now) { lastHalvingIdx = i; break; }
  }
  const lastHalving = HALVING_DATES[lastHalvingIdx];
  const nextHalving = HALVING_DATES[lastHalvingIdx + 1] ?? null;

  const daysSinceHalving = Math.floor((now.getTime() - new Date(lastHalving).getTime()) / 86400000);
  const daysToHalving = nextHalving
    ? Math.floor((new Date(nextHalving).getTime() - now.getTime()) / 86400000)
    : null;

  // Block subsidy: 50, 25, 12.5, 6.25, 3.125 ...
  const blockReward = 50 / Math.pow(2, lastHalvingIdx);
  // Halving block heights: 210k, 420k, 630k, 840k, 1050k
  const lastHalvingBlock = (lastHalvingIdx) * BLOCKS_PER_HALVING;
  const nextHalvingBlock = (lastHalvingIdx + 1) * BLOCKS_PER_HALVING;
  const blocksToHalving = height != null ? nextHalvingBlock - height : null;
  const estDaysToHalvingByBlocks = blocksToHalving != null
    ? Math.floor((blocksToHalving * TARGET_BLOCK_TIME_SEC) / 86400)
    : null;

  // Cycle position: typical BTC bull peak ~12-18 months after halving
  const cycleProgress = nextHalving
    ? daysSinceHalving / ((new Date(nextHalving).getTime() - new Date(lastHalving).getTime()) / 86400000)
    : null;

  let phase = "Unknown";
  let phaseColor = "text-[var(--muted)]";
  if (daysSinceHalving < 180) { phase = "Post-halving consolidation"; phaseColor = "text-amber-400"; }
  else if (daysSinceHalving < 540) { phase = "Bull phase (typical)"; phaseColor = "text-green-400"; }
  else if (daysSinceHalving < 900) { phase = "Late bull / distribution"; phaseColor = "text-orange-400"; }
  else if (daysSinceHalving < 1200) { phase = "Bear / accumulation"; phaseColor = "text-red-400"; }
  else { phase = "Pre-halving consolidation"; phaseColor = "text-amber-400"; }

  return NextResponse.json({
    height,
    btc_price: btcPrice,
    last_halving: lastHalving,
    next_halving: nextHalving,
    days_since_halving: daysSinceHalving,
    days_to_halving: daysToHalving,
    est_days_to_halving_by_blocks: estDaysToHalvingByBlocks,
    blocks_to_halving: blocksToHalving,
    block_reward_btc: blockReward,
    next_block_reward_btc: blockReward / 2,
    cycle_progress_pct: cycleProgress != null ? cycleProgress * 100 : null,
    phase, phase_color: phaseColor,
    last_halving_block: lastHalvingBlock,
    next_halving_block: nextHalvingBlock,
  });
});
