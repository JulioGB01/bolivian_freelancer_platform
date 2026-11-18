# bolivia-freelance-escrow

Milestone escrow on Stellar for Bolivian freelancers who already have their own clients.

> Status: in development, testnet only. Working name.

## Problem

Freelancers in Bolivia who work for clients at home or abroad start work without proof that the client has the money, depend on the client's goodwill to get paid, and pay platform fees for services they do not use when they already found the client themselves.

## Solution

- The freelancer creates an agreement with milestones.
- The client locks USDC for each milestone in a Soroban smart contract on Stellar.
- The freelancer can see the locked money on chain at any time.
- Money is released when the client approves, automatically claimable when the review window ends without a dispute, or split by an arbiter after a dispute.
- A small platform fee, fixed when the agreement is created.

## How it works

See `docs/01_PRODUCT_SPEC.md` (flows) and `docs/03_CONTRACT_SPEC.md` (contract).

## Try the demo

The frontend ships a **demo mode** (default) that simulates the contract in the browser, so you
can click through the whole flow with no wallet or testnet:

```
cd frontend
npm install
npm run dev
```

Then connect as Freelancer, Client and Arbiter (top-right) and follow `docs/DEMO_SCRIPT.md`.
Copy the repo to a local folder first — `node_modules` breaks under Google Drive sync
(`docs/10_SETUP.md`).

## Repository

| Path | Content |
|---|---|
| `contracts/escrow` | Soroban smart contract (Rust) — implemented, 20/20 tests pass |
| `frontend` | Web app (Next.js) — demo mode + real-mode interface |
| `docs` | Product, architecture and contract specifications, action plan, demo script |
| `scripts` | Checks and testnet deployment |

## Run locally

Setup steps: `docs/10_SETUP.md`.

```
cd contracts
cargo test
```

## Testnet deployment

Contract ids: `deployments/testnet.json` (after deployment).

## Built with

Stellar, Soroban, Stellar Wallets Kit, Pollar (planned).
