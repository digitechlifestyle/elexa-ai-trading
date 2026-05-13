import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardSidebar from "@/components/DashboardSidebar";
import NotificationsBell from "@/components/NotificationsBell";
import ChatWidget from "@/components/ChatWidget";
import ThemeToggle from "@/components/ThemeToggle";
import KeyboardShortcuts from "@/components/KeyboardShortcuts";
import TickerTape from "@/components/TickerTape";

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
        <TickerTape />
        <div className="border-b border-[var(--card-border)] px-4 md:px-8 py-3 flex justify-end items-center gap-2">
          <span className="hidden md:inline text-xs text-[var(--muted)] mr-2">
            Press <kbd className="bg-[var(--background)] border border-[var(--card-border)] px-1.5 py-0.5 rounded text-[10px] font-mono">⌘ K</kbd> for quick trade · <kbd className="bg-[var(--background)] border border-[var(--card-border)] px-1.5 py-0.5 rounded text-[10px] font-mono">?</kbd> for help
          </span>
          <ThemeToggle />
          <NotificationsBell />
        </div>
        <div className="px-4 md:px-8 py-6 flex-1">{children}</div>
      </div>
      <ChatWidget />
      <KeyboardShortcuts />
    </div>
  );
}
