# Testing

## Contract unit tests (`contracts/escrow/src/test.rs`)

Setup pattern: `soroban-examples/timelock/src/test.rs` (`Env::default()`, `env.mock_all_auths()`, `register_stellar_asset_contract_v2` for the token, `env.ledger().with_mut(|l| l.timestamp = ...)` to move time).

### Core lifecycle & security coverage

| Area | What is verified |
|---|---|
| Initialization & config | `initialize` sets `Config`; double init fails (`AlreadyInitialized`); `fee_bps > 10_000` fails (`InvalidBps`); default **150 bps (1.5%)** payout math |
| Agreement creation & bounds | Stores `Pending` milestones and indexes; increments `NextId` (readable via `get_next_id()`); rejects empty / `> MAX_MILESTONES`, zero amount, `freelancer == client`, out-of-range review window (`< 3_600`s or `> 2_592_000`s), and overly long strings |
| Immutable per-agreement snapshots | `update_config` after agreement creation does **not** alter an active agreement's `fee_bps`, `arbiter`, or `fee_recipient` |
| Funding & submission | `fund_milestone` locks tokens (`Pending -> Funded`); double funding fails; `submit_milestone` requires `Funded` |
| Approval & auto-claim | `approve_milestone` pays freelancer minus 1.5% fee; `claim_milestone` fails before window (`ReviewWindowOpen`) and pays after window ends |
| Disputes & anti-ghosting | Client can dispute `Submitted` within window (fails after with `ReviewWindowClosed`) **and** can dispute `Funded` directly if freelancer ghosts; only the agreement's frozen `arbiter` can resolve; `resolve_dispute` splits accurately, takes fee only on freelancer's share, and records `resolved_freelancer_bps` |
| Refunds | Only freelancer can refund `Funded` or `Submitted` milestones (100% returned to client, 0% fee); `Released` cannot be refunded |
| Balance invariant | Contract token balance always equals the sum of all `Funded`, `Submitted`, and `Disputed` milestones across multiple agreements |

Run locally:

```bash
cd contracts
cargo fmt --check
cargo clippy --all-targets
cargo test
```

## Frontend unit tests (`src/lib/__tests__/`)

Vitest unit test suite covering:
- `src/lib/format.ts`: `parseAmount` hardening (rejecting scientific notation like `"1e5"`, `"Infinity"`, negative values, malformed decimals) and localized `formatCountdown` (`"vencido"` in ES, `"expired"` in EN).
- `src/lib/metrics.ts`: crediting `Resolved` milestones via `resolvedFreelancerBps`, and Sybil-resistant trust level thresholds (requiring both `>= 5` completed milestones and `>= $100` USDC volume).
- `src/lib/escrow.ts`: `MockEscrow` lifecycle at 1.5% (`150 bps`), anti-ghosting `Funded -> Disputed` flow, `freelancerBps` bounds validation, and `topUpDemoClient`.

Run locally:

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
```

## Testnet smoke test

`scripts/smoke-testnet.sh`: creates, funds, submits, and approves a milestone on Stellar Testnet using test identities and prints balances before and after.

## Manual UI test

Run [`demo-script.md`](demo-script.md) end to end (including Pollar BOB preview, Vaquita CTA, downloadable SIAT receipt, and invalid-ID handling on `/app/acuerdo/abc` and `/verificar/abc`).

## Continuous integration

`.github/workflows/ci.yml` runs two jobs on every push and pull request:
- **`contracts`**: `cargo fmt --check`, `cargo clippy --all-targets`, and `cargo test` in `contracts/`.
- **`web`**: `npm ci`, `npm run lint`, `npx tsc --noEmit`, `npm test`, and `npm run build`.
