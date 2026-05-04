import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot Password",
  robots: { index: false, follow: false },
};

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-8">
        <h1 className="text-2xl font-bold mb-2">Forgot password?</h1>
        <p className="text-[var(--muted)] text-sm mb-8">
          Enter your email and we&apos;ll send you a link to reset your password.
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

        <form action="/api/auth/forgot-password" method="POST" className="space-y-4">
          <div>
            <label className="block text-sm mb-1.5" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-600"
              placeholder="you@example.com"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-lg font-semibold text-sm transition-colors"
          >
            Send reset link
          </button>
        </form>

        <p className="text-center text-xs text-[var(--muted)] mt-6">
          Remember your password?{" "}
          <a href="/login" className="text-indigo-400 hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
