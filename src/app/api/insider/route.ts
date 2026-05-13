import { withApi } from "@/lib/observability/api-handler";
import { NextResponse } from "next/server";

interface InsiderFiling {
  title: string;
  company: string;
  filed_at: string;
  url: string;
  cik: string;
  symbol?: string;
}

/**
 * SEC EDGAR — latest Form 4 (insider trading) filings.
 * Uses the public Atom feed. Requires User-Agent header per SEC policy.
 */
export const GET = withApi(async function GET() {
  const url =
    "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&type=4&dateb=&owner=include&count=40&output=atom";
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Elexa AI Trading research@elexaaitrading.com",
        Accept: "application/atom+xml",
      },
      next: { revalidate: 900 }, // cache 15 min
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `SEC upstream ${res.status}` },
        { status: 502 }
      );
    }
    const xml = await res.text();
    // Lightweight parse — extract <entry> blocks
    const filings: InsiderFiling[] = [];
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    let match: RegExpExecArray | null;
    while ((match = entryRegex.exec(xml)) !== null) {
      const block = match[1];
      const title = /<title>([\s\S]*?)<\/title>/.exec(block)?.[1] ?? "";
      const link = /<link[^>]*href="([^"]+)"/.exec(block)?.[1] ?? "";
      const updated = /<updated>([\s\S]*?)<\/updated>/.exec(block)?.[1] ?? "";
      // Title format: "4 - <Company Name>  (CIK#) (Filer)"
      const titleMatch = /^4\s*-\s*(.+?)\s*\((\d+)\)/.exec(title);
      const company = titleMatch?.[1]?.trim() ?? title;
      const cik = titleMatch?.[2] ?? "";
      filings.push({
        title,
        company,
        cik,
        filed_at: updated,
        url: link,
      });
      if (filings.length >= 40) break;
    }
    return NextResponse.json({ filings });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 502 }
    );
  }
});
