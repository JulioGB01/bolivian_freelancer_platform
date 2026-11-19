# Product

## Users

| User | Who | Main need |
|---|---|---|
| Freelancer | Bolivian professional with clients of their own | See the money locked before working; get paid without chasing; low flat fee (1.5%); easy BOB off-ramp and payment proof |
| Client | Person or company that hired the freelancer, in Bolivia or abroad | Pay only for delivered work; protection against freelancer ghosting (`Funded` dispute) and bad work (`Submitted` dispute) |
| Arbiter | Pinned per agreement at creation (platform team in MVP; 2-of-3 vetted pool in SCF roadmap) | Settle disputes fairly by splitting locked funds between both parties |

## User stories (MVP)

| ID | As a | I want to | So that |
|---|---|---|---|
| US-01 | Freelancer | connect my Stellar wallet (or try demo mode) | the app knows my address |
| US-02 | Freelancer | create an agreement with a title, my client's address, review window (1h–30d), and 1 to 10 milestones with amounts | the terms, fee (1.5%), and arbiter are frozen on chain |
| US-03 | Freelancer | share a link to the agreement with my client | the client can review and fund it |
| US-04 | Client | open the link, connect my wallet and fund a milestone | the money is locked in a non-custodial contract |
| US-05 | Freelancer | see each milestone's status and the locked amount on `/verificar/[id]` and Stellar Expert | I can verify the money myself before starting |
| US-06 | Freelancer | submit a milestone with a link to my work | the client can review it |
| US-07 | Client | approve a submitted milestone | the freelancer gets paid (minus 1.5% fee) |
| US-08 | Freelancer | claim a submitted milestone after the review window if the client did not answer | I am not blocked by silence |
| US-09 | Client | dispute a submitted milestone inside the review window — or dispute a funded milestone if the freelancer ghosts | bad work is not paid automatically and funds are never locked forever |
| US-10 | Arbiter | split a disputed milestone between both sides (0–100%) | disputes end cleanly and on-chain stats record the exact split |
| US-11 | Freelancer | refund a funded or submitted milestone to the client | we can cancel fairly with 0% fee |
| US-12 | Freelancer or client | see a list of my agreements by role | I find them again quickly |
| US-13 | Freelancer | see the 1.5% fee before creating the agreement | there are no surprises |
| US-14 | Freelancer | convert released USDC to bolivianos via Pollar (QR Simple), save with Vaquita, and download a SIAT payment receipt | I can spend in BOB, save in USD, and document export-of-services income |

## Main flow

```
Freelancer creates agreement ──> shares link ──> Client funds milestone 1
     │                                                   │
     │                                     money locked in contract
     │                                     ├─ Client disputes (anti-ghosting) ──> arbiter splits
     ▼                                     │
Freelancer submits milestone 1 with evidence link <──────┘
     │
     ├─ Client approves ─────────────> paid to freelancer (minus 1.5% fee)
     ├─ Review window ends, no answer > freelancer claims, paid (minus 1.5% fee)
     ├─ Client disputes (in window) ─> arbiter splits (0–100%, fee only on freelancer's share)
     └─ Freelancer refunds ──────────> full amount back to client (0% fee)
                                                │
                                                ▼
                     Post-release: Pollar BOB QR off-ramp · Vaquita savings · SIAT receipt
```

Repeat per milestone.

## Screens (App Router)

| Screen | Path | Who |
|---|---|---|
| Home | `/` | Everyone: value prop, live on-chain protocol stats, mode overview, CTA to `/app` |
| How it works & Comparison | `/como-funciona` | Everyone: step-by-step by role, 1.5% fee vs Upwork / Trustless Work / WhatsApp QR, non-custodial guarantees |
| Public proof | `/verificar/[id]` | Anyone (no wallet): locked funds, pinned arbiter & fee, milestone statuses, on-chain activity |
| Freelancer profile | `/perfil/[address]` | Anyone (no wallet): public on-chain track record (released + resolved milestones, total earned, disputes, trust level) |
| App entry | `/app` | Workspace shell with mode banner, wallet switcher, and role tabs |
| Freelancer area | `/app/freelancer` | My agreements as freelancer |
| Client area | `/app/cliente` | Proposals to accept and active agreements as client |
| Arbiter panel | `/app/arbitro` | Queue of disputed milestones (`Funded` or `Submitted`) |
| New agreement | `/app/nuevo` | Freelancer: create an agreement with 1–10 milestones and review window |
| Agreement detail | `/app/acuerdo/[id]` | Both parties and arbiter; guided invitation for client; post-release Pollar/Vaquita/SIAT actions for freelancer |
| Wallet setup | `/app/billetera` | Testnet onboarding: Friendbot test XLM, USDC trustline, test-USDC faucet |

## Out of scope (MVP)

Marketplace and job search, chat, file storage (the evidence field holds a URL link), mainnet real money, and any kind of credit or lending.
