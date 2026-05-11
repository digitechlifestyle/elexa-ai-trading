import { createClient } from "@/lib/supabase/server";
import WatchlistClient from "./WatchlistClient";

export default async function WatchlistPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const list = (user?.user_metadata?.watchlist ?? []) as string[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Watchlist</h1>
        <p className="text-[var(--muted)] text-sm">
          Track symbols without trading them. Prices auto-refresh every 30
          seconds. Charts show last 30 days.
        </p>
      </div>
      <WatchlistClient initial={list.filter((s) => typeof s === "string")} />
    </div>
  );
}
