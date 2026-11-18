---
name: stellar-frontend
description: Use for any change in frontend/ - Next.js pages, wallet connection, calling the escrow contract, showing balances and status.
---

# Working on the frontend

## Before coding

- Read `docs/04_FRONTEND_SPEC.md` and `docs/01_PRODUCT_SPEC.md`.
- For wallet code, read `Creit-Tech__Stellar-Wallets-Kit/README.md` and `examples/nextjs` in the local repos.
- For a Next.js + Stellar reference, read `ShoeSafari-Org__ShoeSafari` (app/, components/, lib/).

## Rules

- Never hold or ask for a secret key in the browser. All signing goes through the wallet.
- Contract calls go through `src/lib/escrow.ts`, which wraps the generated bindings. Pages never build transactions directly.
- Regenerate bindings after every contract interface change; never edit them by hand.
- Wallet-kit code runs only in the browser (client components); guard against server-side rendering.
- All config from `src/lib/config.ts`; throw a clear error if an env var is missing.
- Amounts: 7 decimals; convert only in `src/lib/format.ts`.
- After a transaction, re-read state from the contract and show it.

## Checks (run in `frontend/`)

```
npm run lint
npm run build
```
