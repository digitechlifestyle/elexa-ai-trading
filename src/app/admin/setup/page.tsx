import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Setup",
  robots: { index: false, follow: false },
};

export default async function AdminSetupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-8">
        <h1 className="text-2xl font-bold mb-2">Admin Setup</h1>
        <p className="text-[var(--muted)] text-sm mb-6">
          One-time tool. Set or reset a user&apos;s password. Requires service role
          key (find in Vercel env vars).
        </p>

        <div className="bg-amber-950 border border-amber-800 text-amber-200 text-xs rounded-lg p-3 mb-6">
          ⚠️ Dev/admin only. Do not share this URL. Service role key never leaves
          your browser unencrypted.
        </div>

        {error && (
          <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-3 py-2 mb-4">
            {error}
          </div>
        )}
        {message && (
          <div className="bg-green-950 border border-green-800 text-green-300 text-sm rounded-lg px-3 py-2 mb-4">
            {message}
          </div>
        )}

        <form action="/api/admin/setup-user" method="POST" className="space-y-4">
          <div>
            <label className="block text-sm mb-1.5" htmlFor="serviceKey">
              Service role key
            </label>
            <input
              id="serviceKey"
              name="serviceKey"
              type="password"
              required
              className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-600 font-mono"
              placeholder="sb_secret_..."
            />
            <p className="text-xs text-[var(--muted)] mt-1">
              Find in Vercel → Settings → Environment Variables → SUPABASE_SERVICE_ROLE_KEY
            </p>
          </div>
          <div>
            <label className="block text-sm mb-1.5" htmlFor="email">
              User email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-600"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm mb-1.5" htmlFor="password">
              New password
            </label>
            <input
              id="password"
              name="password"
              type="text"
              required
              minLength={8}
              className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-600 font-mono"
              placeholder="At least 8 characters"
            />
            <p className="text-xs text-[var(--muted)] mt-1">
              Visible so you can see what you typed.
            </p>
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-lg font-semibold text-sm transition-colors"
          >
            Set password &amp; confirm user
          </button>
        </form>

        <p className="text-center text-xs text-[var(--muted)] mt-6">
          After success → <a href="/login" className="text-indigo-400 hover:underline">Sign in</a>
        </p>
      </div>
    </div>
  );
}
