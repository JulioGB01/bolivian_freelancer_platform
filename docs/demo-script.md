# Demo Script

Goal: a person who has never seen the product runs the full escrow flow end to end, in demo mode (no wallet, no testnet), including the post-release Pollar BOB off-ramp, Vaquita savings, and SIAT payment receipt.

## Setup

1. Clone the repository to a local folder and start the app:
   ```bash
   npm ci
   npm run dev
   ```
2. Open `http://localhost:3000`. The UI starts in Spanish; click **EN** in the top header if you want English labels to match this script.

## Walkthrough

1. **Home (`/`)** — read the value proposition (*"See your client's money locked before you start working"*), live on-chain protocol totals, the four *"How it works"* steps, and the Demo vs. Testnet cards. *(Note: the mode banner and wallet switcher live inside `/app`, keeping the landing page clean.)*
2. **Enter the app (`/app`)** — click **Open app** (or **Create agreement**). Confirm the **Demo** mode banner is visible at the top and the **Freelancer / Client / Arbiter** role tabs appear in the header.
3. **Connect as Freelancer** — click the top-right wallet button → **Freelancer (demo)**. You can switch roles at any time using the **Freelancer / Client / Arbiter** tabs or the wallet menu.
4. **Create an agreement (`/app/nuevo`)** — click **New agreement**. Fill:
   - Title: `Brand identity & landing page`
   - Client address: `demo-client`
   - Review window: **1 minute (demo)** (on-chain testnet/mainnet enforces 1 hour – 30 days; demo mode offers a short window for quick testing)
   - Milestone 1: `Wireframes & logo v1`, amount `40`
   - Add a second milestone: `Final delivery`, amount `40`
   - Check the fee summary (**1.5% platform fee**: `0.60 USDC` per 40 USDC milestone → `39.40 USDC` net to freelancer), then click **Create agreement**. You land on `/app/acuerdo/[id]`.
5. **See the money panel & public proof** — note the *"Locked in escrow right now"* panel (`0.00 USDC`), the locked / settled / not funded bar, and the **Copy link for your client** and **Public proof (`/verificar/[id]`)** links.
6. **Lock funds as Client (`/app/cliente`)** — switch to **Client**. Open the proposal under *Proposals to accept* and follow the guided 3-step invitation. *(If a demo agreement exceeds the client's 100 USDC starter balance, use the demo top-up button right in the invitation.)* Click **Lock 40.00 USDC**, confirm in the **Review** dialog, and view the **Receipt**. The locked amount becomes `40.00 USDC` and the milestone shows **Funds locked**.
7. **Submit work as Freelancer** — switch back to **Freelancer**. On milestone 1, paste a link (e.g. `https://drive.google.com/example`) into the evidence field and click **Submit work**. The milestone starts a live review-window countdown.
8. **Approve as Client** — switch to **Client** and click **Approve & release**. Confirm in the review dialog. The freelancer receives **39.40 USDC** (40.00 minus the **1.5%** fee of `0.60 USDC`).
9. **Post-release Bolivia moment (Pollar + Vaquita + SIAT receipt)** — switch back to **Freelancer** on the released milestone:
   - **Retirar a BOB vía Pollar (QR Simple):** view the live BOB parallel-rate estimate and Pollar off-ramp handoff.
   - **Ahorrar en USDC con Vaquita:** view the secondary Stellar ecosystem savings CTA.
   - **Descargar Comprobante (Recibo / SIAT):** download/print the structured payment proof (agreement ID, client, amount, 1.5% fee, tx hash) for Bolivian tax (SIAT) and bank/UIF justification.
10. **Claim after silence** — fund milestone 2 as **Client**, submit it as **Freelancer**, and wait for the review window to expire. The **Claim 39.40 USDC** button appears automatically (no refresh needed); click it.
11. **Dispute & resolve (including anti-ghosting)** — create a new agreement with a milestone and fund it as **Client**:
    - You can open a dispute directly while **Funded** (anti-ghosting protection if a freelancer disappears) *or* while **Submitted** inside the review window.
    - Switch to **Arbiter** (`/app/arbitro`), drag the split slider (e.g. `60%` freelancer / `40%` client), and click **Resolve dispute**. The freelancer receives 60% minus the 1.5% fee on their share; the client receives 40% with no fee; the freelancer's public profile (`/perfil/[address]`) credits the resolved share.
12. **Refund** — fund a milestone and, as **Freelancer**, click **Refund client**. 100% returns to the client with 0% fee.

## Checks

- [ ] Every milestone shows a status badge and only the role-appropriate action buttons.
- [ ] Balances move by the exact expected amounts using the **1.5% (`150 bps`)** fee.
- [ ] The *"Locked in escrow"* total matches the sum of `Funded`, `Submitted`, and `Disputed` milestones.
- [ ] Post-release actions (Pollar BOB preview, Vaquita CTA, downloadable SIAT receipt) appear on released milestones.
- [ ] Invalid routes (e.g. `/app/acuerdo/abc` or `/verificar/abc`) show a clean Not Found state without crashing.
- [ ] Errors (e.g. funding twice, claiming early, disputing late, invalid evidence URL) show a plain message in the active language (ES/EN).
