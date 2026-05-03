import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://elexaaitrading.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const blogSlugs = [
    "what-is-paper-trading",
    "ai-agents-in-trading",
    "stop-loss-risk-management",
  ];

  const staticPages = [
    { url: BASE, priority: 1.0, changeFrequency: "weekly" as const },
    { url: `${BASE}/pricing`, priority: 0.8, changeFrequency: "monthly" as const },
    { url: `${BASE}/disclaimer`, priority: 0.6, changeFrequency: "yearly" as const },
    { url: `${BASE}/blog`, priority: 0.8, changeFrequency: "weekly" as const },
  ];

  const blogPages = blogSlugs.map((slug) => ({
    url: `${BASE}/blog/${slug}`,
    priority: 0.7,
    changeFrequency: "monthly" as const,
  }));

  return [...staticPages, ...blogPages];
}
