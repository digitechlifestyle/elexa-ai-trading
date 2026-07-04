import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Selected Tool Stack",
  description:
    "Selected open-source tools and macro report modules planned for Elexa AI Trading research, education, operations and content workflows.",
};

const selectedTools = [
  {
    number: "01",
    name: "AutoHedge",
    role: "Research architecture only",
    fit: "Use as inspiration for multi-agent research, risk review and paper simulation. Do not connect to real funds or live execution in launch mode.",
    elexaUse: [
      "Research Agent, Risk Agent, Journal Agent and Simulation Agent pattern",
      "Bull/bear trade idea debate",
      "Paper allocation testing only",
      "Risk-first workflow before any user action",
    ],
    warning:
      "High-risk if used for autonomous trading. Keep it educational and simulation-only.",
  },
  {
    number: "04",
    name: "LibreChat",
    role: "Internal AI research workbench",
    fit: "Use as a self-hosted multi-model chat hub for research, support, documentation and prompt workflows.",
    elexaUse: [
      "Internal AI assistant for support and product research",
      "Prompt library for market explainers",
      "Multi-model testing before releasing public features",
      "Saved research conversations for team workflows",
    ],
    warning:
      "Do not let chat output become financial advice. Keep human review and risk wording.",
  },
  {
    number: "05",
    name: "Open GenerativeAI",
    role: "Creative content dashboard",
    fit: "Use for educational visuals, thumbnails, explainer graphics and video concepts around Elexa and DigiTechLifestyle content.",
    elexaUse: [
      "Explainer images for market education",
      "Product walkthrough visuals",
      "YouTube and social thumbnails",
      "Beginner-friendly diagrams for crypto, stocks, ETFs and risk",
    ],
    warning:
      "Many models still use cloud APIs. Do not upload private user data or account details.",
  },
  {
    number: "06",
    name: "Open-LLM-VTuber",
    role: "Future AI presenter",
    fit: "Use later as an optional avatar or education presenter, not as a core trading engine.",
    elexaUse: [
      "AI presenter for beginner explainers",
      "Animated onboarding guide",
      "Faceless YouTube or short-form education character",
      "Screen-based walkthroughs for how Elexa works",
    ],
    warning:
      "Delay this until the core Elexa product is stable. It can distract from launch essentials.",
  },
  {
    number: "07",
    name: "ClaudeAds",
    role: "Marketing audit tool",
    fit: "Use to audit paid ads before spending money promoting Elexa or DigiTechLifestyle content.",
    elexaUse: [
      "Google, Meta, YouTube, TikTok and LinkedIn ad checks",
      "Campaign health score before launch spend",
      "Landing page and conversion improvement ideas",
      "Lower-risk ad testing for educational content funnels",
    ],
    warning:
      "Keep ad claims conservative. No profit promises, trading guarantees or get-rich messaging.",
  },
  {
    number: "08",
    name: "Agentic Inbox",
    role: "Operations and support assistant",
    fit: "Use for support emails, partnership messages, affiliate replies and bug triage, with human approval before send.",
    elexaUse: [
      "Draft replies to user support requests",
      "Classify bug reports and feedback",
      "Manage partnership and affiliate enquiries",
      "Create a support summary for product improvements",
    ],
    warning:
      "Keep email automation away from trading keys, balances and sensitive financial data.",
  },
  {
    number: "10",
    name: "Hyperframes",
    role: "Programmatic video and education content",
    fit: "Use to generate repeatable explainer videos, onboarding clips, market education shorts and product walkthroughs from HTML-driven templates.",
    elexaUse: [
      "Create automated Elexa product walkthrough videos",
      "Turn Buffett Indicator reports into short educational clips",
      "Generate market explainers for YouTube, TikTok, Instagram and X",
      "Version video templates in git so content can be improved safely",
    ],
    warning:
      "Keep videos educational. Do not create hype clips promising profits or implying Elexa predicts markets.",
  },
];

const buffettSections = [
  {
    title: "What the report measures",
    text: "The Buffett Indicator compares broad stock market value with GDP. It is best used as a market temperature gauge, not as a timing signal.",
  },
  {
    title: "Elexa-safe interpretation",
    text: "The report should classify valuation conditions as normal, elevated, stretched or extreme, then explain what that means for research and risk management.",
  },
  {
    title: "What not to do",
    text: "Do not turn the Buffett Indicator into a buy, sell or short signal. It can stay elevated for long periods and needs context from rates, earnings, liquidity and market concentration.",
  },
  {
    title: "How it helps users",
    text: "It gives beginners a plain-English macro warning layer before they evaluate stocks, ETFs, crypto sentiment or AI-led market narratives.",
  },
];

export default function ToolStackPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-20">
      <section className="text-center mb-16">
        <p className="text-indigo-400 text-sm font-semibold mb-3">
          Elexa selected stack
        </p>
        <h1 className="text-4xl md:text-5xl font-bold mb-5">
          Tools to support Elexa without turning it into a risky trading bot.
        </h1>
        <p className="text-[var(--muted)] text-lg max-w-3xl mx-auto leading-relaxed">
          These are the selected tools from the FreeStack PDF that can support
          Elexa AI Trading. The priority is research, education, risk review,
          support operations and content creation — not live autonomous trading.
        </p>
      </section>

      <section className="bg-amber-950 border border-amber-800 rounded-2xl p-8 mb-16">
        <h2 className="text-2xl font-bold text-amber-100 mb-3">
          Safety boundary
        </h2>
        <p className="text-amber-300 text-sm leading-relaxed">
          Elexa should use these tools to improve research, workflow and user
          education. Launch mode must remain no financial advice, no guaranteed
          returns, no live execution and no withdrawal-enabled API keys.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
        {selectedTools.map((tool) => (
          <div
            key={tool.name}
            className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-6"
          >
            <p className="text-indigo-400 text-sm font-semibold mb-2">
              {tool.number}
            </p>
            <h2 className="text-2xl font-bold mb-2">{tool.name}</h2>
            <p className="text-white font-semibold mb-3">{tool.role}</p>
            <p className="text-[var(--muted)] text-sm leading-relaxed mb-5">
              {tool.fit}
            </p>
            <div className="space-y-2 mb-5">
              {tool.elexaUse.map((item) => (
                <div key={item} className="flex gap-3 text-sm text-[var(--muted)]">
                  <span className="text-indigo-400">•</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <p className="text-amber-300 text-xs leading-relaxed">
              Warning: {tool.warning}
            </p>
          </div>
        ))}
      </section>

      <section className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-8 mb-16">
        <p className="text-indigo-400 text-sm font-semibold mb-3">
          New module
        </p>
        <h2 className="text-3xl font-bold mb-4">Buffett Indicator Report</h2>
        <p className="text-[var(--muted)] leading-relaxed mb-8">
          Add a Buffett Indicator report to Elexa as a macro valuation module.
          It should help users understand whether the broad stock market appears
          cheap, fair, elevated or stretched compared with the size of the economy.
          It must be framed as context, not a trading signal.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {buffettSections.map((section) => (
            <div
              key={section.title}
              className="bg-[var(--background)] border border-[var(--card-border)] rounded-xl p-5"
            >
              <h3 className="font-bold text-lg mb-2">{section.title}</h3>
              <p className="text-[var(--muted)] text-sm leading-relaxed">
                {section.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-indigo-950 border border-indigo-800 rounded-2xl p-8">
        <h2 className="text-2xl font-bold mb-4">Recommended build order</h2>
        <ol className="space-y-3 text-indigo-200 text-sm leading-relaxed list-decimal list-inside">
          <li>Build the Buffett Indicator Report as a simple macro research page.</li>
          <li>Add LibreChat internally for research and support workflows.</li>
          <li>Use AutoHedge only as architecture inspiration for safe agent roles.</li>
          <li>Use Open GenerativeAI, Open-LLM-VTuber and Hyperframes for education content, not trading logic.</li>
          <li>Use ClaudeAds and Agentic Inbox for launch marketing and support operations.</li>
        </ol>
      </section>
    </div>
  );
}
