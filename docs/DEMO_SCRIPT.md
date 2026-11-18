# Demo Script

Goal: a person who has never seen the product runs the full escrow flow end to end,
using the demo-mode frontend (no wallet, no testnet).

## Setup

1. Copy the repository to a local folder (not Google Drive) and run the frontend:
   ```
   cd frontend
   npm install
   npm run dev
   ```
2. Open http://localhost:3000. Confirm the **Demo mode** banner is visible.

## Walkthrough

1. **Home** — read the value proposition ("money locked before you start"), the
   four "How it works" steps and the three feature cards.
2. **Connect as Freelancer** — top-right *Connect wallet* → *Freelancer (demo)*. The
   wallet menu shows **Freelancer · 100 USDC**. Use this same menu to switch roles at any time.
3. **Create an agreement** — *New agreement*. Fill:
   - Title: `Logo design`
   - Client address: `demo-client`
   - Review window: **1 minute (demo testing)**, so the claim/dispute flow can be tested quickly
   - Milestone 1: `Logo design v1`, amount `25`
   - Add a second milestone: `Logo design v2`, amount `25`
   - Check the fee summary (total, platform fee, what you receive), then click
     **Create agreement**. You land on the agreement detail page.
4. **See the money panel** — note the "Locked in escrow right now" panel (0 USDC), the
   locked / settled / not funded bar, and the **Copy link for your client** button.
5. **Lock funds as Client** — switch to **Client (demo)** from the wallet menu. On
   milestone 1 click **Lock 25.00 USDC** and confirm. The locked amount becomes 25 USDC,
   the milestone shows **Funds locked**, and the client's balance drops.
6. **Submit as Freelancer** — switch back to **Freelancer**. On milestone 1, paste any
   link (e.g. `https://drive.google.com/example`) into the evidence field and
   **Submit work**. The milestone shows a live review-window countdown.
7. **Approve as Client** — switch to **Client**. **Approve & release**. The freelancer
   receives 25 USDC minus the 1% fee (24.75), and the fee recipient gets 0.25.
8. **Claim after silence** — switch to **Freelancer**, fund milestone 2 as **Client**,
   submit it as **Freelancer**, wait for the 1-minute window. The **Claim 24.75 USDC**
   button appears by itself (no page refresh); click it.
9. **Dispute and resolve** — create a third milestone, fund + submit it, and as
   **Client** click **Open dispute** (with a reason) before the window ends. Switch to
   **Arbiter (demo)**, open the **Disputes** page, drag the split slider (e.g. 60%),
   and **Resolve dispute**. The freelancer gets 60% (minus fee), the client gets 40%.
10. **Refund** — fund a milestone and, as **Freelancer**, click **Refund client**. The
    full amount returns to the client.

## Checks

- [ ] Every milestone shows a status badge and only the role-appropriate action buttons.
- [ ] Balances move by the expected amounts (fee is 1% in the demo).
- [ ] The "Locked in escrow" total matches the sum of funded/submitted/disputed milestones.
- [ ] Errors (e.g. funding twice, claiming early, disputing late) show a plain message.
