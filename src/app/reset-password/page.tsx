import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset Password",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-8">
        <h1 className="text-2xl font-bold mb-2">Set a new password</h1>
        <p className="text-[var(--muted)] text-sm mb-8">
          Enter your new password below. Must be at least 8 characters.
        </p>

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

        <form action="/api/auth/reset-password" method="POST" className="space-y-4">
          <div>
            <label className="block text-sm mb-1.5" htmlFor="password">
              New password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-600"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-sm mb-1.5" htmlFor="confirm">
              Confirm new password
            </label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-600"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-lg font-semibold text-sm transition-colors"
          >
            Set new password
          </button>
        </form>
      </div>
    </div>
  );
}
