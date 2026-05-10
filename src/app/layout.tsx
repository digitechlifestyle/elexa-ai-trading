import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Elexa AI Trading | AI-Powered Paper Trading Platform",
    template: "%s | Elexa AI Trading",
  },
  description:
    "Elexa AI Trading provides AI-assisted paper trading for research and education. Not financial advice. All trading involves significant risk of loss.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://elexaaitrading.com"
  ),
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    siteName: "Elexa AI Trading",
    type: "website",
    images: [{ url: "/elexa-logo.svg" }],
  },
  robots: { index: true, follow: true },
};

const RISK_BANNER =
  "IMPORTANT: Elexa AI Trading is a paper trading research tool. It is NOT financial advice. All trading involves substantial risk of loss. Past performance does not guarantee future results. Never trade with money you cannot afford to lose.";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        {/* Persistent compliance banner — required on every page */}
        <div
          role="alert"
          className="w-full bg-amber-950 border-b border-amber-800 px-4 py-2 text-center text-amber-200 text-xs leading-snug"
        >
          <strong className="text-amber-400">RISK DISCLOSURE: </strong>
          {RISK_BANNER}
        </div>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-[var(--card-border)] px-6 py-8 text-[var(--muted)] text-xs">
          <div className="max-w-6xl mx-auto space-y-3">
            <p className="font-semibold text-amber-400">
              Financial Risk Disclaimer
            </p>
            <p>
              Elexa AI Trading LLC does not provide investment advice,
              brokerage services, or any form of financial advice. The platform
              is provided for educational and research purposes only in paper
              trading (simulated) mode. AI-generated signals are experimental
              and should not be relied upon for real financial decisions.
            </p>
            <p>
              Trading securities involves substantial risk of loss and is not
              appropriate for all investors. There is no guarantee of profit.
              Past performance of any trading system or methodology does not
              guarantee future results. You may lose all capital invested.
            </p>
            <p>
              Elexa AI Trading is not registered with the SEC, FINRA, or any
              financial regulatory body. Consult a licensed financial advisor
              before making any investment decisions.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <a href="/guide" className="hover:text-white underline">
                User Guide
              </a>
              <a href="/legal" className="hover:text-white underline font-semibold text-amber-300">
                Legal &amp; Liability
              </a>
              <a href="/disclaimer" className="hover:text-white underline">
                Full Risk Disclaimer
              </a>
              <a href="/privacy" className="hover:text-white underline">
                Privacy Policy
              </a>
              <span>© {new Date().getFullYear()} Elexa AI Trading LLC</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
