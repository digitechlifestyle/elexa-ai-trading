"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to console — server logs already capture via withApi wrapper
    console.error("Client error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="text-6xl mb-6">⚠️</div>
        <h1 className="text-2xl font-bold mb-3">Something went wrong</h1>
        <p className="text-[var(--muted)] mb-6">
          We encountered an unexpected error. Our system has been notified.
        </p>
        {error.digest && (
          <p className="text-xs text-[var(--muted)] mb-6 font-mono">
            Error ref: {error.digest}
          </p>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-lg font-semibold text-sm transition-colors"
          >
            Try again
          </button>
          <Link
            href="/"
            className="border border-[var(--card-border)] hover:border-indigo-600 text-white px-6 py-2.5 rounded-lg font-semibold text-sm transition-colors"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
