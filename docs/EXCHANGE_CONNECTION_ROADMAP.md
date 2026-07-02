# Elexa AI Trading — Exchange Connection Roadmap

## Goal

Give users more choice without making the launch unsafe or overcomplicated.

Elexa should support multiple markets and exchange connection options, but launch mode must stay focused on research, education, journaling and simulation.

## Current Market Position

Elexa supports research and simulated strategy testing across:

- Stocks
- ETFs
- Crypto assets
- Commodity-linked ETFs such as GLD, SLV, USO and UNG

Launch mode should not claim full real-world commodities, forex, options, futures or live money trading unless those products are clearly implemented and reviewed.

## Connection Tiers

### Tier 1 — Demo Mode

No exchange connection required.

Use for:

- Beginners
- Product demos
- Free plan users
- Landing page walkthroughs
- Safe onboarding

### Tier 2 — Read-Only Exchange Connection

Users can connect an exchange account only to view balances, positions, portfolio history or watchlist context.

Rules:

- No order placement
- No withdrawal permission
- No transfer permission
- Show clear warning before entering keys
- Encourage restricted keys only

### Tier 3 — Paper / Sandbox API Connection

Users can connect to a paper/sandbox environment where supported.

Use for:

- Alpaca paper trading
- Kraken or Coinbase sandbox-style testing if supported
- Strategy simulation
- Trade journal learning

### Tier 4 — Future Approved Execution

Real-money execution should remain disabled until all of the following are complete:

- Legal review
- Financial-promotion review for target jurisdictions
- Security review
- Key encryption review
- Audit logging
- User consent flows
- Withdrawal-disabled API enforcement
- Kill switch and risk controls
- Clear terms and risk warnings

## Exchange Roadmap

### Launch/Core

| Platform | Market Type | Safer Launch Use |
|---|---|---|
| Alpaca | Stocks, ETFs, selected crypto | Paper/sandbox simulation |
| Kraken | Crypto | Research and simulation |

### Next Priority

| Platform | Market Type | Recommended Connection |
|---|---|---|
| Coinbase | Crypto | OAuth or restricted API keys |
| Binance | Crypto | Restricted API keys, no withdrawals |
| Bitrue | Crypto, XRP-focused markets where supported | Read-only/watchlist first, restricted API keys later if supported |
| Crypto.com | Crypto | Read-only/research first, restricted API keys only with withdrawals disabled |
| TradingView | Charts/watchlists | Research-only integration |

### Additional Options

| Platform | Market Type | Notes |
|---|---|---|
| Bitpanda | Crypto, stocks/ETFs, metals | Useful for UK/EU style asset coverage |
| Uphold | Crypto and multi-asset | Useful for portfolio/watchlist import if available |
| Bitget | Crypto | Advanced users only; research-first |
| Bybit | Crypto derivatives | Research-only until reviewed |
| OKX | Crypto | Research-first, no live execution at launch |
| Interactive Brokers | Stocks, ETFs, options, futures, forex | Serious future option but high compliance burden |

## API Key Safety Rules

Users should only ever connect keys that are:

- Read-only, or
- Paper/sandbox only, or
- Trading-only with withdrawals disabled, if future execution is legally approved

Never allow or request API keys with:

- Withdrawal permission
- Transfer permission
- Full account control
- Unrestricted trading without clear risk controls

## User-Facing Wording

Use this wording:

> Connect in demo mode, read-only mode or paper/sandbox mode. Elexa is designed to help you research markets, test strategies and review risk before making decisions elsewhere. Launch mode does not place real-money trades.

Avoid:

- Connect your exchange and let AI trade for you
- Turn on live auto-trading
- Copy our signals
- Guaranteed returns
- Passive income bot

## Build Priority

1. Keep demo mode working without keys.
2. Add clear exchange connection cards.
3. Add read-only connection explanation.
4. Add warning: never use withdrawal-enabled keys.
5. Add Alpaca paper/sandbox as the first practical connection.
6. Add Kraken, Coinbase, Bitrue and Crypto.com crypto research connectors.
7. Add Binance and TradingView chart/watchlist layers.
8. Only consider live execution after legal and security review.
