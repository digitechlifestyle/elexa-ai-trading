import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const nav = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/portfolio", label: "Portfolio" },
  { href: "/dashboard/journal", label: "Journal" },
  { href: "/dashboard/agents", label: "Agents" },
];

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

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-60 border-r border-[var(--card-border)] bg-[var(--card)] flex flex-col p-4 shrink-0">
        <Link
          href="/"
          className="text-lg font-bold text-indigo-400 mb-8 block px-2"
        >
          Elexa AI
        </Link>

        {/* Paper-only badge — always visible */}
        <div className="mb-6 px-2 py-1.5 bg-amber-950 border border-amber-800 rounded-lg text-amber-300 text-xs text-center">
          📄 Paper Trading Mode
        </div>

        <nav className="flex-1 space-y-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-3 py-2 rounded-lg text-sm text-[var(--muted)] hover:bg-[var(--background)] hover:text-white transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-[var(--card-border)] pt-4 mt-4">
          <p className="text-xs text-[var(--muted)] px-2 mb-3 truncate">
            {user.email}
          </p>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="w-full text-left text-xs text-[var(--muted)] hover:text-white px-2 py-1.5 rounded transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-auto">
        <div className="px-8 py-6 flex-1">{children}</div>
      </div>
    </div>
  );
}
