# AGENTS.md

Instructions for any coding agent working in this repository (DeepSeek Harness reads this file).

## 1. What this project is

`bolivia-freelance-escrow` (working name, decision D-01) is a milestone escrow for Bolivian freelancers who already have their own clients. The freelancer creates an agreement with milestones, the client locks USDC for each milestone in a Soroban smart contract on Stellar, and the money is released when the client approves, when the review window ends without a dispute, or by an arbiter after a dispute. Freelancers can see the locked money on chain at all times. The platform takes a fee that is lower than Upwork's (value: decision D-03).

It is NOT a marketplace: no job search, no bidding, no profiles. Freelancers bring their own clients.

## 2. Who you work for

The owner is Cesar (electrical engineer, not a Rust or blockchain specialist). He decides; you execute. Write for him: plain English, short, and explain any blockchain term the first time you use it.

## 3. Read order before your first task

1. `docs/00_THINKING.md`: why the product is shaped this way
2. `docs/01_PRODUCT_SPEC.md`: users, flows, scope
3. `docs/02_ARCHITECTURE.md`: components and data flow
4. `docs/06_ACTION_PLAN.md`: the task list you execute
5. `docs/07_DECISIONS.md`: what is decided and what is still open
6. `PROGRESS.md`: where the last session stopped

Then read the spec for the area you touch: `docs/03_CONTRACT_SPEC.md`, `docs/04_FRONTEND_SPEC.md`, `docs/05_INTEGRATIONS.md`, `docs/09_TEST_PLAN.md`.

## 4. Hard rules

1. **Never invent.** No guessed API names, CLI flags, package versions, addresses, fees or figures. Verify every external fact in this order: (a) the local reference repositories listed in section 7, (b) the tool's own `--help` output, (c) official docs online. If you cannot verify it, stop and ask Cesar. Use skill `verify-facts`.
2. **Decisions are Cesar's.** If a task depends on a decision marked `Open` in `docs/07_DECISIONS.md`, stop and ask. Never change a `Confirmed` decision. A `Proposed` decision may be used to keep building, and you must say so in `PROGRESS.md`.
3. **Testnet only.** Never deploy to mainnet, never use real funds, never request a mainnet key.
4. **No secrets in git.** Secret keys, seed phrases and API keys live only in `.env` files (gitignored) or the Stellar CLI keystore. Run `scripts/check-secrets.sh` before every commit.
5. **One task at a time**, in the order of `docs/06_ACTION_PLAN.md`, respecting the `Depends on` column.
6. **A task is done only when** its acceptance criteria pass and `scripts/check.sh` passes. Then update `PROGRESS.md` (use skill `task-execution`).
7. **Do not edit the contract's public interface** (function names, arguments, types in `contracts/escrow/src/types.rs`) without updating `docs/03_CONTRACT_SPEC.md` in the same change and telling Cesar.
8. **Keep it small.** No feature that is not in the action plan. Put ideas in `docs/08_OPEN_QUESTIONS.md` instead of building them.

## 5. Repository map

```
AGENTS.md                  this file
PROGRESS.md                session log, updated after every task
README.md                  public project page (for judges and GitHub)
docs/                      plan and specifications (source of truth)
contracts/                 Rust workspace, Soroban smart contracts
  escrow/src/lib.rs        contract functions (skeleton with todo!())
  escrow/src/types.rs      data types and storage keys
  escrow/src/errors.rs     error codes
  escrow/src/test.rs       test stubs, one per test plan item
frontend/                  Next.js web app (created in task T3.1)
deployments/testnet.json   deployed contract ids (created in task T2.2)
scripts/                   check, secret scan, testnet deploy, smoke test
.agents/skills/            skills for this project
.agents/agents/            role briefs for delegated work
.githooks/                 git hooks (enable in task T0.2)
.github/workflows/ci.yml   CI: contract tests and frontend build
```

## 6. Commands

| Purpose | Command | Where |
|---|---|---|
| Contract tests | `cargo test` | `contracts/` |
| Contract lint | `cargo clippy --all-targets -- -D warnings` | `contracts/` |
| Contract format | `cargo fmt --all` | `contracts/` |
| Contract wasm build | `stellar contract build` | `contracts/escrow/` |
| All checks | `bash scripts/check.sh` | repo root |
| Secret scan | `bash scripts/check-secrets.sh` | repo root |
| Frontend dev | `npm run dev` | `frontend/` (after T3.1) |

Verify every `stellar` subcommand with `stellar <subcommand> --help` before using it. The CLI changes between versions.

## 7. Local reference repositories

Already downloaded on Cesar's machine at:

`G:\My Drive\20 PROJECTS\NATIONAL STARTUP 2026\STELLAR\_repos\`

| Folder | Use it for |
|---|---|
| `stellar__soroban-examples\timelock` | Token transfer into a contract, time checks, test setup with a Stellar Asset Contract |
| `stellar__soroban-examples\token` | Token interface |
| `stellar__soroban-examples\events` | How to emit events with the SDK version in use |
| `stellar__soroban-examples\errors` | `contracterror` usage |
| `stellar__soroban-examples\ttl` | Storage time-to-live extension |
| `stellar__soroban-examples\auth` | `require_auth` patterns |
| `ShoeSafari-Org__ShoeSafari` | Escrow per order, Next.js frontend with a Stellar wallet |
| `Creit-Tech__Stellar-Wallets-Kit` | Wallet connection and transaction signing |
| `Stellar-Kolo__kolo-contracts` | Multi-party contract with rounds and tests |

Analyses of these repos: `G:\My Drive\20 PROJECTS\NATIONAL STARTUP 2026\STELLAR\REFERENCE_PROJECTS\<repo>\TECHNICAL.md`.

## 8. When to stop and ask Cesar

- A decision is `Open`.
- A fact cannot be verified.
- A command fails twice with the same error.
- A change would touch money logic (fees, payouts, refunds) beyond what `docs/03_CONTRACT_SPEC.md` states.
- Anything legal, regulatory, or about real funds.

Ask with: what you were doing, what blocked you, the options you see, and what you need from him.
