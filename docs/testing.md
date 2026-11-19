# Testing

## Contract unit tests (`contracts/escrow/src/test.rs`)

Setup pattern: `soroban-examples/timelock/src/test.rs` (`Env::default()`, `env.mock_all_auths()`, `register_stellar_asset_contract_v2` for the token, `env.ledger().with_mut(|l| l.timestamp = ...)` to move time).

| Test | Checks |
|---|---|
| initialize_sets_config | get_config returns the values passed |
| initialize_twice_fails | Error AlreadyInitialized |
| initialize_rejects_fee_above_10000_bps | Error InvalidBps |
| create_agreement_stores_pending_milestones_and_indexes | All Pending; id in both indexes; ids increase 0, 1, 2 |
| create_agreement_rejects_empty_or_too_many_milestones | Error InvalidMilestoneCount for 0 and MAX_MILESTONES + 1 |
| create_agreement_rejects_zero_amount_and_same_party | Errors InvalidAmount, SameParty |
| fund_moves_tokens_into_contract | Client balance down, contract balance up by amount; status Funded |
| fund_twice_fails | Error InvalidStatus |
| submit_requires_funded | Submitting a Pending milestone fails InvalidStatus |
| approve_pays_freelancer_minus_fee_and_fee_recipient | Exact balances per spec section 4 |
| fee_snapshot_ignores_later_config_change | update_config after creation does not change payout |
| claim_before_window_fails | Error ReviewWindowOpen |
| claim_after_window_pays_freelancer | Same payout as approve |
| dispute_after_window_fails | Error ReviewWindowClosed |
| resolve_splits_amount_and_takes_fee_from_freelancer_side | Exact balances for e.g. 60/40 split |
| only_arbiter_can_resolve | Without arbiter auth the call fails (use real auth, not mock_all_auths) |
| refund_returns_full_amount_to_client | Client gets full amount; no fee |
| released_milestone_cannot_be_refunded | Error InvalidStatus |
| contract_balance_equals_sum_of_locked_milestones | Invariant holds after a mixed sequence of actions on 2 agreements |
| full_happy_path_three_milestones | 3 milestones funded, submitted, approved/claimed; final balances exact |

Also assert in each test that the expected event was emitted and that the right address's auth was required (inspect `env.auths()` as in the timelock test).

## Testnet smoke test

`scripts/smoke-testnet.sh`: create, fund, submit, approve one milestone using the test identities; prints balances before and after. Last run: 100 USDC locked, 95 paid to the freelancer, 5 fee.

## Manual UI test

[`demo-script.md`](demo-script.md) run end to end by someone outside the team.

## Continuous integration

`.github/workflows/ci.yml` runs `cargo fmt --check`, `cargo clippy -D warnings` and `cargo test` for the contract, and `npm run lint` and `npm run build` for the web app, on every push.
