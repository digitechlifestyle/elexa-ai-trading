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
| TradingView | Charts, watchlists, indicators | Research layer only |
| Kraken | Crypto | Research and simulation |

### Next Priority

| Platform | Market Type | Recommended Connection |
|---|---|---|
| Coinbase | Crypto | OAuth or restricted API keys |
| Binance | Crypto | Restricted API keys, no withdrawals |
| Bitget | Crypto spot, copy-trading context, derivatives research | Read-only/watchlist first, derivatives research-only |
| Bybit | Crypto spot and derivatives research | Read-only/research first, no live derivatives execution |
| OKX | Crypto spot, Web3 and derivatives research | Restricted/read-only keys, no withdrawals |
| BYDFi | Crypto spot, copy-trading and derivatives research | Research-only first, no copy-trading automation at launch |
| Bitrue | Crypto, XRP-focused markets where supported | Read-only/watchlist first, restricted API keys later if supported |
| Crypto.com | Crypto | Read-only/research first, restricted API keys only with withdrawals disabled |

### Additional Options

| Platform | Market Type | Notes |
|---|---|---|
| Robinhood | Retail stocks, ETFs, options and crypto where regionally available | Familiar retail investing context; research/watchlist first |
| Bitpanda | Crypto, stocks/ETFs, metals | Useful for UK/EU style asset coverage |
| Uphold | Crypto and multi-asset | Useful for portfolio/watchlist import if available |
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
6. Add TradingView chart/watchlist research layer.
7. Add read-only crypto portfolio/watchlist connectors for Kraken, Coinbase, Binance, Bitget, Bybit, OKX, BYDFi, Bitrue and Crypto.com.
8. Add Robinhood, Bitpanda, Uphold and Interactive Brokers as later research/watchlist options.
9. Only consider live execution after legal and security review.
