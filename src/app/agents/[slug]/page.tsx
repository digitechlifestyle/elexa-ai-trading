import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { agents, getAgent } from "@/lib/agents-data";

export async function generateStaticParams() {
  return agents.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const agent = getAgent(slug);
  if (!agent) return { title: "Agent not found" };
  return {
    title: `${agent.name} — ${agent.tagline}`,
    description: agent.overview.slice(0, 160),
  };
}

export default async function AgentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const agent = getAgent(slug);
  if (!agent) notFound();

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      {/* Back link */}
      <Link
        href="/"
        className="text-indigo-400 hover:text-indigo-300 text-sm mb-8 inline-block"
      >
        ← Back to home
      </Link>

      {/* Header */}
      <div className="mb-12">
        <div className="text-6xl mb-4">{agent.emoji}</div>
        <h1 className="text-4xl md:text-5xl font-bold mb-3">{agent.name}</h1>
        <p className="text-xl text-indigo-400 mb-6">{agent.tagline}</p>
        <p className="text-[var(--muted)] text-base leading-relaxed">
          {agent.role}
        </p>
      </div>

      {/* Overview */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Overview</h2>
        <p className="text-[var(--foreground)] leading-relaxed">
          {agent.overview}
        </p>
      </section>

      {/* Responsibilities */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">What it does</h2>
        <ul className="space-y-2">
          {agent.responsibilities.map((r, i) => (
            <li key={i} className="flex gap-3 text-[var(--foreground)]">
              <span className="text-indigo-400 flex-shrink-0">✓</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* How it works */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">How it works</h2>
        <p className="text-[var(--foreground)] leading-relaxed">
          {agent.howItWorks}
        </p>
      </section>

      {/* Constraints */}
      <section className="mb-12 bg-amber-950 border border-amber-800 rounded-xl p-6">
        <h2 className="text-2xl font-bold mb-4 text-amber-200">
          Hard constraints
        </h2>
        <p className="text-amber-300 text-sm mb-4">
          These are non-negotiable rules this agent operates under:
        </p>
        <ul className="space-y-2">
          {agent.constraints.map((c, i) => (
            <li key={i} className="flex gap-3 text-amber-100">
              <span className="text-amber-400 flex-shrink-0">⚠</span>
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Tutorial */}
      <section className="mb-12 bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-8">
        <h2 className="text-2xl font-bold mb-2">{agent.tutorial.title}</h2>
        <p className="text-[var(--muted)] mb-6 text-sm">
          A walkthrough of how to use this agent in your daily workflow.
        </p>
        <ol className="space-y-6">
          {agent.tutorial.steps.map((step, i) => (
            <li key={i} className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
                {i + 1}
              </div>
              <div>
                <h3 className="font-semibold mb-1">{step.title}</h3>
                <p className="text-[var(--muted)] text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Example */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Example output</h2>
        <pre className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 text-sm text-[var(--foreground)] whitespace-pre-wrap leading-relaxed">
          {agent.exampleOutput}
        </pre>
      </section>

      {/* CTA */}
      <section className="text-center py-12 border-t border-[var(--card-border)]">
        <h2 className="text-2xl font-bold mb-4">
          Ready to try the {agent.name}?
        </h2>
        <p className="text-[var(--muted)] mb-6">
          Sign up for free and start exploring AI-powered paper trading research.
        </p>
        <Link
          href="/dashboard"
          className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
        >
          Open Paper Dashboard
        </Link>
        <p className="mt-4 text-[var(--muted)] text-xs">
          Paper trading only. Not financial advice.
        </p>
      </section>

      {/* Other agents */}
      <section className="mt-16 pt-12 border-t border-[var(--card-border)]">
        <h2 className="text-xl font-bold mb-6">Meet the other agents</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {agents
            .filter((a) => a.slug !== agent.slug)
            .map((a) => (
              <Link
                key={a.slug}
                href={`/agents/${a.slug}`}
                className="border border-[var(--card-border)] rounded-lg p-4 hover:border-indigo-600 transition-colors"
              >
                <div className="text-2xl mb-2">{a.emoji}</div>
                <p className="font-semibold text-sm">{a.name}</p>
                <p className="text-[var(--muted)] text-xs mt-1">{a.role}</p>
              </Link>
            ))}
        </div>
      </section>
    </div>
  );
}
