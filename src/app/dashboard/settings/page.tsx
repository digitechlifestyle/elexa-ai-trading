import { createClient } from "@/lib/supabase/server";
import { getRiskLimitsForUser } from "@/lib/trading/user-limits";
import SettingsForm from "./SettingsForm";
import ProfileForm from "./ProfileForm";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const limits = getRiskLimitsForUser(user!);
  const displayName =
    (user?.user_metadata?.display_name as string | undefined) ?? "";
  const optIn = Boolean(user?.user_metadata?.public_leaderboard_opt_in);

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">Settings</h1>
        <p className="text-[var(--muted)] text-sm">
          Configure your risk limits and public profile.
        </p>
      </div>
      <SettingsForm initial={limits} />
      <ProfileForm initialDisplayName={displayName} initialOptIn={optIn} />
    </div>
  );
}
