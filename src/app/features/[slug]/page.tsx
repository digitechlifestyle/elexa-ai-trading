import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { features, getFeature } from "@/lib/features-data";

export async function generateStaticParams() {
  return features.map((f) => ({ slug: f.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const feature = getFeature(slug);
  if (!feature) return { title: "Feature not found" };
  return {
    title: `${feature.title} — ${feature.tagline}`,
    description: feature.overview.slice(0, 160),
  };
}

export default async function FeaturePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const feature = getFeature(slug);
  if (!feature) notFound();

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <Link
        href="/"
        className="text-indigo-400 hover:text-indigo-300 text-sm mb-8 inline-block"
      >
        ← Back to home
      </Link>

      <div className="mb-12">
        <div className="text-6xl mb-4">{feature.icon}</div>
        <h1 className="text-4xl md:text-5xl font-bold mb-3">{feature.title}</h1>
        <p className="text-xl text-indigo-400 mb-6">{feature.tagline}</p>
        <p className="text-[var(--muted)] text-base leading-relaxed">
          {feature.shortDesc}
        </p>
      </div>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Overview</h2>
        <p className="text-[var(--foreground)] leading-relaxed">
          {feature.overview}
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Key benefits</h2>
        <ul className="space-y-2">
          {feature.benefits.map((b, i) => (
            <li key={i} className="flex gap-3 text-[var(--foreground)]">
              <span className="text-indigo-400 flex-shrink-0">✓</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">How it works</h2>
        <p className="text-[var(--foreground)] leading-relaxed">
          {feature.howItWorks}
        </p>
      </section>

      <section className="mb-12 bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
        <h2 className="text-2xl font-bold mb-4">Technical details</h2>
        <ul className="space-y-2">
          {feature.details.map((d, i) => (
            <li key={i} className="flex gap-3 text-[var(--foreground)] text-sm">
              <span className="text-indigo-400 flex-shrink-0">▸</span>
              <span>{d}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-12 bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-8">
        <h2 className="text-2xl font-bold mb-2">{feature.tutorial.title}</h2>
        <p className="text-[var(--muted)] mb-6 text-sm">
          A step-by-step walkthrough.
        </p>
        <ol className="space-y-6">
          {feature.tutorial.steps.map((step, i) => (
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

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Frequently asked questions</h2>
        <div className="space-y-4">
          {feature.faq.map((item, i) => (
            <div
              key={i}
              className="border border-[var(--card-border)] rounded-xl p-5"
            >
              <h3 className="font-semibold mb-2">{item.q}</h3>
              <p className="text-[var(--muted)] text-sm leading-relaxed">
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="text-center py-12 border-t border-[var(--card-border)]">
        <h2 className="text-2xl font-bold mb-4">Ready to try it?</h2>
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

      <section className="mt-16 pt-12 border-t border-[var(--card-border)]">
        <h2 className="text-xl font-bold mb-6">More features</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {features
            .filter((f) => f.slug !== feature.slug)
            .map((f) => (
              <Link
                key={f.slug}
                href={`/features/${f.slug}`}
                className="border border-[var(--card-border)] rounded-lg p-4 hover:border-indigo-600 transition-colors"
              >
                <div className="text-2xl mb-2">{f.icon}</div>
                <p className="font-semibold text-sm">{f.title}</p>
                <p className="text-[var(--muted)] text-xs mt-1">
                  {f.shortDesc.slice(0, 60)}…
                </p>
              </Link>
            ))}
        </div>
      </section>
    </div>
  );
}
