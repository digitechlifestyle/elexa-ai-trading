import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardSidebar from "@/components/DashboardSidebar";
import NotificationsBell from "@/components/NotificationsBell";
import ChatWidget from "@/components/ChatWidget";
import ThemeToggle from "@/components/ThemeToggle";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!user.user_metadata?.onboarding_completed_at) {
    redirect("/onboarding");
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <DashboardSidebar email={user.email ?? ""} />

      <div className="flex-1 flex flex-col overflow-auto">
        <div className="border-b border-[var(--card-border)] px-4 md:px-8 py-3 flex justify-end items-center gap-2">
          <ThemeToggle />
          <NotificationsBell />
        </div>
        <div className="px-4 md:px-8 py-6 flex-1">{children}</div>
      </div>
      <ChatWidget />
    </div>
  );
}
