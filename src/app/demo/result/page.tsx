import type { Metadata } from "next";
import { Suspense } from "react";
import DemoResultClient from "./DemoResultClient";

export const metadata: Metadata = {
  title: "Demo Result",
  description:
    "Formatted Elexa AI Trading demo simulation result with research plan, risk notes and next action.",
};

export default function DemoResultPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto px-6 py-20">
          <section className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-8 text-center">
            <h1 className="text-3xl font-bold mb-4">Loading demo result...</h1>
            <p className="text-[var(--muted)]">
              Preparing your formatted Elexa research preview.
            </p>
          </section>
        </div>
      }
    >
      <DemoResultClient />
    </Suspense>
  );
}
