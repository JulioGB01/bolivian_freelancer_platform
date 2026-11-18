---
name: soroban-contract
description: Use for any change in contracts/ - implementing escrow functions, writing tests, building the wasm.
---

# Working on the bfe-escrow contract

## Before coding

- Read `docs/03_CONTRACT_SPEC.md` fully. The spec is the source of truth; the code follows it.
- Open the matching example in `soroban-examples` (AGENTS.md section 7) for any SDK feature you use: token transfer (`timelock`), errors (`errors`), events (`events`), TTL (`ttl`), auth (`auth`). Use the idioms of soroban-sdk 28.0.0 as they appear in those files.

## Implementation rules

- Load the agreement, check status and auth, update state, save, then transfer tokens.
- Return `Err(Error::...)` from `errors.rs`; no `panic!` for expected failures.
- Put the payout logic (spec section 4) in one private function used by approve, claim and resolve.
- Read and write storage through small private helpers (`load_agreement`, `save_agreement`, `bump_ttl`) so TTL handling lives in one place.
- Integer math only; multiply before dividing; use `checked_*` or rely on `overflow-checks = true` and test edge amounts.

## Tests

- One test per row in `docs/09_TEST_PLAN.md`; stubs already exist in `src/test.rs`. Remove `#[ignore]` when implemented.
- Shared setup function: env, mock auths, ledger timestamp, token via `register_stellar_asset_contract_v2`, mint to client, register contract, initialize.
- For auth tests, do not use `mock_all_auths`; assert the failure.

## Commands (run in `contracts/`)

```
cargo fmt --all
cargo clippy --all-targets -- -D warnings
cargo test
cd escrow && stellar contract build
```
