import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Elexa AI Trading | AI Market Research & Strategy Simulation",
    template: "%s | Elexa AI Trading",
  },
  description:
    "Elexa AI Trading provides AI-assisted market research, risk review, journaling and simulated strategy testing. Not financial advice.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://elexaaitrading.com"
  ),
  icons: {
    icon: "/favicon.ico",
    apple: "/elexa-logo.svg",
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    siteName: "Elexa AI Trading",
    type: "website",
    images: [{ url: "/elexa-logo.svg" }],
  },
  robots: { index: true, follow: true },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Elexa",
  },
};

export const viewport = {
  themeColor: "#0a0a0f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

const RISK_BANNER =
  "IMPORTANT: Elexa AI Trading is a research, education, journaling and simulation platform. It is NOT financial advice. Launch mode does not place real-money trades. All trading involves substantial risk of loss.";

const publicNav = [
  { href: "/how-it-works", label: "How It Works" },
  { href: "/features", label: "Features" },
  { href: "/markets", label: "Markets" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/faq", label: "FAQ" },
  { href: "/trust", label: "Trust & Safety" },
  { href: "/pricing", label: "Pricing" },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Set theme before paint to avoid flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('elexa_theme')||'dark';document.documentElement.setAttribute('data-theme',t);}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col">
        {/* Persistent compliance banner — required on every page */}
        <div
          role="alert"
          className="w-full bg-amber-950 border-b border-amber-800 px-4 py-2 text-center text-amber-200 text-xs leading-snug"
        >
          <strong className="text-amber-400">RISK DISCLOSURE: </strong>
          {RISK_BANNER}
        </div>

        <header className="sticky top-0 z-40 border-b border-[var(--card-border)] bg-[var(--background)]/95 backdrop-blur px-6 py-4">
          <div className="max-w-6xl mx-auto flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <a href="/" className="text-lg font-bold text-indigo-400">
              Elexa AI Trading
            </a>
            <nav className="flex flex-wrap items-center gap-4 text-sm text-[var(--muted)]">
              {publicNav.map((item) => (
                <a key={item.href} href={item.href} className="hover:text-white transition-colors">
                  {item.label}
                </a>
              ))}
              <a
                href="/dashboard"
                className="hover:text-white transition-colors"
              >
                Dashboard
              </a>
              <a
                href="/onboarding"
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                Start Demo
              </a>
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-[var(--card-border)] px-6 py-8 text-[var(--muted)] text-xs">
          <div className="max-w-6xl mx-auto space-y-3">
            <p className="font-semibold text-amber-400">
              Financial Risk Disclaimer
            </p>
            <p>
              Elexa AI Trading LLC does not provide investment advice,
              brokerage services, personal recommendations, or any form of
              financial advice. The platform is provided for education,
              research, journaling and simulated strategy testing only.
            </p>
            <p>
              Launch mode does not place real-money trades. Trading securities,
              crypto assets and other financial instruments involves substantial
              risk of loss and is not appropriate for all investors. There is no
              guarantee of profit.
            </p>
            <p>
              AI-generated research can be incorrect, incomplete or outdated.
              Consult a licensed professional before making any real investment
              decisions outside the platform.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <a href="/guide" className="hover:text-white underline">
                User Guide
              </a>
              <a href="/how-it-works" className="hover:text-white underline font-semibold text-indigo-300">
                How It Works
              </a>
              <a href="/features" className="hover:text-white underline font-semibold text-indigo-300">
                Features
              </a>
              <a href="/roadmap" className="hover:text-white underline font-semibold text-indigo-300">
                Roadmap
              </a>
              <a href="/faq" className="hover:text-white underline font-semibold text-indigo-300">
                FAQ
              </a>
              <a href="/markets" className="hover:text-white underline">
                Markets &amp; Connections
              </a>
              <a href="/trust" className="hover:text-white underline font-semibold text-indigo-300">
                Trust &amp; Safety
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
