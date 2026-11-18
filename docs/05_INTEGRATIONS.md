# 05 - Integrations

Status of each external piece. "Verified" means checked in a local repo or official docs; anything else must be verified before coding.

## Stellar testnet

| Item | Status | How to get it |
|---|---|---|
| Stellar CLI | Install, then record version in PROGRESS.md | Official Stellar developer docs |
| Test identities (admin, arbiter, freelancer, client) | Create in T0.3 | `stellar keys --help` (generate with testnet funding) |
| RPC URL and passphrase | Not recorded yet | `stellar network ls` or official docs |
| Build target | Verified: `wasm32v1-none` | `soroban-examples/rust-toolchain.toml` |
| Build command | Verified: `stellar contract build` | `soroban-examples/timelock/Makefile` |

## USDC on testnet (decision D-04)

Two options:

1. **Own test asset** called `USDC`, issued by our admin identity and wrapped in a Stellar Asset Contract, so we can mint test balances to the client freely.
2. **Circle's testnet USDC**: issuer address must be taken from Circle's official docs; minting depends on Circle's faucet.

The contract does not care which: it receives the token contract address in `initialize`.

## Stellar Wallets Kit

- Verified from the local README: install with `npx jsr add @creit-tech/stellar-wallets-kit`; `StellarWalletsKit.init({ modules: defaultModules() })`; `getAddress()`; `signTransaction(xdr, { networkPassphrase, address })`.
- The README lists Freighter under the name "Varial, formerly Freighter".
- Check `examples/nextjs` in the local repo for Next.js usage before writing `lib/wallet.ts`.

## Pollar (phase 4, decision D-09)

What the team's research recorded (sources in `G:\My Drive\20 PROJECTS\NATIONAL STARTUP 2026\BOLIVIA\06_STELLAR_IN_BOLIVIA.md`, retrieved 2026-11-18):

- Packages `@pollar/core` (0.12.0 at retrieval) and `@pollar/react`; Node.js 20+, React 18+.
- Publishable API key from dashboard.pollar.xyz; testnet works instantly; live mode needs identity verification.
- `PollarProvider`, `login(...)` provisions a Stellar address (testnet default).
- `runTx('payment', ...)` for payments; ramp APIs `getRampRoutes`, `quoteRamp`, `createRampOrder` (0.12.0).
- Bank QR in Bolivia is live; route BOB to USDC on Stellar is multi-hop (bank QR, Stereum to USDT on Polygon, swap, bridge to USDC on Stellar).
- Docs: https://docs.pollar.xyz/docs/getting-started/quickstart and https://docs.pollar.xyz/docs/operator-guide/ramps/routes. Open-source SDK: github.com/pollar-xyz/pollar.

Not known: whether ramp APIs return usable data on testnet; whether Pollar wallets can sign calls to our own Soroban contract. Task T4.1 answers these before any Pollar code is written.

## Block explorer

Needed for the "see the money" link. The explorer URL must be verified (open it and confirm it shows a testnet contract) before it goes in `.env.example`.
