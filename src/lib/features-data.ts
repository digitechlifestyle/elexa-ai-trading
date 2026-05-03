export interface FeatureInfo {
  slug: string;
  icon: string;
  title: string;
  tagline: string;
  shortDesc: string;
  overview: string;
  benefits: string[];
  howItWorks: string;
  details: string[];
  tutorial: {
    title: string;
    steps: { title: string; description: string }[];
  };
  faq: { q: string; a: string }[];
}

export const features: FeatureInfo[] = [
  {
    slug: "ai-agents",
    icon: "🤖",
    title: "6 AI Agents",
    tagline: "A specialised team that researches, validates, and reports.",
    shortDesc:
      "CEO, Quant, Risk, Compliance, SEO, and Support agents work together. Each decision is validated and logged.",
    overview:
      "Elexa replaces the lone-trader-with-spreadsheets model with a structured team of six AI agents, each with a specific role and clear constraints. The CEO Agent orchestrates. The Quant Agent researches. The Risk Agent validates. The Compliance Agent reviews. The SEO Agent communicates. The Support Agent helps users. Every decision flows through multiple checkpoints — no single agent can place a trade unilaterally. This mirrors how a real proprietary trading firm operates: research, risk, compliance, and execution are kept deliberately separate.",
    benefits: [
      "Multiple checkpoints reduce single-point-of-failure risk",
      "Every decision is logged with full reasoning for audit",
      "Specialised agents do their narrow job better than a general-purpose AI",
      "Clear constraints prevent any one agent from overstepping its role",
      "Easier to debug when something goes wrong — you can see exactly which agent did what",
    ],
    howItWorks:
      "When you submit a research request or trade idea, it is routed through the agent team. The CEO Agent decides which other agents to involve. Each agent produces structured output that feeds into the next. The Risk Agent has veto power on any trade. The Compliance Agent has veto power on any user-facing content. All agent runs are logged in your Journal with timestamps, prompts, and responses.",
    details: [
      "Powered by Claude Sonnet (Anthropic)",
      "Each agent has a distinct system prompt and constraint set",
      "Inter-agent communication uses structured JSON for reliability",
      "All runs are logged to Supabase with full auditability",
      "Risk Agent enforcement is server-side and cannot be bypassed by the client",
    ],
    tutorial: {
      title: "How to use the agent team",
      steps: [
        {
          title: "1. Start with the CEO Agent",
          description:
            "From your dashboard, open the Agents tab and click 'CEO Agent'. Ask for a daily briefing or set a research goal.",
        },
        {
          title: "2. Let it delegate",
          description:
            "The CEO Agent will route your request to the appropriate specialist agents. Watch the chain of work unfold in the Journal.",
        },
        {
          title: "3. Review proposals",
          description:
            "When the Quant Agent returns a trade proposal, read the thesis carefully. The reasoning is shown so you can decide whether you agree.",
        },
        {
          title: "4. Check Risk validation",
          description:
            "Every proposal automatically passes through the Risk Agent. If it fails validation, you'll see exactly why and what limit was breached.",
        },
        {
          title: "5. Make your decision",
          description:
            "After all checkpoints pass, you decide whether to execute. Nothing happens automatically — you remain in control.",
        },
      ],
    },
    faq: [
      {
        q: "Can the agents trade on their own?",
        a: "No. All trades require explicit user execution. The agents propose, validate, and report — but you make the final call.",
      },
      {
        q: "What happens if two agents disagree?",
        a: "The CEO Agent surfaces the disagreement to you with both perspectives. You decide. The Risk Agent's veto is absolute on risk grounds.",
      },
      {
        q: "Is this real AI or scripted?",
        a: "Real AI — each agent uses Claude Sonnet with a specific system prompt and constraint set. The structure (which agent runs when) is scripted, but the reasoning is genuine.",
      },
    ],
  },
  {
    slug: "stocks-crypto",
    icon: "🪙",
    title: "Stocks & Crypto",
    tagline: "Trade equities and crypto from one unified interface.",
    shortDesc:
      "Trade stocks via Alpaca. Trade crypto (BTC, XRP, SOL, top 100) via Kraken. Coming: Coinbase, Binance.",
    overview:
      "Most trading platforms force you to pick a lane: stocks OR crypto. Elexa lets you research and paper-trade both from a single dashboard. We integrate directly with Alpaca for US equities (paper API) and Kraken for crypto. Add more exchanges as they come online without rebuilding your workflow. The interface is unified — same risk limits, same journal, same agent team — regardless of which asset class you're trading.",
    benefits: [
      "One platform, multiple asset classes — no context switching",
      "Same risk discipline applied across stocks and crypto",
      "Unified research history and journal",
      "Easy to compare strategies across asset classes",
      "Add exchanges as your needs grow",
    ],
    howItWorks:
      "Each exchange is implemented as a plugin behind a common interface (the IExchange contract). When you place a trade, you select the exchange, and Elexa routes the order through that exchange's API. The Quant Agent can analyse opportunities in either asset class. The Risk Agent applies the same hard limits regardless of asset.",
    details: [
      "Stocks: Alpaca paper trading API (free, paper mode default)",
      "Crypto: Kraken API (free account, paper mode via balance simulation)",
      "Coming soon: Coinbase, Binance, Bitget, KuCoin",
      "Plugin architecture allows easy addition of new exchanges",
      "All exchange credentials stored encrypted",
    ],
    tutorial: {
      title: "How to trade stocks and crypto",
      steps: [
        {
          title: "1. Open the Portfolio page",
          description:
            "From your dashboard, click 'Portfolio' in the left sidebar.",
        },
        {
          title: "2. Pick your exchange",
          description:
            "Use the exchange selector at the top: Alpaca for stocks, Kraken for crypto. You can switch any time.",
        },
        {
          title: "3. Enter the trade details",
          description:
            "Symbol (e.g., AAPL or BTC), quantity, and side (buy or sell). For crypto, fractional quantities are fine (e.g., 0.5 BTC).",
        },
        {
          title: "4. Submit the paper order",
          description:
            "Click 'Submit Paper Order'. The Risk Agent validates automatically. If it passes, the order is placed in paper mode.",
        },
        {
          title: "5. Track your position",
          description:
            "All trades appear in the Journal regardless of asset class. P&L is calculated and tracked centrally.",
        },
      ],
    },
    faq: [
      {
        q: "Can I trade options or futures?",
        a: "Not yet. Options and futures are on the roadmap but require additional risk controls and regulatory considerations.",
      },
      {
        q: "Are crypto trades real or paper?",
        a: "Paper-only by default. Live trading is gated behind LIVE_TRADING_ENABLED=true and requires legal review before activation.",
      },
      {
        q: "Why these specific exchanges?",
        a: "Alpaca and Kraken offer high-quality APIs, paper-trading support, and reasonable rate limits. Both are widely used and well-documented.",
      },
    ],
  },
  {
    slug: "multi-exchange",
    icon: "⚡",
    title: "Multi-Exchange",
    tagline: "Plug in your own keys. Trade where you choose.",
    shortDesc:
      "Plug in your own API keys. We route trades to your choice of exchange. You control the connection.",
    overview:
      "Elexa is not a broker. We do not custody your funds. You connect your own exchange API keys, and we route your trades through them. This means: you choose which exchange you trust, your funds never leave that exchange, and you can revoke access at any time from the exchange's own dashboard. We support multiple exchanges per user, so you can keep your stocks at Alpaca and your crypto at Kraken (or wherever you prefer).",
    benefits: [
      "You control your exchange relationship — no middleman",
      "Funds stay at the exchange, not with us",
      "Switch exchanges without changing your workflow",
      "Easy to revoke access from the exchange's dashboard",
      "Best execution by choosing the right exchange per asset",
    ],
    howItWorks:
      "You generate API keys at your chosen exchange (with paper-trading or limited live permissions). You paste those keys into Elexa's Settings → Exchanges page. Keys are encrypted at rest in our database. When you place a trade, Elexa uses your keys to call the exchange's API directly. We never touch your funds.",
    details: [
      "AES-256 encryption for stored API keys",
      "Keys are decrypted only at the moment of API call",
      "All API calls are logged for your audit trail",
      "Per-exchange permission scopes respected (paper-only by default)",
      "Plugin architecture — adding a new exchange is a discrete pull request",
    ],
    tutorial: {
      title: "How to connect your exchanges",
      steps: [
        {
          title: "1. Generate API keys at your exchange",
          description:
            "For Alpaca: dashboard.alpaca.markets → API Keys → Generate New Key (paper). For Kraken: kraken.com/u/security/api → New Key.",
        },
        {
          title: "2. Set permissions to paper or limited",
          description:
            "Use paper-trading mode if available. If not, scope permissions to read-only or trade-without-withdraw.",
        },
        {
          title: "3. Paste keys into Elexa Settings",
          description:
            "Go to Settings → Exchanges in your dashboard. Paste each key into the appropriate field. They are encrypted before storage.",
        },
        {
          title: "4. Test the connection",
          description:
            "Click 'Test Connection' next to each exchange. You'll see a green check if the keys are valid.",
        },
        {
          title: "5. Trade through your chosen exchange",
          description:
            "When placing a trade, the exchange dropdown shows all your connected exchanges. Pick one and submit.",
        },
      ],
    },
    faq: [
      {
        q: "Are my API keys safe?",
        a: "Keys are encrypted at rest with AES-256. We never log them. We strongly recommend using paper-trading or limited-permission keys.",
      },
      {
        q: "Can Elexa withdraw my funds?",
        a: "Only if you grant withdrawal permissions on your API keys, which we strongly recommend against. Without that permission, withdrawal is impossible.",
      },
      {
        q: "What if my exchange is hacked?",
        a: "Your funds are at the exchange, not with us. We have no exposure to exchange security incidents — but you should still revoke API keys after any incident.",
      },
    ],
  },
  {
    slug: "trade-journal",
    icon: "📓",
    title: "Trade Journal",
    tagline: "Every decision logged. Every reasoning preserved.",
    shortDesc:
      "Every AI decision is logged with full reasoning. Review agent recommendations and outcomes.",
    overview:
      "The Trade Journal is the auditable backbone of Elexa. Every trade you place — and every agent decision that led to it — is logged with timestamps, full prompts, full responses, and outcome data. This creates a complete record you can use for: post-trade review, tax reporting, regulatory audit, strategy debugging, and personal learning. Unlike a typical broker statement (which only shows fills), the Journal shows the entire decision chain.",
    benefits: [
      "Complete audit trail of every decision",
      "Reasoning preserved alongside outcomes",
      "Filter and search across thousands of trades",
      "Export for tax reporting or external review",
      "Critical for learning from your own track record",
    ],
    howItWorks:
      "Every action in Elexa generates a Journal entry: agent runs, trade proposals, risk validations, executions, and outcomes. Entries are linked together so you can trace a trade from the original Quant Agent proposal back through Risk validation to your execution decision. Outcomes (P&L, fill price) are attached when the position closes. You can add your own notes to any entry.",
    details: [
      "Append-only log — entries cannot be edited or deleted",
      "Full-text search across prompts, responses, and notes",
      "Filter by date, symbol, agent, outcome",
      "CSV export for tax reporting",
      "PDF export for archival",
      "Cryptographic hash chain for tamper-evidence (coming soon)",
    ],
    tutorial: {
      title: "How to use the Trade Journal",
      steps: [
        {
          title: "1. Open the Journal",
          description:
            "From your dashboard, click 'Journal' in the left sidebar. You'll see entries in reverse chronological order.",
        },
        {
          title: "2. Filter by what matters",
          description:
            "Use the filter bar to narrow by date, symbol, agent, or outcome. Combine filters (e.g., 'AAPL trades from last month').",
        },
        {
          title: "3. Drill into an entry",
          description:
            "Click any entry to see the full chain: original prompt, agent response, validation result, execution, outcome. Add your own notes.",
        },
        {
          title: "4. Identify patterns",
          description:
            "Use filters to find your most/least profitable setups. Did Quant Agent proposals with 'high' confidence outperform 'medium'? Use the Journal to find out.",
        },
        {
          title: "5. Export for taxes",
          description:
            "At year-end, click 'Export → CSV' to generate a year's worth of trades formatted for tax software (Schedule D ready).",
        },
      ],
    },
    faq: [
      {
        q: "Can I edit a journal entry?",
        a: "No — entries are append-only. You can add notes, but the original record is immutable. This is a design choice for compliance and trust.",
      },
      {
        q: "How long are entries kept?",
        a: "Indefinitely on the Pro plan. Free plan retains 90 days.",
      },
      {
        q: "Can I export to TurboTax?",
        a: "Yes — CSV export is formatted compatibly with most tax software. Schedule D PDF export is on the roadmap.",
      },
    ],
  },
  {
    slug: "risk-management",
    icon: "🛡️",
    title: "Risk Management",
    tagline: "Hard limits enforced server-side. No override.",
    shortDesc:
      "Hard stop-loss limits, max position sizes, daily loss caps. Enforced server-side — no override.",
    overview:
      "Risk management is the difference between sustainable trading and blowing up. Elexa enforces a small set of hard limits at the server level — meaning no client-side trick or AI override can bypass them. The default limits: max position size $5,000, max daily loss $500, max open positions 10, mandatory stop-loss 5%. These are configurable, but every change requires explicit user confirmation. The Risk Agent watches every order and rejects any that violates a limit.",
    benefits: [
      "Hard limits prevent emotional revenge trading",
      "Server-side enforcement means you can't disable mid-loss",
      "Daily loss cap auto-pauses trading after a bad day",
      "Mandatory stop-loss prevents catastrophic single-trade losses",
      "Configurable but with friction — protects you from yourself",
    ],
    howItWorks:
      "Every order placed in Elexa passes through a server-side validation pipeline. The pipeline checks: position size, stop-loss presence, current daily P&L, total open positions, and any custom rules you've set. If any check fails, the order is rejected with a specific reason. You see the rejection in real time. Limit changes require a confirmation step and are logged.",
    details: [
      "Validation runs server-side — cannot be bypassed by the client",
      "Limits configurable in Settings → Risk Limits",
      "Changes require explicit confirmation",
      "All rejections logged in the Journal",
      "Open positions monitored continuously for stop-loss breach",
      "Auto-pause when daily loss cap hit",
    ],
    tutorial: {
      title: "How to use risk management",
      steps: [
        {
          title: "1. Review default limits",
          description:
            "Go to Settings → Risk Limits. Read the defaults. They are intentionally conservative for new traders.",
        },
        {
          title: "2. Adjust if needed",
          description:
            "If your account size justifies different limits, adjust them. You'll be asked to confirm. Don't raise limits in the middle of a losing streak.",
        },
        {
          title: "3. Place a trade and observe",
          description:
            "Try placing a trade that intentionally breaches a limit (e.g., qty too large). You'll see a clear rejection with the reason.",
        },
        {
          title: "4. Watch the risk meter",
          description:
            "Your dashboard shows current risk utilisation as a bar. Green is safe, amber is approaching limits, red is paused.",
        },
        {
          title: "5. Review rejection patterns",
          description:
            "Each week, review the rejected-trades log. Patterns there often reveal habitual mistakes (e.g., consistently trying to oversize).",
        },
      ],
    },
    faq: [
      {
        q: "Can I disable risk limits?",
        a: "No. You can adjust them, but you cannot disable the system entirely. This is by design.",
      },
      {
        q: "What if I lose $500 in one trade?",
        a: "Your daily loss cap is hit. New orders are blocked until midnight UTC. Existing positions can still be closed (to prevent further loss).",
      },
      {
        q: "Are stops guaranteed to fill at the stop price?",
        a: "No — slippage is a real risk, especially on illiquid assets. The system places the stop, but execution depends on the exchange.",
      },
    ],
  },
  {
    slug: "encrypted-keys",
    icon: "🔐",
    title: "Encrypted API Keys",
    tagline: "Your credentials, encrypted. Your trades, audited.",
    shortDesc:
      "Your exchange credentials are stored encrypted. Full audit log of every trade and AI decision.",
    overview:
      "API keys are the keys to your kingdom — anyone with them can place trades on your behalf. Elexa takes their security seriously. Every key you provide is encrypted at rest using AES-256 with per-user encryption keys. We never log or expose them. They are decrypted only at the moment we need to make an API call to the exchange. You can revoke them at any time, either from Elexa's Settings page or directly at the exchange.",
    benefits: [
      "AES-256 encryption at rest",
      "Per-user encryption keys (no shared key compromise)",
      "Keys never logged",
      "Decrypted only at use",
      "Easy revocation from your Settings or the exchange itself",
      "Full audit log of every API call made with your keys",
    ],
    howItWorks:
      "When you submit a key, it is encrypted in your browser before transit to our server. On the server, it is re-encrypted with a per-user master key derived from your account credentials. The encrypted blob is stored in Supabase. To use the key, the server temporarily decrypts it in memory, makes the API call, and discards the plaintext. The plaintext key is never persisted to disk after initial encryption.",
    details: [
      "Encryption: AES-256-GCM",
      "Key derivation: per-user, tied to account",
      "Storage: encrypted blob in Supabase",
      "Decryption: in-memory only, discarded after use",
      "Audit log: every decryption and use logged",
      "Compliance: SOC 2 Type 2 in progress",
    ],
    tutorial: {
      title: "How to manage your encrypted keys",
      steps: [
        {
          title: "1. Add a key",
          description:
            "Go to Settings → Exchanges. Click 'Add Exchange'. Paste your API key and secret. Click 'Save'. The key is encrypted in transit and at rest.",
        },
        {
          title: "2. Test the connection",
          description:
            "Click 'Test Connection' next to the saved exchange. You'll see a green check if Elexa successfully connects.",
        },
        {
          title: "3. View the audit log",
          description:
            "Settings → Audit Log shows every action involving your keys: when they were added, used, rotated, or revoked.",
        },
        {
          title: "4. Rotate keys regularly",
          description:
            "Generate a fresh key at your exchange every 90 days. Replace the old one in Elexa Settings. The exchange's old key can then be revoked.",
        },
        {
          title: "5. Revoke if compromised",
          description:
            "If you suspect compromise, revoke immediately at both Elexa (Settings → Exchanges → Delete) and the exchange (their API key page).",
        },
      ],
    },
    faq: [
      {
        q: "What if Elexa gets hacked?",
        a: "Encrypted blobs in our database are useless without per-user keys, which are derived from credentials we don't store in plaintext. Your keys remain encrypted.",
      },
      {
        q: "Can Elexa staff see my keys?",
        a: "No. Encryption keys are derived per-user. No staff access exists in any production environment.",
      },
      {
        q: "What encryption is used?",
        a: "AES-256-GCM at rest, TLS 1.3 in transit, per-user key derivation tied to account credentials.",
      },
    ],
  },
];

export function getFeature(slug: string): FeatureInfo | undefined {
  return features.find((f) => f.slug === slug);
}
