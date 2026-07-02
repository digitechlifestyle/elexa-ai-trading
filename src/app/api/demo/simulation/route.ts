import { NextResponse } from "next/server";

type DemoRequest = {
  focus?: string;
  symbols?: string[];
};

const allowedFocus = new Set(["crypto", "stocks", "etfs", "mixed"]);

function cleanSymbols(symbols: unknown): string[] {
  if (!Array.isArray(symbols)) return [];

  return symbols
    .map((symbol) => String(symbol).trim().toUpperCase())
    .filter((symbol) => /^[A-Z0-9.:-]{1,12}$/.test(symbol))
    .slice(0, 30);
}

function buildRiskNotes(focus: string, symbols: string[]) {
  const stablecoins = symbols.filter((symbol) =>
    ["USDT", "USDC", "RLUSD", "PYUSD", "FDUSD", "DAI", "USDE"].includes(symbol)
  );

  const notes = [
    "This is a demo simulation only. It is not financial advice and does not place trades.",
    "Use the result to organise research, not to decide whether to buy or sell.",
  ];

  if (focus === "crypto" || focus === "mixed") {
    notes.push("Crypto assets can be highly volatile and may lose most or all of their value.");
  }

  if (focus === "stocks" || focus === "mixed") {
    notes.push("Stocks can fall sharply around earnings, macro news, liquidity changes and sector rotation.");
  }

  if (focus === "etfs" || focus === "mixed") {
    notes.push("ETFs can still carry market, sector, commodity, bond or liquidity risk.");
  }

  if (stablecoins.length > 0) {
    notes.push(
      `Stablecoin watchlist item(s) detected: ${stablecoins.join(", ")}. Stablecoins can still carry issuer, reserve, liquidity, regulatory and de-peg risk.`
    );
  }

  return notes;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as DemoRequest;
    const focus = allowedFocus.has(String(body.focus)) ? String(body.focus) : "mixed";
    const symbols = cleanSymbols(body.symbols);

    if (symbols.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "Add at least one valid symbol to run the demo simulation.",
        },
        { status: 400 }
      );
    }

    const primarySymbol = symbols[0];
    const response = {
      ok: true,
      mode: "demo",
      focus,
      symbolCount: symbols.length,
      primarySymbol,
      symbols,
      summary: `Demo simulation complete for ${symbols.length} watchlist symbol(s). Primary research focus: ${primarySymbol}.`,
      researchPlan: [
        "Review market context and recent catalysts.",
        "Check volatility, liquidity and concentration risk.",
        "Compare the idea against the rest of the watchlist.",
        "Record the reason for the idea in a journal before taking any real-world action elsewhere.",
      ],
      riskNotes: buildRiskNotes(focus, symbols),
      nextAction:
        "Continue research in demo mode. Do not connect real funds or use withdrawal-enabled API keys.",
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "The demo simulation could not read the request. Try again with a valid watchlist.",
      },
      { status: 400 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "Demo simulation API is running. Use POST with { focus, symbols } to run a demo simulation.",
  });
}
