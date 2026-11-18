# 00 - Thinking: why the product is shaped this way

This file records the reasoning behind the plan so any agent can follow it and challenge it.

## 1. The idea in one paragraph

Cesar's own words: an "Upwork for Bolivia" that lets freelancers actually see the money, trust the process and pay lower fees than Upwork, where the freelancers are responsible for getting their clients and create the milestones and contracts themselves.

## 2. The problem we start from

Cesar is a Bolivian freelancer paid in dollars by clients abroad. The pains he describes:

- **Seeing the money.** A freelancer starts work without proof the client has the money.
- **Trusting the process.** Payment depends on the client's goodwill or on a platform's internal rules.
- **Fees.** Upwork-style platforms charge a fee because they find the client. Freelancers who already have the client still pay for a service they do not use.

Context facts (from the team's research, `G:\My Drive\20 PROJECTS\NATIONAL STARTUP 2026\BOLIVIA\`, figures not re-verified here):

- The fixed exchange rate (Bs 6.96) ended in June 2026; the flexible rate moved to Bs 9.73 (Jun 2026) and Bs 11 (Jul 2026), with USDT/USDC quoted around Bs 11.20 to 11.35. Holding dollars matters to Bolivians.
- Inflation was 20.40% in 2025.
- Virtual assets are legal in Bolivia since 2024 (BCB RD 082/2024).
- Pollar offers a bank-QR route from bolivianos to USDC on Stellar and has a public SDK with instant testnet keys.

Unknowns (assumptions, not facts): how many Bolivian freelancers work for foreign clients; whether foreign clients will pay in USDC; exact fees freelancers pay today. These are in `08_OPEN_QUESTIONS.md`.

## 3. Why Stellar is central and not decoration

Test used: "If we replace the blockchain with a normal database, does the product still work as well?"

- With a database, the platform holds the client's money and both parties must trust the platform. That is Upwork.
- With a Soroban contract, the money sits in a public contract whose rules nobody can change after the agreement is created. The freelancer can open a block explorer and see the locked USDC. That is the "see the money, trust the process" promise, and it only exists because of the chain.
- Settlement in USDC is fast and cheap, which is what allows a lower fee.

## 4. How it maps to the contest pillars

| Pillar | How this product meets it |
|---|---|
| Use Stellar | The escrow contract holds and releases the money; USDC on Stellar is the payment asset |
| Integrate the ecosystem | Stellar Wallets Kit for wallets; Pollar for the bolivianos on/off-ramp (scope in `05_INTEGRATIONS.md`) |
| Solve something real | Cesar is the user; interviews with freelancers he knows validate it |
| Reach funding | Fee-based business with a clear path from testnet demo to mainnet |

## 5. Design choices and why

| Choice | Reason |
|---|---|
| One contract that holds many agreements | One deployment, one address for the frontend, simpler demo |
| Milestones funded one at a time | The client does not need to lock the whole budget up front; each milestone is visible on its own |
| Fee snapshot per agreement | Terms cannot change after the client agrees; supports "trust the process" |
| Review window with automatic claim | Protects the freelancer from a client who never answers |
| Dispute only by the client, inside the window, resolved by an arbiter | Simplest dispute model that still protects the client |
| Only the freelancer can refund | Money can never be pulled back by the client alone once locked; the freelancer can always return it |
| No backend server in the MVP | Everything the app shows comes from the contract; fewer moving parts to build and host |
| Agreement ids indexed by address on chain | The dashboard can list a user's agreements without a database |

## 6. What is deliberately left out of the MVP

Marketplace and job search, profiles and reviews, chat, file storage (the evidence field holds a link), mainnet, real money, credit or lending of any kind (lending needs a licence under Ley 393 and is out of scope).

## 7. Biggest risks

1. Foreign clients may not hold USDC. Mitigation to evaluate: Pollar or another on-ramp for the client side (open question Q-03).
2. Legal: whether a payments platform needs an ASFI licence (the fintech licence created by DS 5384 includes a payments category). Needs a lawyer, not code.
3. Build time: the deadline is not fixed in this repo. The action plan is ordered so that a working demo exists as early as possible (contract, then CLI smoke test, then UI).
