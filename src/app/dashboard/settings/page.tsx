import { createClient } from "@/lib/supabase/server";
import { getRiskLimitsForUser } from "@/lib/trading/user-limits";
import SettingsForm from "./SettingsForm";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const limits = getRiskLimitsForUser(user!);

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">Settings</h1>
        <p className="text-[var(--muted)] text-sm">
          Configure your personal risk limits. These are enforced on every
          paper trade.
        </p>
      </div>
      <SettingsForm initial={limits} />
    </div>
  );
}
