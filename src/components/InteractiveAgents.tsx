import Link from "next/link";
import { agents } from "@/lib/agents-data";

export default function InteractiveAgents() {
  return (
    <section className="px-6 py-20 max-w-6xl mx-auto w-full">
      <h2 className="text-3xl font-bold text-center mb-4">The Agent Team</h2>
      <p className="text-center text-[var(--muted)] mb-12 max-w-xl mx-auto">
        Every trade idea passes through multiple AI checkpoints. No single agent
        has unilateral authority. Click any agent to read a detailed guide and
        tutorial.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => (
          <Link
            key={agent.slug}
            href={`/agents/${agent.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block border border-[var(--card-border)] rounded-xl p-6 bg-[var(--card)] hover:border-indigo-600 transition-all hover:scale-[1.02]"
          >
            <div className="text-4xl mb-3">{agent.emoji}</div>
            <p className="font-semibold text-base mb-1 text-white">
              {agent.name}
            </p>
            <p className="text-indigo-400 text-xs mb-3">{agent.tagline}</p>
            <p className="text-[var(--muted)] text-sm leading-relaxed mb-4">
              {agent.role}
            </p>
            <p className="text-indigo-400 text-xs font-medium">
              Read full guide →
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
