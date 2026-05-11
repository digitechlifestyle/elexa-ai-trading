import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import OnboardingWizard from "./OnboardingWizard";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // If already completed, send straight to dashboard
  if (user.user_metadata?.onboarding_completed_at) {
    redirect("/dashboard");
  }

  return <OnboardingWizard email={user.email ?? ""} />;
}
