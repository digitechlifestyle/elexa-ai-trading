import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title:
    "Legal Disclaimer & Limitation of Liability | Elexa AI Trading",
  description:
    "Comprehensive legal disclaimer, terms of use, and limitation of liability for Elexa AI Trading. US (SEC, FINRA, CFTC) and UK (FCA) regulatory notices. Read in full before using the platform.",
  robots: { index: true, follow: true },
};

export default function LegalPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <Link
        href="/"
        className="text-indigo-400 hover:text-indigo-300 text-sm mb-8 inline-block"
      >
        ← Back to home
      </Link>

      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-3">
          Legal Disclaimer &amp; Limitation of Liability
        </h1>
        <p className="text-[var(--muted)] text-sm">
          Effective date: {new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}
        </p>
        <p className="text-[var(--muted)] text-sm mt-2">
          This page is a legally binding agreement. By accessing or using the
          Elexa AI Trading platform (the &ldquo;Platform&rdquo;) you agree to be
          bound by every term below. If you do not agree, you must not access
          or use the Platform.
        </p>
      </div>

      {/* Top-level summary */}
      <section className="mb-12 bg-amber-950 border-2 border-amber-700 rounded-xl p-6">
        <h2 className="text-2xl font-bold mb-4 text-amber-200">
          Plain-English Summary (Read This First)
        </h2>
        <ul className="space-y-3 text-amber-100 text-sm leading-relaxed">
          <li>
            ▸ Elexa AI Trading is a <strong>research and education tool</strong>{" "}
            for paper (simulated) trading. It is <strong>NOT</strong> financial,
            investment, legal, tax, or accounting advice.
          </li>
          <li>
            ▸ We are <strong>NOT</strong> a registered broker, dealer,
            investment advisor, financial advisor, or regulated financial
            institution in the United States, United Kingdom, or any other
            jurisdiction.
          </li>
          <li>
            ▸ <strong>You are 100% responsible for any decisions you make and any losses you incur.</strong>{" "}
            We accept no liability whatsoever for trading losses, missed
            opportunities, opportunity cost, taxes, or any other financial
            consequence of using the Platform.
          </li>
          <li>
            ▸ <strong>AI agents can be wrong, biased, hallucinate, or make
            errors.</strong> Any output from any AI agent must be independently
            verified by you before you act on it.
          </li>
          <li>
            ▸ Past performance, simulated results, and AI-generated forecasts
            are <strong>not</strong> indicative of future results.
          </li>
          <li>
            ▸ Trading any financial instrument involves substantial risk,
            including total loss of capital. <strong>Never trade with money
            you cannot afford to lose.</strong>
          </li>
        </ul>
      </section>

      {/* Full legal terms */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">1. No Investment Advice</h2>
        <p className="text-[var(--foreground)] leading-relaxed mb-4">
          The Platform, all content on the Platform, all output from any AI
          agent, all blog posts, all trade journal entries, all signals, all
          alerts, all data, all educational material, and all communications
          from Elexa AI Trading and its affiliates (collectively the
          &ldquo;Content&rdquo;) are provided strictly for general informational,
          educational, and research purposes only. Nothing on the Platform
          constitutes:
        </p>
        <ul className="list-disc pl-6 space-y-1 text-[var(--foreground)] leading-relaxed mb-4">
          <li>investment, financial, trading, securities, or commodities advice;</li>
          <li>a recommendation, solicitation, or offer to buy, sell, or hold any security, derivative, commodity, cryptocurrency, or other financial instrument;</li>
          <li>tax, legal, accounting, regulatory, or compliance advice;</li>
          <li>a fiduciary relationship of any kind between you and Elexa AI Trading.</li>
        </ul>
        <p className="text-[var(--foreground)] leading-relaxed">
          You should always consult a duly licensed and qualified investment
          professional, financial advisor, lawyer, or tax advisor in your
          jurisdiction before making any financial decision.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">
          2. United States Regulatory Notice
        </h2>
        <p className="text-[var(--foreground)] leading-relaxed mb-4">
          Elexa AI Trading is <strong>not</strong> registered with the United
          States Securities and Exchange Commission (SEC), the Financial
          Industry Regulatory Authority (FINRA), the Commodity Futures Trading
          Commission (CFTC), the National Futures Association (NFA), or any
          state securities regulator. We are not a broker-dealer, registered
          investment advisor (RIA), futures commission merchant, introducing
          broker, or commodity trading advisor.
        </p>
        <p className="text-[var(--foreground)] leading-relaxed mb-4">
          Pursuant to <strong>SEC Rule 156</strong>, no statement on the
          Platform should be construed as a guarantee of future performance or
          a representation that any specific result is achievable. Pursuant to
          <strong> CFTC Rule 4.41</strong>, hypothetical, simulated, or paper
          performance results have inherent limitations. Unlike actual
          performance records, simulated results do not represent actual
          trading and may not be impacted by brokerage and other slippage fees.
          Simulated trading programs in general are also subject to the fact
          that they are designed with the benefit of hindsight. No
          representation is being made that any account will or is likely to
          achieve profits or losses similar to those shown.
        </p>
        <p className="text-[var(--foreground)] leading-relaxed">
          US users acknowledge that securities and derivatives trading is
          regulated and that engaging in unregulated trading activity may
          expose them to additional legal and tax risk for which Elexa accepts
          no responsibility.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">
          3. United Kingdom Regulatory Notice
        </h2>
        <p className="text-[var(--foreground)] leading-relaxed mb-4">
          Elexa AI Trading is <strong>not</strong> authorised or regulated by
          the Financial Conduct Authority (FCA) or the Prudential Regulation
          Authority (PRA) in the United Kingdom. The Platform does not provide
          regulated investment services as defined by the Financial Services
          and Markets Act 2000 (FSMA), and is not a designated investment
          business.
        </p>
        <p className="text-[var(--foreground)] leading-relaxed mb-4">
          Nothing on the Platform should be construed as a financial promotion
          within the meaning of section 21 FSMA. Any reference to financial
          instruments is provided for educational purposes only and is not an
          inducement to engage in investment activity. UK retail users are
          warned that investments referenced on the Platform are not protected
          by the Financial Services Compensation Scheme (FSCS) and that
          complaints cannot be referred to the Financial Ombudsman Service
          (FOS).
        </p>
        <p className="text-[var(--foreground)] leading-relaxed">
          UK users are reminded of the FCA&rsquo;s standard high-risk
          investment warning: <em>The value of investments can fall as well as
          rise. You may not get back the amount you originally invested. Past
          performance is not a reliable indicator of future results. Tax
          treatment depends on individual circumstances and may change.</em>
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">
          4. Risk of Loss — Acknowledgement
        </h2>
        <p className="text-[var(--foreground)] leading-relaxed mb-4">
          Trading and investing in any financial instrument — including but not
          limited to stocks, ETFs, futures, options, forex, cryptocurrencies,
          contracts for difference (CFDs), and derivatives — carries{" "}
          <strong>substantial risk of loss</strong> and is not suitable for
          every investor. You may lose all of the capital you invest, and in
          some products you may lose more than your initial investment. By
          using the Platform you expressly acknowledge and accept that:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-[var(--foreground)] leading-relaxed">
          <li>You may incur losses up to and including 100% of your invested capital;</li>
          <li>Past performance, hypothetical performance, and simulated performance do not guarantee future results;</li>
          <li>Markets can be volatile, illiquid, and subject to gaps that prevent stop-loss orders from filling at expected prices;</li>
          <li>Leverage and margin trading magnify both gains and losses;</li>
          <li>Fees, taxes, slippage, and spreads will reduce realised returns;</li>
          <li>Cryptocurrency markets operate 24/7, are highly volatile, and may be subject to additional regulatory and counterparty risk;</li>
          <li>Exchange or counterparty failure can result in total loss of funds held at the exchange.</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">
          5. AI Output Disclaimer
        </h2>
        <p className="text-[var(--foreground)] leading-relaxed mb-4">
          The Platform uses large language models and other artificial
          intelligence systems (the &ldquo;AI Agents&rdquo;) to generate
          analyses, proposals, summaries, and educational content. You expressly
          acknowledge and agree that:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-[var(--foreground)] leading-relaxed">
          <li>AI Agents can produce factually incorrect, biased, outdated, hallucinated, or misleading output;</li>
          <li>AI output is not reviewed by a licensed financial professional;</li>
          <li>Any AI output that resembles a trade recommendation is research, not advice;</li>
          <li>You must independently verify any AI output before relying on it for any decision;</li>
          <li>We make no warranty as to the accuracy, completeness, timeliness, or fitness for purpose of any AI output;</li>
          <li>We are not liable for any loss arising from your use of, or reliance on, AI output.</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">
          6. Limitation of Liability
        </h2>
        <p className="text-[var(--foreground)] leading-relaxed mb-4">
          To the fullest extent permitted by applicable law, Elexa AI Trading,
          its officers, directors, employees, contractors, agents, suppliers,
          licensors, and affiliates (the &ldquo;Released Parties&rdquo;) shall{" "}
          <strong>not</strong> be liable for any direct, indirect, incidental,
          special, consequential, exemplary, or punitive damages, including
          without limitation:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-[var(--foreground)] leading-relaxed mb-4">
          <li>any trading losses, missed gains, or opportunity cost;</li>
          <li>any loss of profits, revenue, data, goodwill, or business;</li>
          <li>any damages arising from your use of, or inability to use, the Platform;</li>
          <li>any damages arising from reliance on Content, AI output, or signals;</li>
          <li>any damages arising from third-party services, exchanges, brokers, custodians, or APIs;</li>
          <li>any damages arising from unauthorised access to or alteration of your data;</li>
          <li>any tax, regulatory, or legal consequences of decisions made on the basis of Platform output.</li>
        </ul>
        <p className="text-[var(--foreground)] leading-relaxed mb-4">
          This limitation applies whether the alleged liability is based on
          contract, tort, negligence, strict liability, or any other basis,
          even if the Released Parties have been advised of the possibility of
          such damage.
        </p>
        <p className="text-[var(--foreground)] leading-relaxed">
          In no event shall the aggregate liability of the Released Parties for
          any cause of action whatsoever exceed the greater of (a) the total
          fees paid by you to Elexa AI Trading in the twelve (12) months
          preceding the claim, or (b) one hundred US dollars (US$100). Some
          jurisdictions do not allow the exclusion or limitation of certain
          damages; in such jurisdictions our liability shall be limited to the
          maximum extent permitted by law.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">7. Indemnification</h2>
        <p className="text-[var(--foreground)] leading-relaxed">
          You agree to defend, indemnify, and hold harmless the Released
          Parties from and against any and all claims, liabilities, damages,
          losses, and expenses (including reasonable legal fees) arising from
          or related to: (a) your use of or access to the Platform; (b) your
          violation of these terms; (c) your violation of any third-party right
          including without limitation any intellectual property, privacy, or
          regulatory right; (d) any trade or transaction you place through any
          exchange connected via the Platform; (e) any tax, regulatory, or
          legal consequence of any decision you make.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">
          8. No Warranty &mdash; &ldquo;As Is&rdquo;
        </h2>
        <p className="text-[var(--foreground)] leading-relaxed">
          The Platform is provided on an <strong>&ldquo;AS IS&rdquo;</strong>{" "}
          and <strong>&ldquo;AS AVAILABLE&rdquo;</strong> basis, with all
          faults, and without warranty of any kind, express, implied, or
          statutory, including without limitation warranties of merchantability,
          fitness for a particular purpose, accuracy, completeness,
          non-infringement, system integration, freedom from defects, or freedom
          from interruption. We do not warrant that the Platform will be
          uninterrupted, error-free, secure, or free of viruses or harmful
          components.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">9. User Eligibility</h2>
        <p className="text-[var(--foreground)] leading-relaxed">
          You represent and warrant that you are at least eighteen (18) years
          of age (or the age of majority in your jurisdiction, whichever is
          higher), that you have the legal capacity to enter into this
          agreement, that you are not a person prohibited from receiving
          services under applicable sanctions or trade laws, and that your use
          of the Platform does not violate any law, regulation, or contractual
          obligation applicable to you.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">
          10. Third-Party Services and Exchanges
        </h2>
        <p className="text-[var(--foreground)] leading-relaxed">
          The Platform integrates with third-party services and exchanges
          (including but not limited to Alpaca, Kraken, Anthropic, Supabase,
          and Vercel). We do not control, endorse, or assume responsibility for
          any third-party service. Your relationship with any third-party
          service is governed by that service&rsquo;s own terms and policies.
          Failures, delays, or losses caused by any third-party service are
          outside our control and outside our liability.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">
          11. Tax Responsibility
        </h2>
        <p className="text-[var(--foreground)] leading-relaxed">
          You are solely responsible for determining what taxes apply to your
          activities on the Platform and for reporting and remitting them. We
          do not withhold or report taxes on your behalf. Tax laws are complex
          and jurisdiction-specific; consult a qualified tax advisor.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">
          12. Force Majeure
        </h2>
        <p className="text-[var(--foreground)] leading-relaxed">
          We shall not be liable for any failure or delay in performance caused
          by events beyond our reasonable control, including but not limited
          to: acts of God, war, terrorism, civil unrest, government action,
          changes in law or regulation, exchange outages, market disruptions,
          internet or infrastructure failures, cyberattacks, pandemics, or
          power outages.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">
          13. Governing Law &amp; Jurisdiction
        </h2>
        <p className="text-[var(--foreground)] leading-relaxed">
          These terms shall be governed by and construed in accordance with the
          laws of the jurisdiction in which Elexa AI Trading is incorporated,
          without regard to conflict-of-law principles. Any dispute arising out
          of or relating to these terms or the Platform shall be resolved
          exclusively by binding arbitration in that jurisdiction, except that
          either party may seek injunctive relief in any court of competent
          jurisdiction. You waive any right to a trial by jury and any right
          to participate in a class action.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">14. Severability</h2>
        <p className="text-[var(--foreground)] leading-relaxed">
          If any provision of these terms is held to be invalid or
          unenforceable, the remaining provisions shall continue in full force
          and effect. The invalid provision shall be replaced by a valid one
          that most closely matches the original intent.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">15. Changes to These Terms</h2>
        <p className="text-[var(--foreground)] leading-relaxed">
          We may update these terms from time to time. The current version is
          always available at this URL. Material changes will be flagged on the
          Platform. Continued use of the Platform after changes constitutes
          acceptance of the new terms.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">16. Contact</h2>
        <p className="text-[var(--foreground)] leading-relaxed">
          For questions about this disclaimer or any legal matter, contact{" "}
          <a
            href="mailto:legal@elexaaitrading.com"
            className="text-indigo-400 hover:underline"
          >
            legal@elexaaitrading.com
          </a>
          .
        </p>
      </section>

      {/* Acknowledgement footer */}
      <section className="mt-16 pt-8 border-t-2 border-amber-700 bg-amber-950 -mx-6 px-8 py-8 rounded-xl">
        <h2 className="text-xl font-bold mb-4 text-amber-200">
          Acknowledgement
        </h2>
        <p className="text-amber-100 text-sm leading-relaxed mb-4">
          BY ACCESSING OR USING THE PLATFORM, YOU EXPRESSLY ACKNOWLEDGE THAT
          YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY EVERY TERM ABOVE,
          INCLUDING THE LIMITATION OF LIABILITY, INDEMNIFICATION, &ldquo;AS
          IS&rdquo; WARRANTY DISCLAIMER, AND ARBITRATION CLAUSES.
        </p>
        <p className="text-amber-100 text-sm leading-relaxed">
          YOU EXPRESSLY ASSUME ALL RISK OF LOSS ARISING FROM YOUR USE OF THE
          PLATFORM, INCLUDING ANY LOSS RESULTING FROM RELIANCE ON AI-GENERATED
          OUTPUT. ELEXA AI TRADING SHALL NOT BE LIABLE FOR ANY SUCH LOSS UNDER
          ANY CIRCUMSTANCE.
        </p>
      </section>

      <div className="mt-12 flex gap-4">
        <Link
          href="/disclaimer"
          className="text-indigo-400 hover:underline text-sm"
        >
          Risk Disclaimer →
        </Link>
        <Link
          href="/privacy"
          className="text-indigo-400 hover:underline text-sm"
        >
          Privacy Policy →
        </Link>
        <Link href="/" className="text-indigo-400 hover:underline text-sm">
          Home →
        </Link>
      </div>
    </div>
  );
}
