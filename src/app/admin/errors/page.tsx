import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

interface SystemError {
  id: string;
  message: string;
  stack: string | null;
  route: string | null;
  user_id: string | null;
  request_id: string | null;
  context: Record<string, unknown> | null;
  created_at: string;
}

export default async function ErrorsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "owner"].includes(profile.role)) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        <h1 className="text-2xl font-bold mb-3">Access Denied</h1>
        <p className="text-[var(--muted)]">
          Admin access required.
        </p>
      </div>
    );
  }

  const admin = await createAdminClient();
  const { data: errors } = await admin
    .from("system_errors")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  const list: SystemError[] = (errors ?? []) as SystemError[];

  // Group by route + message for top offenders
  const groups = new Map<string, { count: number; latest: string; route: string; message: string }>();
  for (const e of list) {
    const key = `${e.route ?? "?"} | ${e.message.slice(0, 100)}`;
    const cur = groups.get(key) ?? {
      count: 0,
      latest: e.created_at,
      route: e.route ?? "?",
      message: e.message,
    };
    cur.count++;
    if (e.created_at > cur.latest) cur.latest = e.created_at;
    groups.set(key, cur);
  }
  const topErrors = Array.from(groups.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Error Dashboard</h1>
        <Link href="/admin" className="text-sm text-indigo-400 hover:underline">
          ← Back to admin
        </Link>
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-4">
          Top error groups (last 100)
        </h2>
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl overflow-hidden">
          {topErrors.length === 0 ? (
            <p className="p-6 text-[var(--muted)] text-sm">No errors logged yet. 🎉</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-[var(--card-border)]">
                <tr className="text-[var(--muted)] text-xs">
                  <th className="text-left px-4 py-3">Count</th>
                  <th className="text-left px-4 py-3">Route</th>
                  <th className="text-left px-4 py-3">Message</th>
                  <th className="text-left px-4 py-3">Latest</th>
                </tr>
              </thead>
              <tbody>
                {topErrors.map((g, i) => (
                  <tr key={i} className="border-b border-[var(--card-border)] last:border-0">
                    <td className="px-4 py-3 font-semibold">{g.count}</td>
                    <td className="px-4 py-3 text-[var(--muted)] font-mono text-xs">{g.route}</td>
                    <td className="px-4 py-3 max-w-xl truncate">{g.message}</td>
                    <td className="px-4 py-3 text-[var(--muted)] text-xs">
                      {new Date(g.latest).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Recent errors</h2>
        <div className="space-y-3">
          {list.length === 0 && (
            <p className="text-[var(--muted)] text-sm">No errors. 🎉</p>
          )}
          {list.slice(0, 30).map((e) => (
            <details
              key={e.id}
              className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4"
            >
              <summary className="cursor-pointer flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{e.message}</p>
                  <p className="text-xs text-[var(--muted)] mt-1">
                    <span className="font-mono">{e.route ?? "—"}</span>
                    {" · "}
                    {new Date(e.created_at).toLocaleString()}
                    {e.request_id && ` · req=${e.request_id}`}
                  </p>
                </div>
              </summary>
              {e.stack && (
                <pre className="mt-3 p-3 bg-[var(--background)] rounded text-xs overflow-auto text-[var(--muted)] whitespace-pre-wrap">
                  {e.stack}
                </pre>
              )}
              {e.context && Object.keys(e.context).length > 0 && (
                <pre className="mt-3 p-3 bg-[var(--background)] rounded text-xs overflow-auto text-[var(--muted)] whitespace-pre-wrap">
                  {JSON.stringify(e.context, null, 2)}
                </pre>
              )}
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
