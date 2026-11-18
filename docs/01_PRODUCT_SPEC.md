# 01 - Product Spec

## Users

| User | Who | Main need |
|---|---|---|
| Freelancer | Bolivian professional with clients of their own | Know the money exists before working; get paid without chasing; low fee |
| Client | Person or company that hired the freelancer, in Bolivia or abroad | Pay only for delivered work; a way to object to bad work |
| Arbiter | The platform team in the MVP | Settle disputes |

## User stories (MVP)

| ID | As a | I want to | So that |
|---|---|---|---|
| US-01 | Freelancer | connect my Stellar wallet | the app knows my address |
| US-02 | Freelancer | create an agreement with a title, my client's address and 1 to 10 milestones with amounts | the terms are fixed on chain |
| US-03 | Freelancer | share a link to the agreement with my client | the client can review and fund it |
| US-04 | Client | open the link, connect my wallet and fund a milestone | the money is locked |
| US-05 | Freelancer | see each milestone's status and the locked amount, with a link to the block explorer | I can verify the money myself |
| US-06 | Freelancer | submit a milestone with a link to my work | the client can review it |
| US-07 | Client | approve a submitted milestone | the freelancer gets paid |
| US-08 | Freelancer | claim a submitted milestone after the review window if the client did not answer | I am not blocked by silence |
| US-09 | Client | dispute a submitted milestone inside the review window with a reason | bad work is not paid automatically |
| US-10 | Arbiter | split a disputed milestone between both sides | disputes end |
| US-11 | Freelancer | refund a funded milestone to the client | we can cancel fairly |
| US-12 | Freelancer or client | see a list of my agreements | I find them again |
| US-13 | Freelancer | see the fee before creating the agreement | there are no surprises |
| US-14 | Freelancer | see how to convert my USDC to bolivianos | I can spend my money (scope depends on decision D-09) |

## Main flow

```
Freelancer creates agreement ──> shares link ──> Client funds milestone 1
     │                                                   │
     │                                     money locked in contract
     ▼                                                   │
Freelancer submits milestone 1 with evidence link <──────┘
     │
     ├─ Client approves ─────────────> paid to freelancer (minus fee)
     ├─ Review window ends, no answer > freelancer claims, paid (minus fee)
     ├─ Client disputes ─────────────> arbiter splits
     └─ Freelancer refunds ──────────> full amount back to client
```

Repeat per milestone.

## Screens

| Screen | Path | Who |
|---|---|---|
| Home | `/` | Everyone: what the product is, connect wallet |
| Dashboard | `/dashboard` | My agreements as freelancer and as client |
| New agreement | `/agreements/new` | Freelancer |
| Agreement detail | `/agreements/[id]` | Both parties and arbiter; actions change by role and status |
| Arbiter panel | `/arbiter` | Arbiter: list of disputed milestones |

Details: `04_FRONTEND_SPEC.md`.

## Out of scope (MVP)

See `00_THINKING.md` section 6.
