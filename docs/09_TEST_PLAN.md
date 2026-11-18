# 09 - Test Plan

## Contract unit tests (`contracts/escrow/src/test.rs`)

Setup pattern: `soroban-examples/timelock/src/test.rs` (`Env::default()`, `env.mock_all_auths()`, `register_stellar_asset_contract_v2` for the token, `env.ledger().with_mut(|l| l.timestamp = ...)` to move time).

| Test | Task | Checks |
|---|---|---|
| initialize_sets_config | T1.1 | get_config returns the values passed |
| initialize_twice_fails | T1.1 | Error AlreadyInitialized |
| initialize_rejects_fee_above_10000_bps | T1.1 | Error InvalidBps |
| create_agreement_stores_pending_milestones_and_indexes | T1.2 | All Pending; id in both indexes; ids increase 0, 1, 2 |
| create_agreement_rejects_empty_or_too_many_milestones | T1.2 | Error InvalidMilestoneCount for 0 and MAX_MILESTONES + 1 |
| create_agreement_rejects_zero_amount_and_same_party | T1.2 | Errors InvalidAmount, SameParty |
| fund_moves_tokens_into_contract | T1.3 | Client balance down, contract balance up by amount; status Funded |
| fund_twice_fails | T1.3 | Error InvalidStatus |
| submit_requires_funded | T1.4 | Submitting a Pending milestone fails InvalidStatus |
| approve_pays_freelancer_minus_fee_and_fee_recipient | T1.5 | Exact balances per spec section 4 |
| fee_snapshot_ignores_later_config_change | T1.5 | update_config after creation does not change payout |
| claim_before_window_fails | T1.6 | Error ReviewWindowOpen |
| claim_after_window_pays_freelancer | T1.6 | Same payout as approve |
| dispute_after_window_fails | T1.7 | Error ReviewWindowClosed |
| resolve_splits_amount_and_takes_fee_from_freelancer_side | T1.7 | Exact balances for e.g. 60/40 split |
| only_arbiter_can_resolve | T1.7 | Without arbiter auth the call fails (use real auth, not mock_all_auths) |
| refund_returns_full_amount_to_client | T1.8 | Client gets full amount; no fee |
| released_milestone_cannot_be_refunded | T1.8 | Error InvalidStatus |
| contract_balance_equals_sum_of_locked_milestones | T1.11 | Invariant holds after a mixed sequence of actions on 2 agreements |
| full_happy_path_three_milestones | T1.11 | 3 milestones funded, submitted, approved/claimed; final balances exact |

Also assert in each test that the expected event was emitted (T1.9) and that the right address's auth was required (inspect `env.auths()` as in the timelock test).

## Testnet smoke test (T2.3)

`scripts/smoke-testnet.sh`: create, fund, submit, approve one milestone using the 4 identities; print balances before and after.

## Manual UI test (T3.9)

`docs/DEMO_SCRIPT.md` run end to end by someone outside the team.
