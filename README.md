<div align="center">

<img src="src/app/icon.svg" width="64" alt="Bolivia Escrow logo" />

# Bolivia Escrow

**See your client's money locked before you start working.**

Non-custodial milestone escrow on Stellar for Bolivian freelancers who bring their own clients.

**[Live app](https://bolivia-escrow.vercel.app)** · [Contract on testnet](https://stellar.expert/explorer/testnet/contract/CAF4G4ACGMDYLPYPPGMVKTL3FTHVTKOR4OTD7YE5CQWCQ5X327E3DOUO) · [Demo script](docs/demo-script.md) · [How the contract works](docs/contract.md) · [Concept Audit & SCF Roadmap (ES)](docs/CONCEPT_AUDIT_AND_SCF_ROADMAP.md)

</div>

> **🇧🇴 En español:** Bolivia Escrow permite que un freelancer boliviano vea el dinero de su cliente
> bloqueado en un contrato inteligente de Stellar **antes** de empezar a trabajar. El cliente bloquea
> USDC por cada hito; el pago se libera cuando aprueba, automáticamente si no responde dentro del plazo,
> o lo divide un árbitro si hay disputa. **Comisión fija del 1.5% (`150 bps`)**, congelada en cada acuerdo.
> Al cobrar, el freelancer puede pasar a **BOB vía Pollar (QR Simple)**, ahorrar en USDC con **Vaquita** y descargar su **comprobante de pago (SIAT)**. La app está en español por defecto.

![Bolivia Escrow home page](docs/screenshots/home.jpg)

## The problem

Bolivian freelancers working for clients at home or abroad:

1. **Can't see the money.** They start work with no proof the client can pay.
2. **Depend on goodwill.** Getting paid depends on the client, or on a platform's rules they can't check.
3. **Pay for what they don't use.** Marketplace fees (5–10%) pay for finding the client, even when the freelancer brought their own.

## How it works

1. The **freelancer** creates an agreement with 1 to 10 milestones and sends the link to the client.
2. The **client** locks USDC for a milestone in the Soroban contract.
3. The freelancer **sees the locked money on-chain** (`/verificar/[id]` or Stellar Expert) and only then starts working.
4. The freelancer submits a link to the work. The milestone settles when one of these happens:
   - the client **approves** it,
   - the review window (1h–30d) ends with no answer, and the freelancer **claims** it automatically,
   - the client **disputes** it (while `Submitted` within the review window, or while `Funded` if the freelancer ghosts), and the agreement's pinned **arbiter** splits the amount between both sides.
5. **Cash out & proof:** once USDC is released, the freelancer can convert to bolivianos via **Pollar (QR Simple)**, save in USDC via **Vaquita**, and download a **payment receipt (SIAT / bank proof)**.

**Non-custodial & rule-locked:** Nobody can change an agreement's fee, arbiter or fee recipient after creation, not even the platform admin. Each agreement snapshots its **`fee_bps`**, **`arbiter`**, and **`fee_recipient`** at creation time, with ~30-day Soroban storage TTL renewal on every state change. Once money is locked, the client can never unilaterally pull it back; only the freelancer can refund, or the pinned arbiter can split a formal dispute.

### Who the arbiter is, and what it can do

Today the arbiter is **one Stellar account held by the team** ([`GBBEOA7E…QUDU`](https://stellar.expert/explorer/testnet/account/GBBEOA7ETJ2OZA6GYD6PUA6R2NKF7ZCY72V4HHITHGWGVQMZHZESQUDU)), pinned into every agreement when it is created.

- **It can:** split a milestone the client has disputed, sending any share (0–100%) to the freelancer and the rest back to the client.
- **It cannot:** touch a milestone that is not disputed, move money to any address other than the agreement's freelancer, client and fee recipient, change the fee, or act on agreements where it is not the pinned arbiter.
- **The admin** can point *future* agreements to a different arbiter, fee or fee recipient (`update_config`). Existing agreements keep their snapshot. The contract has no upgrade function.
- **The trust that remains:** in a dispute, both sides rely on the team's judgment. The roadmap replaces the single account with a 2-of-3 panel; that is not built yet.

| Agreement: money locked and status per milestone | Live review countdown and "your turn" actions |
|---|---|
| ![Agreement](docs/screenshots/agreement.jpg) | ![Milestones](docs/screenshots/milestones.jpg) |
| **Dashboard** | **Real agreement read from the testnet contract** |
| ![Dashboard](docs/screenshots/dashboard.jpg) | ![Testnet agreement](docs/screenshots/testnet-agreement.jpg) |

## Site structure

| Part | Path | For |
|---|---|---|
| Website | `/`, `/como-funciona` | Value prop, live on-chain totals, comparison (1.5% vs Upwork / Trustless Work / direct QR), FAQ |
| Public proof | `/verificar/[id]` | Anyone: locked money, pinned arbiter/fee, milestone status and on-chain activity, no wallet |
| Freelancer profile | `/perfil/[address]` | Public track record computed from the contract: paid & resolved milestones, earned, disputes, level |
| App entry | `/app` | Main workspace entry with role tabs and demo/testnet switcher |
| Freelancer area | `/app/freelancer`, `/app/nuevo` | Create agreements, share the link, deliver, claim, off-ramp via Pollar & download SIAT receipt |
| Client area | `/app/cliente` | Proposals to accept, agreements in progress, approve or dispute |
| Arbiter area | `/app/arbitro` | Split disputed milestones (`Funded` or `Submitted`) |
| Agreement | `/app/acuerdo/[id]` | Tabs: Summary · Activity · Details. A client sees a guided invitation first |
| Wallet | `/app/billetera` | Test XLM (Friendbot), USDC trustline, test-USDC faucet |

Every money action opens a **review** (amount, fee, who gets what) before the wallet signs, and ends with a **receipt** linking to the transaction. The **activity timeline** is read from the contract's events on Stellar.

## Why Stellar & Ecosystem Integration

With a database, the platform holds the money and everyone has to trust the platform (and in Bolivia, holding third-party funds triggers ASFI financial intermediation / ETF licensing). With a Soroban contract, the money sits in a **non-custodial** public contract whose rules can't change. **The freelancer can verify the funds themselves on a block explorer.**

- **Soroban (Rust) + USDC SAC:** Deterministic milestone settlement with a fee frozen per agreement.
- **Pollar (BOB off-ramp):** Post-release handoff and live BOB/USDC parallel-rate preview to withdraw to any Bolivian bank via QR Simple.
- **Vaquita:** Post-release savings CTA to keep unused USDC earning yield on Stellar.
- **Stellar Wallets Kit:** Freighter, xBull, Albedo, LOBSTR, Hana, and Rabet support.

### Integration status

What runs today on the live site, checked against the code and the live API endpoints on 2026-11-22.

| Integration | Status | Notes |
|---|---|---|
| Soroban escrow contract + test USDC | **Live on testnet** | Every money action in testnet mode is a real contract call. See the end-to-end run below. |
| Test-USDC faucet contract | **Live on testnet** | 1,000 test USDC per account per day. |
| Stellar Wallets Kit (Freighter and others) | **Live on testnet** | Used to sign in testnet mode. |
| Public proof `/verificar/[id]` and profiles `/perfil/[address]` | **Live** | Read directly from the contract and its events. |
| Pollar (BOB off-ramp) | **Planned, UI only** | API route exists but no Pollar keys are configured; the BOB rate shown is a fixed reference value (11.2), not a live quote. The API paths are unverified. |
| Vaquita (USDC savings) | **Planned, UI only** | API route exists, not configured; no deposit happens. |
| Payment receipt (SIAT support) | **Works, informational** | Generates a printable/JSON receipt from on-chain data. It is not an official SIAT invoice. |
| Passkey wallet for clients | **Prototype** | Creates a WebAuthn credential and a local testnet key stored in the browser. Not a Soroban smart wallet yet. |
| Fee-bump gas sponsorship | **Planned, not configured** | Server route exists; no sponsor key is set on the live site. |
| Fiat on-ramp (SEP-24 / card) | **Planned, not configured** | Returns a placeholder quote only. |

**Built with:** Soroban (Rust, `soroban-sdk` 28.0.0) · USDC as a Stellar Asset Contract · Stellar Wallets Kit · Stellar SDK generated contract bindings · Friendbot · Next.js + TypeScript + Tailwind + Vitest.

## Live on testnet

| | |
|---|---|
| Escrow contract | [`CAF4G4AC…DOUO`](https://stellar.expert/explorer/testnet/contract/CAF4G4ACGMDYLPYPPGMVKTL3FTHVTKOR4OTD7YE5CQWCQ5X327E3DOUO) |
| Test USDC | [`CAHWJDBZ…DXR2`](https://stellar.expert/explorer/testnet/contract/CAHWJDBZVQCKB3J5PLBQKJJJLG4BDYANSK4JTAMS2TYEKWRLQZFYDXR2) (test asset, no real value) |
| Test-USDC faucet | [`CB74EKQ5…VO3O`](https://stellar.expert/explorer/testnet/contract/CB74EKQ5HJBY7NF277QJIQHI7W4QA6IOAPXW2ALSBV2GTTRE5VOXVO3O) (1,000 test USDC per account per day, signed by the user) |
| Fee on the deployed contract | **5% (`500 bps`)**, read from `get_config` on 2026-11-22 and frozen per agreement at creation. The product fee is 1.5% (as on the website); this testnet deployment is still configured at 5%. |

### End-to-end run on the current contract

Run on 2026-11-22 against `CAF4G4AC…DOUO` with the team's test accounts: [agreement #2](https://bolivia-escrow.vercel.app/verificar/2), three milestones of 100 test USDC each, review window 1 hour. Balances were checked before and after each step.

| Step | Path | Transaction | Result |
|---|---|---|---|
| Freelancer creates the agreement | — | [`3c49f0f9…`](https://stellar.expert/explorer/testnet/tx/3c49f0f9b0b280008931b9279308e33d2df6cfb9fac122de0ef4839953c5dc64) | 3 milestones, fee, arbiter and fee recipient frozen |
| Client locks milestone 1 / 2 / 3 | — | [`a97b5678…`](https://stellar.expert/explorer/testnet/tx/a97b56781ac093f7b58144baebfe203f1e4947a4725a21293f6dd3e85e6c54b4) · [`5ca18b48…`](https://stellar.expert/explorer/testnet/tx/5ca18b481fdc6ff3d4fa856d7bd5dba1f7ebafc4eb3be5de2676904f4db20dc2) · [`7ba3ec4d…`](https://stellar.expert/explorer/testnet/tx/7ba3ec4dc0b77d46d1ed7dda8894339f6c0ef2531da786235ee7d87065bb5e4a) | 300 USDC held by the contract |
| Freelancer submits milestone 1 / 2 / 3 | — | [`9eec5cbd…`](https://stellar.expert/explorer/testnet/tx/9eec5cbd79ab68eddce30fbe368b3497ab5bb2ddb7efb9dba5e1c3000c2433bf) · [`200850da…`](https://stellar.expert/explorer/testnet/tx/200850da1fb0e20e5644909f26470bd9f6bebf19e9eb44f467238eb904fc3030) · [`9c744451…`](https://stellar.expert/explorer/testnet/tx/9c744451d45fd7a2defc0bbc2ee7aa91d65267c73a4c3f48387f8c325a4765ba) | review window starts |
| Client approves milestone 1 | approval | [`a5067b4e…`](https://stellar.expert/explorer/testnet/tx/a5067b4ebe41a642b86fa02ba976fa14b0648fe115d16f73ac0082cef662906f) | freelancer +95, fee 5 |
| Client disputes milestone 2 | dispute | [`b7279737…`](https://stellar.expert/explorer/testnet/tx/b72797378996d3552dbdcb0944134d4b98e3856f8714db9280e959feece5f379) | milestone frozen until the arbiter rules |
| Arbiter splits milestone 2 60/40 | dispute | [`fb9f9e68…`](https://stellar.expert/explorer/testnet/tx/fb9f9e68a5429859fea71a1f3cf8a332a756fa47f010f0b57579be54f4a160f4) | freelancer +57, client +40, fee 3 (fee only on the freelancer's share) |

Net result: client −260, freelancer +152, fee recipient +8 test USDC after the first two milestones, which matches the contract's fee math at 5%.

## Try it

Open **https://bolivia-escrow.vercel.app**, or run it locally:

```bash
git clone https://github.com/JulioGB01/bolivian_freelancer_platform.git
cd bolivian_freelancer_platform
npm ci
npm run dev        # http://localhost:3000
```

- **Demo mode** (the default) needs no wallet. Click **Open app** (`/app`) and use the **Freelancer / Cliente / Árbitro** tabs to switch roles.
- **Testnet mode:** inside `/app`, click **Testnet real ↗** in the mode banner, connect Freighter (set to Testnet), then open **Billetera** (`/app/billetera`) to get test XLM, enable the USDC trustline, and mint 1,000 test USDC.

The **ES / EN** button switches the language.

## Repository layout

```
.github/      GitHub Actions CI (contracts: fmt, clippy, test; web: ci, lint, tsc, test, build)
src/          web app (Next.js App Router): pages, components, escrow client, wallet, translations, Vitest tests
contracts/    Soroban contracts in Rust: hardened escrow and test-USDC faucet
scripts/      testnet deploy, on-chain smoke test, checks
deployments/  deployed contract ids
docs/         product, architecture, contract, testing, demo script, concept audit & SCF roadmap
```

```bash
cd contracts && cargo test     # contract unit tests
npm test                       # frontend unit tests (Vitest)
bash scripts/deploy-testnet.sh # deploy your own copy (needs the Stellar CLI)
```

GitHub Actions CI (`.github/workflows/ci.yml`) runs the contract checks (`cargo fmt --check`, `cargo clippy --all-targets`, `cargo test`) and web checks (`npm ci`, `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build`) on every push and pull request.

## Roadmap

See the full 3-milestone **$45k Stellar Community Fund (SCF)** plan, market sizing, and legal/product audit in [`docs/CONCEPT_AUDIT_AND_SCF_ROADMAP.md`](docs/CONCEPT_AUDIT_AND_SCF_ROADMAP.md):

- **Milestone 1 (Security & Zero-Friction Onboarding):** Smart-contract audit, Stellar Passkey Smart Wallets + fee-bump gas sponsorship for non-crypto clients, and Pollar BOB QR Simple production integration.
- **Milestone 2 (Mainnet Launch & Bolivian Wedge):** Mainnet with Circle USDC, Vaquita yield integration, SIAT export-of-services receipt automation, and initial 150 active Bolivian freelancers.
- **Milestone 3 (Scale & Regional Expansion):** 500+ active freelancers ($5M GMV run-rate), 2-of-3 multisig / vetted legal-tech arbiter pool, and LatAm expansion.

<div align="center"><sub>Made for Bolivian freelancers 🇧🇴 · National Startups Hackathon 2026 by Stellar</sub></div>
