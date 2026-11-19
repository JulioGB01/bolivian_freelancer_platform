# PROGRESS

Newest entry on top. One entry per task. Template:

```
## YYYY-MM-DD - T#.# <task name> - Done | Blocked | In progress
- What changed:
- Commands run and result:
- Decisions used (Proposed ones listed explicitly):
- Open issues / questions for Cesar:
```

## Task status

| Task | Status |
|---|---|
| T0.1 | Done (Rust 1.100.0 + wasm32v1-none + GNU toolchain; Node 24 + npm 11; git 2.52; Stellar CLI install attempted) |
| T0.2 | Done 2026-11-18 (pushed to github.com/JulioGB01/bolivian_freelancer_platform at Cesar's request) |
| T0.3 | Not done (needs Stellar CLI + testnet funding) |
| T0.4 | Done (cargo test + clippy clean; wasm build needs Stellar CLI) |
| T1.1 to T1.12 | Done (contract implemented; 20/20 tests pass; clippy clean; wasm builds) |
| T2.1 to T2.3 | Not done (blocked on D-03, D-04, Stellar CLI, testnet) |
| T3.1 to T3.8 | Done (Next.js app + demo-mode mock; `npm run build` passes) |
| T3.9 | Partly (DEMO_SCRIPT.md written; not yet run by an outsider) |
| T4.1 to T4.2 | Not done (after Checkpoint B + D-09) |
| T5.1 to T5.4 | Not done (D-12 hosting, Cesar records video, D-15 license) |

## Log

## 2026-11-18 - Testnet deployment, real wallet mode, Spanish UI, CI - Done
- Decisions confirmed by Cesar: D-03 fee 5% (500 bps), D-04 own test USDC, D-11 Spanish default
  with English toggle, D-12 Vercel.
- Testnet: identities bfe-admin/arbiter/treasury/freelancer/client (Stellar CLI keystore, not in
  the repo). Test USDC SAC `CAHWJDBZ…DXR2`, escrow `CDG4IJBA…NW2LO`, initialized with 500 bps.
  Fee recipient moved to `bfe-treasury` via `update_config`: the admin issues the test USDC, and a
  payment back to a classic issuer burns it. Ids in `deployments/testnet.json`.
- `scripts/deploy-testnet.sh` and `scripts/smoke-testnet.sh` filled with commands checked against
  `--help` (Stellar CLI 30.0.1). Smoke test: 100 locked, 95 paid to freelancer, 5 fee. Passed.
- Frontend: runtime mode switch (demo / testnet); RealEscrow over generated bindings; Stellar
  Wallets Kit (explicit modules; `defaultModules()` pulls a MetaMask adapter that fails to resolve);
  Friendbot, trustline and `/api/faucet` (needs `FAUCET_SECRET` env var); es/en i18n.
- Verified: bindings call shapes run against testnet from a script with test signers (create,
  fund, read, missing id -> isErr, double fund -> Error(Contract, #5)); faucet sends 1,000 test USDC;
  testnet agreement renders in the browser; wallet picker opens. `npm run lint` and `npm run build` pass.
- Not verified here: signing through a browser wallet extension (none installed in the test browser).

## 2026-11-18 - UI/UX polish + first GitHub publish - Done
- What changed (frontend only; contract untouched):
  - Each milestone now shows a plain-language status ("Not funded", "Funds locked", "In review",
    "Ready to claim"…) and a "Your turn" next step per role (`src/lib/status.ts`).
  - "Locked in escrow right now" panel with a settled / locked / not-funded bar.
  - "Copy link for your client" button and a "send this to your client" hint (US-03).
  - New agreement form: fee and net preview (US-13), review window as a dropdown, amount and
    address validation, no prefilled client.
  - Live review countdown: Claim / Dispute buttons now appear without a page refresh.
  - Confirmation before Lock funds, Approve, Dispute, Resolve and Refund.
  - Dashboard totals ("Locked for my work", "Waiting on me") and action badges on cards.
  - Demo role switcher in the wallet menu; Disputes link shown only to the arbiter;
    responsive header; global demo-mode banner; "How it works" on Home.
  - Bug fixes: connecting a wallet in the header did not update the rest of the page until
    reload; the agreement page did not re-render after an action (state mutated in place);
    the balance did not refresh after actions.
- Commands run and result: `npm run lint` clean; `npm run build` passes (in a local copy);
  full demo flow clicked through in a browser (create, lock, submit, live countdown, claim).
- Decisions used: UI kept in English (D-11 still Open). Review-window default stays 1 hour;
  options 1 minute (demo only), 1 hour, 1, 3, 7 days (D-05 still Open).
- Open issues / questions for Cesar: D-03, D-04, D-05, D-11, D-12, D-15 unchanged.

## 2026-11-18 - Phase 1 contract + Phase 3 frontend MVP - Done
- What changed:
  - Implemented the full Soroban escrow contract (`contracts/escrow/src/`): `initialize`,
    `update_config`, `create_agreement`, `fund/submit/approve/claim/dispute/resolve/refund`
    milestones, read-only getters and indexes, per-action `#[contractevent]` events, and TTL
    extension on every call. Money math is integer-only, rounding down, multiplication before
    division, exactly per `docs/03_CONTRACT_SPEC.md` section 4.
  - Wrote the full unit-test suite (`src/test.rs`, 20 tests) covering the state machine, exact
    balances, fee snapshot, review window, dispute split, arbiter-only auth, the contract
    balance invariant and a 3-milestone happy path. All 20 pass, 0 ignored.
  - Scaffolded the Next.js + TypeScript + Tailwind frontend (`frontend/`) with every screen from
    `docs/04_FRONTEND_SPEC.md` (Home, Dashboard, New agreement, Agreement detail, Arbiter panel)
    and the components (WalletButton, AgreementCard, MilestoneRow, MoneyLocked, TxStatus).
  - Added a **demo mode** (`NEXT_PUBLIC_DEMO_MODE=true`, default): `src/lib/escrow.ts` implements
    the same `EscrowApi` interface with a faithful in-browser mock of the contract (localStorage),
    so the whole flow is clickable with no wallet/testnet/deployed contract. The real client slots
    into the same interface after testnet deployment.
- Commands run and result:
  - `cargo test` (GNU toolchain): **20 passed; 0 failed; 0 ignored**.
  - `cargo fmt --all`: clean. `cargo clippy --all-targets -- -D warnings`: clean.
  - `stellar contract build`: **success** — `target/wasm32v1-none/release/bfe_escrow.wasm`,
    18,750 bytes optimized (22,589 original); hash `5fc0ca50…2af9bcd7`; 14 functions exported.
  - `npm install` + `npm run build` (in a local non-synced copy): **build passes**, all routes present.
- Decisions used (Proposed ones listed explicitly):
  - D-06 (max 10 milestones), D-07 (ttl pattern), D-08 (soroban-sdk 28.0.0), D-10 (Next.js + TS +
    Tailwind), D-13 (platform arbiter), D-14 (client-only dispute inside window; arbiter splits by bps)
    were used as proposed.
  - Demo fee is **100 bps (1%)** and the demo review-window default is 3600s. These are demo values
    only; D-03 (fee) and D-05 (review window default) are still Open and must be confirmed by Cesar.
  - Demo identities (`demo-freelancer`, `demo-client`, `demo-arbiter`) are placeholders; D-11 (UI
    language) is Open, so the UI is in English.
- Open issues / questions for Cesar:
  - **Google Drive breaks build tooling.** `npm install` and the DSH file tools fail on the synced
    folder (SetFileSecurityW / EBADF). Build in a local copy, keep Google Drive for the source
    (this matches `docs/10_SETUP.md`). `cargo` did work in-place but is slow under sync.
  - **Stellar CLI** v30.0.1 was installed from the official prebuilt Windows binary
    (`stellar-cli-30.0.1-x86_64-pc-windows-msvc.tar.gz`) after `cargo install stellar-cli`
    failed to link on MinGW; `stellar contract build` now works. Phase 2 (testnet deploy) is
    still blocked on D-03 and D-04.
  - Confirm D-03 (fee), D-04 (testnet USDC), D-05 (review window default), D-11 (language), D-12
    (hosting) to unblock phases 2 and 5.

## Local toolchain note (this session)

To run `cargo test`/`clippy` on a machine without Visual Studio Build Tools, this session
installed: Rust (rustup, `stable-x86_64-pc-windows-gnu` + `wasm32v1-none` target) and WinLibs
MinGW-w64 (gcc, via winget). Commands were run as:

```
$env:PATH = "<WinLibs>\mingw64\bin;$env:PATH"
cargo +stable-x86_64-pc-windows-gnu test
```

The repository's `contracts/rust-toolchain.toml` is unchanged (channel `stable`, target
`wasm32v1-none`); the `+stable-x86_64-pc-windows-gnu` override is a local workaround, not part of
the repo.
