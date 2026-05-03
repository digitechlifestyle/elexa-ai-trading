export interface AgentInfo {
  slug: string;
  name: string;
  emoji: string;
  color: string;
  role: string;
  tagline: string;
  overview: string;
  responsibilities: string[];
  howItWorks: string;
  constraints: string[];
  tutorial: {
    title: string;
    steps: { title: string; description: string }[];
  };
  exampleOutput: string;
}

export const agents: AgentInfo[] = [
  {
    slug: "ceo",
    name: "CEO Agent",
    emoji: "👔",
    color: "indigo",
    role: "Delegates tasks, summarises board briefings",
    tagline: "The strategic orchestrator of the AI team.",
    overview:
      "The CEO Agent is the executive layer of the Elexa AI system. It sits above all other specialised agents and acts as the central coordinator of trading research, strategic decisions, and high-level reporting. Unlike the Quant Agent (which proposes ideas) or the Risk Agent (which validates them), the CEO Agent never executes trades directly. Its role is exclusively delegation, synthesis, and oversight. Every morning, the CEO Agent produces a board-style briefing summarising overnight market action, the team's open positions, risk utilisation, and any compliance flags. It then sets the daily research agenda — for example, instructing the Quant Agent to investigate a specific sector or the Compliance Agent to review newly regulated terminology.",
    responsibilities: [
      "Generate daily board briefings summarising overnight markets and team activity",
      "Delegate research tasks to specialised agents based on user goals",
      "Synthesise output from multiple agents into a unified recommendation",
      "Monitor team performance and flag underperforming research streams",
      "Provide executive summaries to users in plain English",
      "Escalate edge cases and ambiguous decisions to the human user",
    ],
    howItWorks:
      "When you log in, the CEO Agent automatically reviews the last 24 hours of activity from all other agents. It uses Claude Sonnet to synthesise a structured briefing in five sections: (1) Market Overview, (2) Open Position Status, (3) Agent Recommendations, (4) Risk Posture, and (5) Action Items for Today. Users can ask the CEO Agent natural-language questions ('What did the team do yesterday?', 'Why did we open that AAPL position?') and it will surface the relevant agent logs and decisions.",
    constraints: [
      "Cannot place trades — only the trade execution layer can place orders",
      "Cannot override Risk Agent decisions",
      "Cannot bypass Compliance Agent flags",
      "All recommendations are clearly labelled as research, not financial advice",
    ],
    tutorial: {
      title: "How to use the CEO Agent",
      steps: [
        {
          title: "1. Open the Agents tab",
          description:
            "Sign in to your dashboard, click 'Agents' in the left sidebar, then select 'CEO Agent' from the list.",
        },
        {
          title: "2. Request a daily briefing",
          description:
            "Click the 'Generate Daily Briefing' button. The CEO Agent will compile a structured report in around 10–15 seconds. You can optionally specify a focus area in the prompt box (e.g., 'Focus on tech stocks').",
        },
        {
          title: "3. Ask follow-up questions",
          description:
            "After the briefing appears, type a follow-up in the chat box — for example 'Why is the Risk Agent flagging TSLA?' or 'Summarise what the Quant Agent worked on this week'. The CEO Agent will pull relevant logs and answer.",
        },
        {
          title: "4. Delegate a task",
          description:
            "Use the 'Delegate' menu to assign work to a specific agent. Example: 'Tell the Quant Agent to research semiconductor momentum for next 7 days'. The task is queued and tracked in the audit log.",
        },
        {
          title: "5. Review the audit trail",
          description:
            "Every CEO Agent decision is logged in the Journal tab. Click any briefing or delegation to see the full prompt, response, and timestamp — useful for compliance and reviewing strategy over time.",
        },
      ],
    },
    exampleOutput:
      "Morning briefing — 7:30 AM ET. Markets opened mixed; SPY +0.3%, QQQ +0.5%. Open positions: 4 (3 longs, 1 short), risk utilisation 62%. Quant Agent flagged unusual momentum in MSFT (recommend monitoring). Compliance Agent cleared yesterday's blog draft. Action items: review MSFT thesis, decide on AAPL trim before earnings Thursday.",
  },
  {
    slug: "quant",
    name: "Quant Agent",
    emoji: "📊",
    color: "violet",
    role: "Analyses signals, proposes trade ideas",
    tagline: "The research analyst that never sleeps.",
    overview:
      "The Quant Agent is the analytical engine of Elexa. It continuously scans market data, technical indicators, and historical patterns to identify potential trading opportunities. Every trade idea originates here. The Quant Agent does not execute — it proposes. Each proposal includes a ticker, a thesis, an entry price, a stop-loss level, a target, and a confidence score. Proposals are passed to the Risk Agent for validation before any execution can occur. The agent uses a combination of momentum signals, mean-reversion logic, volume analysis, and basic fundamental screens. It is explicitly prohibited from making predictions about specific price levels with confidence claims — its output is always framed as 'research' rather than 'forecast'.",
    responsibilities: [
      "Scan markets for technical and quantitative trade setups",
      "Generate trade proposals with full reasoning and risk parameters",
      "Backtest proposed strategies on historical data when requested",
      "Monitor open positions and flag thesis-breaks",
      "Maintain a research log of ideas tried, accepted, and rejected",
      "Provide reasoning in plain English (no jargon-only outputs)",
    ],
    howItWorks:
      "The Quant Agent receives a task (either from the CEO Agent or directly from the user). It pulls market data via the configured exchange API (Alpaca for stocks, Kraken for crypto), runs its analysis pipeline, and produces a structured proposal. Each proposal contains: thesis (2–3 sentences), entry zone, stop-loss, profit target, position size suggestion, and confidence (low/medium/high). The proposal is then automatically routed to the Risk Agent.",
    constraints: [
      "Cannot place trades directly — only proposes",
      "Cannot recommend position sizes above the configured limit",
      "Cannot use language like 'guaranteed' or 'risk-free'",
      "Must include a stop-loss in every proposal",
      "All outputs are tagged as research, not financial advice",
    ],
    tutorial: {
      title: "How to use the Quant Agent",
      steps: [
        {
          title: "1. Open the Quant Agent",
          description:
            "From your dashboard, navigate to Agents → Quant Agent.",
        },
        {
          title: "2. Submit a research request",
          description:
            "In the prompt box, type a research question. Examples: 'Find momentum setups in tech stocks', 'Analyse BTC for a swing trade this week', 'Is AAPL overbought?'. Click 'Run Analysis'.",
        },
        {
          title: "3. Review the proposal",
          description:
            "The Quant Agent will return a structured proposal with thesis, entry, stop, target, and confidence. Read it carefully — the reasoning is shown so you can decide whether you agree.",
        },
        {
          title: "4. Pass to Risk Agent",
          description:
            "If you like the proposal, click 'Validate with Risk Agent'. The Risk Agent will check it against your hard limits (position size, daily loss, stop-loss percentage).",
        },
        {
          title: "5. Decide and execute",
          description:
            "If validation passes, you can manually execute the paper trade from the Portfolio page. The full chain (Quant proposal → Risk validation → your decision) is logged for audit.",
        },
      ],
    },
    exampleOutput:
      "PROPOSAL: AAPL long. Thesis: Pulled back to 50-day MA after earnings, RSI oversold at 32, volume profile shows support at $182. Entry: $183.50–$184. Stop: $179.50 (2.2%). Target: $192 (4.6%). Confidence: medium. R:R 2.1:1. Notes: avoid if SPY breaks below 50-day.",
  },
  {
    slug: "risk",
    name: "Risk Agent",
    emoji: "🛡️",
    color: "rose",
    role: "Validates against stop-loss and position limits",
    tagline: "The non-negotiable guardrails on every trade.",
    overview:
      "The Risk Agent is the most important agent in the Elexa system. It is the final checkpoint before any trade can proceed. Its job is simple but critical: enforce the hard risk limits configured in your account. These limits cannot be overridden by the user or any other agent. If the Risk Agent rejects a proposal, that proposal cannot execute. The default limits are: maximum position size $5,000, maximum daily loss $500, maximum open positions 10, mandatory stop-loss 5%. Limits are enforced server-side — the client cannot bypass them. The Risk Agent also monitors open positions in real time and will trigger automatic exits if a stop-loss is breached.",
    responsibilities: [
      "Validate every trade proposal against configured limits",
      "Reject any trade that violates a hard limit",
      "Monitor open positions and trigger stop-loss exits",
      "Track cumulative daily P&L and freeze new trades if daily loss limit is hit",
      "Provide clear rejection reasons (no silent failures)",
      "Maintain an immutable audit log of every validation",
    ],
    howItWorks:
      "When the Quant Agent (or user) submits a trade, the Risk Agent runs a validation pipeline: (1) check position size against max position limit, (2) check stop-loss is present and within bounds, (3) check current daily P&L against daily loss cap, (4) check total open positions against max open positions, (5) check that the order does not violate any custom rules you have set. If all checks pass, validation succeeds and the order can be placed. If any check fails, the order is rejected with a specific reason.",
    constraints: [
      "Cannot be overridden — even by you, the user",
      "Cannot approve trades that exceed configured limits",
      "Cannot disable itself",
      "Limits can only be changed in account Settings (with a confirmation step)",
    ],
    tutorial: {
      title: "How to use the Risk Agent",
      steps: [
        {
          title: "1. Configure your limits",
          description:
            "Go to Settings → Risk Limits. Set your maximum position size, daily loss cap, max open positions, and stop-loss percentage. Defaults are conservative and recommended for new users.",
        },
        {
          title: "2. Submit a trade for validation",
          description:
            "Either via the Quant Agent or manually from the Portfolio page, submit an order. The Risk Agent runs automatically before any execution.",
        },
        {
          title: "3. Read the validation result",
          description:
            "If the trade passes, you'll see a green confirmation. If it fails, you'll see a clear error like 'Position size $6,200 exceeds limit $5,000' or 'Daily loss limit reached — no new trades today'.",
        },
        {
          title: "4. Monitor live positions",
          description:
            "From the Dashboard, the Risk Agent shows your current risk utilisation as a percentage. If you approach a limit, the bar turns amber. If you breach, it turns red and trading is paused.",
        },
        {
          title: "5. Review rejection log",
          description:
            "All rejected trades are logged in the Journal tab. Reviewing them is one of the best ways to learn risk discipline — see what you tried to do that the system blocked, and why.",
        },
      ],
    },
    exampleOutput:
      "REJECTED — Order: BUY 50 TSLA @ $245. Reason: Position size $12,250 exceeds maximum position size $5,000. Suggested adjustment: reduce quantity to 20 shares ($4,900). To change your limits, visit Settings → Risk Limits.",
  },
  {
    slug: "compliance",
    name: "Compliance Agent",
    emoji: "⚖️",
    color: "amber",
    role: "Flags regulated language and legal risks",
    tagline: "Your in-house legal review, automated.",
    overview:
      "Trading platforms operate in a heavily regulated environment. Phrases like 'guaranteed profit', 'risk-free returns', or 'beat the market' can trigger regulatory scrutiny under SEC, FINRA, and CFTC rules. The Compliance Agent is your in-house legal review layer. It scans every piece of content the system produces — agent outputs, blog posts, marketing copy, support replies — and flags potentially problematic language before it reaches a user. It does not provide legal advice; it provides a first-pass review against known regulatory red flags. For anything substantive, you should consult a securities attorney.",
    responsibilities: [
      "Scan all user-facing text for regulated language",
      "Flag specific phrases and suggest compliant alternatives",
      "Maintain a regularly updated database of red-flag terms",
      "Block publication of content that fails review",
      "Provide reasoning for every flag",
      "Audit the SEO Agent's blog drafts before they go live",
    ],
    howItWorks:
      "The Compliance Agent uses a hybrid approach: a curated keyword list for high-confidence flags (e.g., 'guaranteed', 'risk-free'), plus a Claude-powered semantic review for context-dependent issues (e.g., implied promises of return). Every output of every other agent passes through this layer. If a flag is raised, the offending text is highlighted, a reason is provided, and a suggested rewrite is offered. The user can accept the rewrite, write their own, or override (with the override logged for audit).",
    constraints: [
      "Cannot guarantee full legal compliance — supplements, not replaces, legal review",
      "Cannot publish content if a high-severity flag is unresolved",
      "Operates in advisory mode for low-severity flags",
      "Logs every flag and override to an immutable audit trail",
    ],
    tutorial: {
      title: "How to use the Compliance Agent",
      steps: [
        {
          title: "1. Open the Compliance Agent",
          description:
            "Navigate to Agents → Compliance Agent in your dashboard.",
        },
        {
          title: "2. Submit text for review",
          description:
            "Paste any text — a tweet, a blog post, an email — into the prompt box. Click 'Review for Compliance'.",
        },
        {
          title: "3. Read the review",
          description:
            "The agent returns a list of flags with: the offending phrase, the regulation it may breach, severity (low/medium/high), and a suggested rewrite.",
        },
        {
          title: "4. Apply rewrites",
          description:
            "Click 'Accept Suggestion' to swap in the compliant version. Or write your own rewrite. The agent will re-review until clean.",
        },
        {
          title: "5. Use the running audit log",
          description:
            "All reviews are stored in the Journal. If you ever face a regulatory question, you have a complete record of what was reviewed, when, and what was changed.",
        },
      ],
    },
    exampleOutput:
      "FLAG (high severity): 'Our system delivers consistent profits.' Issue: implies guarantee of returns, may breach SEC Rule 156. Suggested rewrite: 'Our research aims to identify trading opportunities; past results do not guarantee future performance.' FLAG (low severity): 'Beat the market' — consider 'Aims to outperform the benchmark in research scenarios'.",
  },
  {
    slug: "seo",
    name: "SEO Agent",
    emoji: "📝",
    color: "emerald",
    role: "Generates compliant blog and keyword content",
    tagline: "Educational content that ranks and complies.",
    overview:
      "The SEO Agent produces educational content for the Elexa blog and marketing pages. Its goal is to drive organic traffic from people researching trading concepts — not to make trading recommendations. Every blog post is structured around an educational topic ('What is paper trading?', 'How does a stop-loss work?', 'Understanding RSI'). The agent is explicitly prohibited from publishing content that gives specific trade ideas or makes price predictions. All output passes through the Compliance Agent before publication.",
    responsibilities: [
      "Generate keyword-research-driven blog topics",
      "Write long-form educational articles (1,500–3,000 words)",
      "Optimise meta descriptions, titles, and headings for search",
      "Structure articles with schema markup for rich results",
      "Create internal link suggestions",
      "Pass every draft through the Compliance Agent",
    ],
    howItWorks:
      "The SEO Agent receives a topic (from you or from the CEO Agent). It pulls keyword data, drafts an outline, then writes the full article. The article is structured for both readers and search engines: clear H2/H3 hierarchy, scannable paragraphs, no fluff. Once the draft is complete, it is automatically routed to the Compliance Agent. After clearing compliance, the article is queued for your review and approval before publication.",
    constraints: [
      "Cannot publish trade recommendations or price predictions",
      "Cannot bypass the Compliance Agent",
      "Must include risk disclosures in finance-related articles",
      "Cannot scrape or republish copyrighted content",
    ],
    tutorial: {
      title: "How to use the SEO Agent",
      steps: [
        {
          title: "1. Open the SEO Agent",
          description: "Navigate to Agents → SEO Agent.",
        },
        {
          title: "2. Pick a topic",
          description:
            "Either type your own topic ('Beginner's guide to paper trading') or use the 'Suggest Topics' button to get keyword-driven suggestions ranked by search volume and difficulty.",
        },
        {
          title: "3. Generate the draft",
          description:
            "Click 'Generate Article'. The agent will produce a full draft in 30–60 seconds, including title, meta description, headings, and body.",
        },
        {
          title: "4. Review the compliance check",
          description:
            "The article automatically passes through the Compliance Agent. Any flags are shown alongside the draft.",
        },
        {
          title: "5. Publish or refine",
          description:
            "Once compliant, you can publish directly, or edit the draft yourself and resubmit. All published articles appear at /blog and are indexed in your sitemap.",
        },
      ],
    },
    exampleOutput:
      "Title: 'What is Paper Trading? A Beginner's Guide (2026)'. Meta: 'Learn what paper trading is, how it works, and why every trader should master it before risking real capital.' Word count: 2,340. H2 sections: What is paper trading, How it differs from live trading, Setting up your first paper account, Common mistakes, When to graduate to live. Compliance: cleared.",
  },
  {
    slug: "support",
    name: "Support Agent",
    emoji: "💬",
    color: "sky",
    role: "Answers user questions about the platform",
    tagline: "24/7 product support, never investment advice.",
    overview:
      "The Support Agent is your first point of contact for any platform question. It can explain features, walk you through setup, troubleshoot common issues, and help you understand error messages. Critically, the Support Agent does not give financial advice. If a user asks 'should I buy AAPL?', the Support Agent will redirect them to the Quant Agent (for research) and recommend consulting a licensed financial advisor for personal decisions. All Support Agent conversations are logged for quality, training, and compliance audit.",
    responsibilities: [
      "Answer questions about platform features and how to use them",
      "Walk users through onboarding and setup",
      "Diagnose and explain error messages",
      "Hand off complex issues to human support when escalated",
      "Refuse to provide financial advice and explain why",
      "Log every conversation for compliance and improvement",
    ],
    howItWorks:
      "The Support Agent is available from a chat icon in the bottom-right of every page in your dashboard. It uses Claude to understand questions and pulls from a curated knowledge base of platform documentation, FAQs, and known issues. If a question is outside its scope (e.g., 'is now a good time to buy gold?'), it provides a polite redirect with the appropriate caveats.",
    constraints: [
      "Cannot give financial, tax, or legal advice",
      "Cannot access another user's data",
      "Cannot make changes to risk limits — that requires user confirmation in Settings",
      "Escalates to human support for billing and account security issues",
    ],
    tutorial: {
      title: "How to use the Support Agent",
      steps: [
        {
          title: "1. Open the chat",
          description:
            "Click the chat icon in the bottom-right of any dashboard page.",
        },
        {
          title: "2. Ask your question",
          description:
            "Type any question about the platform: 'How do I place a paper trade?', 'Why was my order rejected?', 'How do I change my risk limits?'.",
        },
        {
          title: "3. Follow the answer",
          description:
            "The agent provides a step-by-step answer, often with screenshots or links to the relevant page. Click any link to jump straight there.",
        },
        {
          title: "4. Escalate if needed",
          description:
            "If the agent can't resolve your issue (e.g., billing dispute, possible security incident), type 'escalate' and a human team member will follow up via email within 24 hours.",
        },
        {
          title: "5. Review your chat history",
          description:
            "All your past conversations are saved under Settings → Support History. Useful for re-finding answers or providing context to a human agent.",
        },
      ],
    },
    exampleOutput:
      "User: 'How do I place my first paper trade?' Support Agent: 'Sure! Go to Dashboard → Portfolio. Pick an exchange (Alpaca for stocks, Kraken for crypto). Enter a symbol (e.g., AAPL), a quantity (e.g., 10), and click Buy. Then click Submit Paper Order. You'll see a confirmation and the trade appears in your Journal. Want me to walk through it live?'",
  },
];

export function getAgent(slug: string): AgentInfo | undefined {
  return agents.find((a) => a.slug === slug);
}
