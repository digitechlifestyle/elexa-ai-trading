import { createClient } from "@/lib/supabase/server";
import AlertsClient from "./AlertsClient";

interface Alert {
  id: string;
  symbol: string;
  kind: "price_above" | "price_below" | "pnl_above_pct" | "pnl_below_pct";
  value: number;
  created_at: string;
  triggered_at?: string | null;
}

export default async function AlertsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const initial = (user?.user_metadata?.alerts ?? []) as Alert[];
  return <AlertsClient initial={initial} />;
}
