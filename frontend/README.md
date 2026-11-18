# Frontend (bolivia-freelance-escrow)

Next.js + TypeScript + Tailwind web app for the escrow product.

## Demo mode (default)

`NEXT_PUBLIC_DEMO_MODE=true` (the default) runs a faithful in-browser simulation of
the Soroban escrow contract, so the whole flow works without a wallet, testnet or a
deployed contract:

1. Click **Connect wallet** (top-right) and pick **Freelancer**, **Client** or **Arbiter**.
2. As the Freelancer: **New agreement** → create an agreement with milestones.
3. Switch to **Client** (disconnect, reconnect): open the agreement and **Fund** a milestone.
4. Switch to **Freelancer**: **Submit** work (paste a link).
5. Switch to **Client**: **Approve** (releases the money), or **Dispute** within the window.
6. Switch to **Arbiter**: open the **Arbiter** panel and **Resolve** a dispute.

The mock mirrors the contract's state machine and money math exactly
(see `contracts/escrow/src/lib.rs`). State is kept in your browser's `localStorage`
under the `bfe.*` keys; clear it to reset the demo.

## Run it

> `node_modules` and `.next` break under Google Drive sync. Copy this folder to a
> local, non-synced directory first (see `docs/10_SETUP.md`), then:

```
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

## Real mode (testnet)

After the contract is deployed (task T2.2) and TypeScript bindings are generated
(task T3.3), set `NEXT_PUBLIC_DEMO_MODE=false` and fill the `NEXT_PUBLIC_*` values in
`.env` from `deployments/testnet.json` and the official Stellar docs. The real client
slots into `src/lib/escrow.ts` behind the same `EscrowApi` interface.

## Structure

```
src/
  app/            pages (Home, Dashboard, New agreement, Agreement detail, Arbiter)
  components/     WalletButton, AgreementCard, MilestoneRow, MoneyLocked, TxStatus
  lib/            config, wallet, escrow (mock), format, types, errors
  contracts/      generated bindings (created in T3.3; not present yet)
```
