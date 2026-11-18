# 07 - Decisions

Status values: **Open** (agent must stop and ask), **Proposed** (agent may build with it and must say so in PROGRESS.md), **Confirmed** (fixed; only Cesar changes it).

| ID | Decision | Current value | Status | Blocks |
|---|---|---|---|---|
| D-01 | Product and repo name | `bolivia-freelance-escrow` (working name) | Proposed | T5.2 |
| D-02 | Product idea and scope | Milestone escrow for freelancers with their own clients, as in `01_PRODUCT_SPEC.md` | Confirmed | none |
| D-03 | Platform fee (`fee_bps`) | Not set. Cesar sets it after checking Upwork's current published fees | Open | T2.2 |
| D-04 | USDC on testnet | Own test asset vs Circle testnet USDC (`05_INTEGRATIONS.md`) | Open | T2.1 |
| D-05 | Default review window | Not set. Freelancer chooses per agreement; UI default value to be set | Open | T3.4 |
| D-06 | Max milestones per agreement | 10 | Proposed | T1.2 |
| D-07 | TTL threshold and extend-to values | Follow `soroban-examples/ttl` values | Proposed | T1.1 |
| D-08 | soroban-sdk version | 28.0.0 (matches local soroban-examples) | Proposed | T0.4 |
| D-09 | Pollar scope | Not set. Decided after T4.1 findings | Open | T4.2 |
| D-10 | Frontend stack | Next.js + TypeScript + Tailwind + Stellar Wallets Kit | Proposed | T3.1 |
| D-11 | UI language | Not set (Spanish, English or both) | Open | T3.4 |
| D-12 | Hosting for the live URL | Not set | Open | T5.1 |
| D-13 | Who is the arbiter in the MVP | Platform-controlled testnet identity `bfe-arbiter` | Proposed | T2.2 |
| D-14 | Dispute model | Only the client disputes, only inside the review window; arbiter splits by basis points | Proposed | T1.7 |
| D-15 | Repo license | Not set | Open | T5.4 |
