# 06 - Action Plan

Execute top to bottom. A task can start only when every task in `Depends on` is Done in `PROGRESS.md`. Use skill `task-execution` for the loop. Owner `Cesar` means a human must do it; the agent prepares and waits.

## Phase 0 - Setup

| ID | Task | Depends on | Owner | Acceptance |
|---|---|---|---|---|
| T0.1 | Verify toolchain: `rustc`, `cargo`, target `wasm32v1-none`, `stellar` CLI, `node`, `npm`, `git`. Record versions in PROGRESS.md | none | Agent + Cesar installs | All commands print versions |
| T0.2 | Move the repo to a local folder outside Google Drive, `git init`, `git config core.hooksPath .githooks`, first commit, create the GitHub repository and push | T0.1 | Cesar | Repo on GitHub; hook runs on commit |
| T0.3 | Create testnet identities `bfe-admin`, `bfe-arbiter`, `bfe-freelancer`, `bfe-client`, funded on testnet | T0.1 | Agent | `stellar keys ls` shows 4 identities; each has a testnet balance |
| T0.4 | `cargo test` passes in `contracts/` (20 ignored) and `stellar contract build` produces a wasm | T0.1 | Agent | Both commands succeed |

## Phase 1 - Contract (`docs/03_CONTRACT_SPEC.md`)

For each task: implement, remove `#[ignore]` from its tests in `src/test.rs`, write the test bodies, make them pass.

| ID | Task | Depends on | Acceptance |
|---|---|---|---|
| T1.1 | `initialize`, `update_config`, `get_config` + TTL helper | T0.4 | Tests T1.1 pass |
| T1.2 | `create_agreement`, `get_agreement`, `agreements_of_freelancer`, `agreements_of_client` | T1.1 | Tests T1.2 pass |
| T1.3 | `fund_milestone` | T1.2 | Tests T1.3 pass |
| T1.4 | `submit_milestone` | T1.3 | Tests T1.4 pass |
| T1.5 | `approve_milestone` + shared payout function | T1.4 | Tests T1.5 pass |
| T1.6 | `claim_milestone` | T1.5 | Tests T1.6 pass |
| T1.7 | `dispute_milestone`, `resolve_dispute` | T1.5 | Tests T1.7 pass |
| T1.8 | `refund_milestone` | T1.3 | Tests T1.8 pass |
| T1.9 | Events for every state change (section 5 of spec) | T1.1 to T1.8 | Each test asserts its event |
| T1.10 | Security checklist review (spec section 6), run as `reviewer` role | T1.9 | Checklist answered in PROGRESS.md, issues fixed |
| T1.11 | Invariant test + full happy path test; `cargo clippy -D warnings` clean | T1.10 | All 20 tests pass, 0 ignored |
| T1.12 | `stellar contract build`; record wasm size | T1.11 | Wasm exists |

## Phase 2 - Testnet deployment

| ID | Task | Depends on | Acceptance |
|---|---|---|---|
| T2.1 | Create the USDC test token per decision D-04 and mint test balance to `bfe-client` | T0.3, D-04 confirmed | Client balance visible via CLI |
| T2.2 | Deploy `bfe-escrow`, call `initialize`, write ids to `deployments/testnet.json` (complete `scripts/deploy-testnet.sh`) | T1.12, T2.1, D-03 confirmed | `get_config` returns the expected values |
| T2.3 | Smoke test from CLI: create, fund, submit, approve one milestone; check balances (complete `scripts/smoke-testnet.sh`) | T2.2 | Freelancer and fee recipient balances increase by the expected amounts |

**Checkpoint A:** stop and report to Cesar. The core product works on testnet from the command line.

## Phase 3 - Frontend (`docs/04_FRONTEND_SPEC.md`)

| ID | Task | Depends on | Acceptance |
|---|---|---|---|
| T3.1 | Scaffold Next.js + TypeScript + Tailwind in `frontend/`, folder structure from spec, `.env.example` | T0.2 | `npm run build` passes |
| T3.2 | Wallet connect with Stellar Wallets Kit | T3.1 | Address shown after connecting a testnet wallet |
| T3.3 | Generate TypeScript bindings from the deployed contract into `src/contracts/escrow`; `lib/escrow.ts` wrapper | T2.2, T3.1 | `get_config` displayed on Home |
| T3.4 | New agreement page (US-02, US-13) | T3.2, T3.3 | Agreement created on testnet from the UI |
| T3.5 | Agreement detail page with role-based actions (US-04 to US-09, US-11) and "see the money" panel (US-05) | T3.4 | Every milestone action works from the UI |
| T3.6 | Dashboard (US-12) | T3.5 | Lists agreements for both roles |
| T3.7 | Arbiter panel (US-10) | T3.5 | Arbiter resolves a dispute from the UI |
| T3.8 | Error messages, loading states, empty states | T3.7 | Every contract error has a plain message |
| T3.9 | Full demo run by a person outside the team using `docs/DEMO_SCRIPT.md` (agent writes the script) | T3.8 | Completed without help |

**Checkpoint B:** stop and report to Cesar.

## Phase 4 - Ecosystem integration

| ID | Task | Depends on | Acceptance |
|---|---|---|---|
| T4.1 | Research only: confirm from Pollar docs what works on testnet (wallet login, signing a call to our contract, ramp quotes). Write findings in `05_INTEGRATIONS.md` | Checkpoint B | Findings reported to Cesar; D-09 decided |
| T4.2 | Implement the Pollar scope chosen in D-09 | T4.1, D-09 confirmed | Works on testnet as described in D-09 |

## Phase 5 - Ship

| ID | Task | Depends on | Owner | Acceptance |
|---|---|---|---|---|
| T5.1 | Deploy frontend to a public URL (decision D-12) | T3.9 | Agent + Cesar | URL opens and works with a testnet wallet |
| T5.2 | README for judges: problem, solution, how it works, contract id, live URL, how to run locally | T5.1 | Agent | Cesar approves |
| T5.3 | Record 2 to 3 minute demo video following DEMO_SCRIPT.md | T5.1 | Cesar | Video file exists |
| T5.4 | Final check: `scripts/check.sh`, secret scan, CI green, repo public | T5.2 | Agent | All green |
