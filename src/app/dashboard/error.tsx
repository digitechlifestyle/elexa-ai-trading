"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="bg-red-950 border border-red-800 rounded-xl p-6 max-w-xl">
      <h2 className="text-lg font-semibold text-red-300 mb-2">
        Dashboard error
      </h2>
      <p className="text-red-200 text-sm mb-4">
        Something went wrong loading this section.
      </p>
      {error.digest && (
        <p className="text-xs text-red-400 font-mono mb-4">
          Ref: {error.digest}
        </p>
      )}
      <div className="flex gap-3">
        <button
          onClick={() => reset()}
          className="bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded text-sm transition-colors"
        >
          Retry
        </button>
        <Link
          href="/dashboard"
          className="border border-red-700 hover:border-red-500 text-red-200 px-4 py-2 rounded text-sm transition-colors"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
