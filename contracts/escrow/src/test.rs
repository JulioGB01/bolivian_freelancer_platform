#![cfg(test)]
//! Test list from docs/09_TEST_PLAN.md. Each test body asserts the state
//! machine, money math and auth behaviour described there.
//! Setup pattern (token, mock auths, ledger time): soroban-examples/timelock.
extern crate std;

use super::*;
use soroban_sdk::testutils::{Address as _, Events, Ledger, MockAuth, MockAuthInvoke};
use soroban_sdk::{token, vec, Address, Env, Event, IntoVal, String};

use token::Client as TokenClient;
use token::StellarAssetClient as TokenAdminClient;

const FEE_BPS: u32 = 100; // 1%
const REVIEW_WINDOW: u64 = 3600; // 1 hour
const INITIAL_TIMESTAMP: u64 = 1_700_000_000;

fn create_token<'a>(env: &Env, admin: &Address) -> (TokenClient<'a>, TokenAdminClient<'a>) {
    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    (
        token::Client::new(env, &sac.address()),
        token::StellarAssetClient::new(env, &sac.address()),
    )
}

struct TestContext<'a> {
    env: Env,
    admin: Address,
    arbiter: Address,
    freelancer: Address,
    client: Address,
    fee_recipient: Address,
    token: TokenClient<'a>,
    escrow: EscrowContractClient<'a>,
    escrow_id: Address,
}

impl<'a> TestContext<'a> {
    fn setup() -> Self {
        let env = Env::default();
        env.mock_all_auths();
        env.ledger().with_mut(|li| li.timestamp = INITIAL_TIMESTAMP);

        let admin = Address::generate(&env);
        let arbiter = Address::generate(&env);
        let freelancer = Address::generate(&env);
        let client = Address::generate(&env);
        let fee_recipient = Address::generate(&env);

        let (token, token_admin) = create_token(&env, &admin);
        // 1000 USDC (7 decimals) to the client.
        token_admin.mint(&client, &10_000_000_000i128);

        let escrow_id = env.register(EscrowContract, ());
        let escrow = EscrowContractClient::new(&env, &escrow_id);
        escrow.initialize(&admin, &arbiter, &token.address, &FEE_BPS, &fee_recipient);

        TestContext {
            env,
            admin,
            arbiter,
            freelancer,
            client,
            fee_recipient,
            token,
            escrow,
            escrow_id,
        }
    }

    fn advance_time(&self, secs: u64) {
        self.env.ledger().with_mut(|li| li.timestamp += secs);
    }

    fn create_agreement(&self, amount: i128) -> u64 {
        self.escrow.create_agreement(
            &self.freelancer,
            &self.client,
            &String::from_str(&self.env, "Test agreement"),
            &vec![
                &self.env,
                MilestoneInput {
                    title: String::from_str(&self.env, "Milestone 1"),
                    amount,
                },
            ],
            &REVIEW_WINDOW,
        )
    }
}

// ---------------------------------------------------------------------------
// T1.1
// ---------------------------------------------------------------------------

#[test]
fn initialize_sets_config() {
    let t = TestContext::setup();
    let config = t.escrow.get_config();
    assert_eq!(config.admin, t.admin);
    assert_eq!(config.arbiter, t.arbiter);
    assert_eq!(config.token, t.token.address);
    assert_eq!(config.fee_bps, FEE_BPS);
    assert_eq!(config.fee_recipient, t.fee_recipient);
}

#[test]
fn initialize_twice_fails() {
    let t = TestContext::setup();
    let r = t.escrow.try_initialize(
        &t.admin,
        &t.arbiter,
        &t.token.address,
        &FEE_BPS,
        &t.fee_recipient,
    );
    assert_eq!(r, Err(Ok(Error::AlreadyInitialized)));
}

#[test]
fn initialize_rejects_fee_above_10000_bps() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let arbiter = Address::generate(&env);
    let fee_recipient = Address::generate(&env);
    let (token, _) = create_token(&env, &admin);
    let escrow_id = env.register(EscrowContract, ());
    let escrow = EscrowContractClient::new(&env, &escrow_id);
    let r = escrow.try_initialize(&admin, &arbiter, &token.address, &10_001, &fee_recipient);
    assert_eq!(r, Err(Ok(Error::InvalidBps)));
}

// ---------------------------------------------------------------------------
// T1.2
// ---------------------------------------------------------------------------

#[test]
fn create_agreement_stores_pending_milestones_and_indexes() {
    let t = TestContext::setup();
    let id0 = t.escrow.create_agreement(
        &t.freelancer,
        &t.client,
        &String::from_str(&t.env, "A"),
        &vec![
            &t.env,
            MilestoneInput {
                title: String::from_str(&t.env, "M1"),
                amount: 100,
            },
            MilestoneInput {
                title: String::from_str(&t.env, "M2"),
                amount: 200,
            },
        ],
        &REVIEW_WINDOW,
    );
    let id1 = t.escrow.create_agreement(
        &t.freelancer,
        &t.client,
        &String::from_str(&t.env, "B"),
        &vec![
            &t.env,
            MilestoneInput {
                title: String::from_str(&t.env, "M1"),
                amount: 300,
            },
        ],
        &REVIEW_WINDOW,
    );
    assert_eq!(id0, 0);
    assert_eq!(id1, 1);

    let ag = t.escrow.get_agreement(&id0);
    assert_eq!(ag.freelancer, t.freelancer);
    assert_eq!(ag.client, t.client);
    assert_eq!(ag.fee_bps, FEE_BPS);
    assert_eq!(ag.milestones.len(), 2);
    for i in 0..2 {
        assert_eq!(
            ag.milestones.get(i).unwrap().status,
            MilestoneStatus::Pending
        );
    }

    let f = t.escrow.agreements_of_freelancer(&t.freelancer);
    let c = t.escrow.agreements_of_client(&t.client);
    assert_eq!(f.len(), 2);
    assert_eq!(c.len(), 2);
    assert_eq!(f.get(0).unwrap(), 0);
    assert_eq!(f.get(1).unwrap(), 1);
    assert_eq!(c.get(0).unwrap(), 0);
    assert_eq!(c.get(1).unwrap(), 1);
}

#[test]
fn create_agreement_rejects_empty_or_too_many_milestones() {
    let t = TestContext::setup();
    let r = t.escrow.try_create_agreement(
        &t.freelancer,
        &t.client,
        &String::from_str(&t.env, "x"),
        &vec![&t.env],
        &REVIEW_WINDOW,
    );
    assert_eq!(r, Err(Ok(Error::InvalidMilestoneCount)));

    let mut ms = vec![&t.env];
    for _ in 0..=MAX_MILESTONES {
        ms.push_back(MilestoneInput {
            title: String::from_str(&t.env, "M"),
            amount: 1_000,
        });
    }
    let r = t.escrow.try_create_agreement(
        &t.freelancer,
        &t.client,
        &String::from_str(&t.env, "x"),
        &ms,
        &REVIEW_WINDOW,
    );
    assert_eq!(r, Err(Ok(Error::InvalidMilestoneCount)));
}

#[test]
fn create_agreement_rejects_zero_amount_and_same_party() {
    let t = TestContext::setup();
    let r = t.escrow.try_create_agreement(
        &t.freelancer,
        &t.client,
        &String::from_str(&t.env, "x"),
        &vec![
            &t.env,
            MilestoneInput {
                title: String::from_str(&t.env, "M"),
                amount: 0,
            },
        ],
        &REVIEW_WINDOW,
    );
    assert_eq!(r, Err(Ok(Error::InvalidAmount)));

    let r = t.escrow.try_create_agreement(
        &t.freelancer,
        &t.freelancer,
        &String::from_str(&t.env, "x"),
        &vec![
            &t.env,
            MilestoneInput {
                title: String::from_str(&t.env, "M"),
                amount: 1_000,
            },
        ],
        &REVIEW_WINDOW,
    );
    assert_eq!(r, Err(Ok(Error::SameParty)));
}

// ---------------------------------------------------------------------------
// T1.3
// ---------------------------------------------------------------------------

#[test]
fn fund_moves_tokens_into_contract() {
    let t = TestContext::setup();
    let amount = 1_000_000_000i128; // 100 USDC
    let id = t.create_agreement(amount);
    let client_before = t.token.balance(&t.client);
    t.escrow.fund_milestone(&id, &0);
    assert_eq!(
        t.env.events().all().filter_by_contract(&t.escrow_id),
        [Funded {
            agreement_id: id,
            index: 0
        }
        .to_xdr(&t.env, &t.escrow_id)],
    );
    assert_eq!(t.token.balance(&t.client), client_before - amount);
    assert_eq!(t.token.balance(&t.escrow_id), amount);
    let ag = t.escrow.get_agreement(&id);
    assert_eq!(
        ag.milestones.get(0).unwrap().status,
        MilestoneStatus::Funded
    );
}

#[test]
fn fund_twice_fails() {
    let t = TestContext::setup();
    let id = t.create_agreement(1_000_000_000i128);
    t.escrow.fund_milestone(&id, &0);
    let r = t.escrow.try_fund_milestone(&id, &0);
    assert_eq!(r, Err(Ok(Error::InvalidStatus)));
}

// ---------------------------------------------------------------------------
// T1.4
// ---------------------------------------------------------------------------

#[test]
fn submit_requires_funded() {
    let t = TestContext::setup();
    let id = t.create_agreement(1_000_000_000i128);
    let r = t
        .escrow
        .try_submit_milestone(&id, &0, &String::from_str(&t.env, "ev"));
    assert_eq!(r, Err(Ok(Error::InvalidStatus)));
}

// ---------------------------------------------------------------------------
// T1.5
// ---------------------------------------------------------------------------

#[test]
fn approve_pays_freelancer_minus_fee_and_fee_recipient() {
    let t = TestContext::setup();
    let amount = 1_000_000_000i128; // 100 USDC
    let id = t.create_agreement(amount);
    t.escrow.fund_milestone(&id, &0);
    t.escrow
        .submit_milestone(&id, &0, &String::from_str(&t.env, "ev"));
    let fl_before = t.token.balance(&t.freelancer);
    let fee_before = t.token.balance(&t.fee_recipient);
    t.escrow.approve_milestone(&id, &0);
    assert_eq!(
        t.env.events().all().filter_by_contract(&t.escrow_id),
        [Approved {
            agreement_id: id,
            index: 0
        }
        .to_xdr(&t.env, &t.escrow_id)],
    );

    let fee = amount * FEE_BPS as i128 / BPS_DENOMINATOR; // 10_000_000
    assert_eq!(t.token.balance(&t.freelancer), fl_before + amount - fee);
    assert_eq!(t.token.balance(&t.fee_recipient), fee_before + fee);
    assert_eq!(t.token.balance(&t.escrow_id), 0);
    let ag = t.escrow.get_agreement(&id);
    assert_eq!(
        ag.milestones.get(0).unwrap().status,
        MilestoneStatus::Released
    );
}

#[test]
fn fee_snapshot_ignores_later_config_change() {
    let t = TestContext::setup();
    let amount = 1_000_000_000i128;
    let id = t.create_agreement(amount); // snapshot 1%
    t.escrow.update_config(&500, &t.fee_recipient, &t.arbiter); // now 5%
    t.escrow.fund_milestone(&id, &0);
    t.escrow
        .submit_milestone(&id, &0, &String::from_str(&t.env, "ev"));
    let fl_before = t.token.balance(&t.freelancer);
    t.escrow.approve_milestone(&id, &0);
    let fee = amount * FEE_BPS as i128 / BPS_DENOMINATOR; // still 1%
    assert_eq!(t.token.balance(&t.freelancer), fl_before + amount - fee);
}

// ---------------------------------------------------------------------------
// T1.6
// ---------------------------------------------------------------------------

#[test]
fn claim_before_window_fails() {
    let t = TestContext::setup();
    let id = t.create_agreement(1_000_000_000i128);
    t.escrow.fund_milestone(&id, &0);
    t.escrow
        .submit_milestone(&id, &0, &String::from_str(&t.env, "ev"));
    let r = t.escrow.try_claim_milestone(&id, &0);
    assert_eq!(r, Err(Ok(Error::ReviewWindowOpen)));
}

#[test]
fn claim_after_window_pays_freelancer() {
    let t = TestContext::setup();
    let amount = 1_000_000_000i128;
    let id = t.create_agreement(amount);
    t.escrow.fund_milestone(&id, &0);
    t.escrow
        .submit_milestone(&id, &0, &String::from_str(&t.env, "ev"));
    t.advance_time(REVIEW_WINDOW + 1);
    let fl_before = t.token.balance(&t.freelancer);
    t.escrow.claim_milestone(&id, &0);
    assert_eq!(
        t.env.events().all().filter_by_contract(&t.escrow_id),
        [Claimed {
            agreement_id: id,
            index: 0
        }
        .to_xdr(&t.env, &t.escrow_id)],
    );
    let fee = amount * FEE_BPS as i128 / BPS_DENOMINATOR;
    assert_eq!(t.token.balance(&t.freelancer), fl_before + amount - fee);
    assert_eq!(t.token.balance(&t.escrow_id), 0);
}

// ---------------------------------------------------------------------------
// T1.7
// ---------------------------------------------------------------------------

#[test]
fn dispute_after_window_fails() {
    let t = TestContext::setup();
    let id = t.create_agreement(1_000_000_000i128);
    t.escrow.fund_milestone(&id, &0);
    t.escrow
        .submit_milestone(&id, &0, &String::from_str(&t.env, "ev"));
    t.advance_time(REVIEW_WINDOW + 1);
    let r = t
        .escrow
        .try_dispute_milestone(&id, &0, &String::from_str(&t.env, "late"));
    assert_eq!(r, Err(Ok(Error::ReviewWindowClosed)));
}

#[test]
fn resolve_splits_amount_and_takes_fee_from_freelancer_side() {
    let t = TestContext::setup();
    let amount = 1_000_000_000i128;
    let id = t.create_agreement(amount);
    t.escrow.fund_milestone(&id, &0);
    t.escrow
        .submit_milestone(&id, &0, &String::from_str(&t.env, "ev"));
    t.escrow
        .dispute_milestone(&id, &0, &String::from_str(&t.env, "reason"));
    let fl_before = t.token.balance(&t.freelancer);
    let client_before = t.token.balance(&t.client);
    let fee_before = t.token.balance(&t.fee_recipient);
    t.escrow.resolve_dispute(&id, &0, &6_000); // 60/40
    assert_eq!(
        t.env.events().all().filter_by_contract(&t.escrow_id),
        [Resolved {
            agreement_id: id,
            index: 0
        }
        .to_xdr(&t.env, &t.escrow_id)],
    );

    let freelancer_part = amount * 6_000 / BPS_DENOMINATOR;
    let client_part = amount - freelancer_part;
    let fee = freelancer_part * FEE_BPS as i128 / BPS_DENOMINATOR;
    assert_eq!(
        t.token.balance(&t.freelancer),
        fl_before + freelancer_part - fee
    );
    assert_eq!(t.token.balance(&t.client), client_before + client_part);
    assert_eq!(t.token.balance(&t.fee_recipient), fee_before + fee);
    assert_eq!(t.token.balance(&t.escrow_id), 0);
}

#[test]
#[should_panic]
fn only_arbiter_can_resolve() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|li| li.timestamp = INITIAL_TIMESTAMP);

    let admin = Address::generate(&env);
    let arbiter = Address::generate(&env);
    let freelancer = Address::generate(&env);
    let client = Address::generate(&env);
    let fee_recipient = Address::generate(&env);
    let (token, token_admin) = create_token(&env, &admin);
    token_admin.mint(&client, &10_000_000_000i128);

    let escrow_id = env.register(EscrowContract, ());
    let escrow = EscrowContractClient::new(&env, &escrow_id);
    escrow.initialize(&admin, &arbiter, &token.address, &FEE_BPS, &fee_recipient);
    let id = escrow.create_agreement(
        &freelancer,
        &client,
        &String::from_str(&env, "t"),
        &vec![
            &env,
            MilestoneInput {
                title: String::from_str(&env, "M"),
                amount: 1_000_000_000i128,
            },
        ],
        &REVIEW_WINDOW,
    );
    escrow.fund_milestone(&id, &0);
    escrow.submit_milestone(&id, &0, &String::from_str(&env, "ev"));
    escrow.dispute_milestone(&id, &0, &String::from_str(&env, "reason"));

    // Only the freelancer is authorized for this call, not the arbiter.
    // The contract calls arbiter.require_auth(), which is not mocked -> panic.
    env.mock_auths(&[MockAuth {
        address: &freelancer,
        invoke: &MockAuthInvoke {
            contract: &escrow_id,
            fn_name: "resolve_dispute",
            args: (id, 0u32, 5_000u32).into_val(&env),
            sub_invokes: &[],
        },
    }]);
    escrow.resolve_dispute(&id, &0, &5_000);
}

// ---------------------------------------------------------------------------
// T1.8
// ---------------------------------------------------------------------------

#[test]
fn refund_returns_full_amount_to_client() {
    let t = TestContext::setup();
    let amount = 1_000_000_000i128;
    let id = t.create_agreement(amount);
    t.escrow.fund_milestone(&id, &0);
    let client_before = t.token.balance(&t.client);
    t.escrow.refund_milestone(&id, &0);
    assert_eq!(
        t.env.events().all().filter_by_contract(&t.escrow_id),
        [Refunded {
            agreement_id: id,
            index: 0
        }
        .to_xdr(&t.env, &t.escrow_id)],
    );
    assert_eq!(t.token.balance(&t.client), client_before + amount);
    assert_eq!(t.token.balance(&t.escrow_id), 0);
    let ag = t.escrow.get_agreement(&id);
    assert_eq!(
        ag.milestones.get(0).unwrap().status,
        MilestoneStatus::Refunded
    );
}

#[test]
fn released_milestone_cannot_be_refunded() {
    let t = TestContext::setup();
    let id = t.create_agreement(1_000_000_000i128);
    t.escrow.fund_milestone(&id, &0);
    t.escrow
        .submit_milestone(&id, &0, &String::from_str(&t.env, "ev"));
    t.escrow.approve_milestone(&id, &0);
    let r = t.escrow.try_refund_milestone(&id, &0);
    assert_eq!(r, Err(Ok(Error::InvalidStatus)));
}

// ---------------------------------------------------------------------------
// T1.11
// ---------------------------------------------------------------------------

#[test]
fn contract_balance_equals_sum_of_locked_milestones() {
    let t = TestContext::setup();
    let id1 = t.escrow.create_agreement(
        &t.freelancer,
        &t.client,
        &String::from_str(&t.env, "A1"),
        &vec![
            &t.env,
            MilestoneInput {
                title: String::from_str(&t.env, "M1"),
                amount: 1_000_000,
            },
            MilestoneInput {
                title: String::from_str(&t.env, "M2"),
                amount: 2_000_000,
            },
        ],
        &REVIEW_WINDOW,
    );
    let id2 = t.escrow.create_agreement(
        &t.freelancer,
        &t.client,
        &String::from_str(&t.env, "A2"),
        &vec![
            &t.env,
            MilestoneInput {
                title: String::from_str(&t.env, "M1"),
                amount: 3_000_000,
            },
        ],
        &REVIEW_WINDOW,
    );

    t.escrow.fund_milestone(&id1, &0);
    t.escrow.fund_milestone(&id1, &1);
    t.escrow.fund_milestone(&id2, &0);
    assert_eq!(t.token.balance(&t.escrow_id), 6_000_000);

    t.escrow
        .submit_milestone(&id1, &0, &String::from_str(&t.env, "ev"));
    t.escrow.approve_milestone(&id1, &0);
    assert_eq!(t.token.balance(&t.escrow_id), 5_000_000);

    t.escrow
        .submit_milestone(&id2, &0, &String::from_str(&t.env, "ev"));
    t.escrow
        .dispute_milestone(&id2, &0, &String::from_str(&t.env, "bad"));
    assert_eq!(t.token.balance(&t.escrow_id), 5_000_000);

    t.escrow.resolve_dispute(&id2, &0, &5_000);
    assert_eq!(t.token.balance(&t.escrow_id), 2_000_000);

    t.escrow.refund_milestone(&id1, &1);
    assert_eq!(t.token.balance(&t.escrow_id), 0);
}

#[test]
fn full_happy_path_three_milestones() {
    let t = TestContext::setup();
    let amounts = [100_000_000i128, 200_000_000, 300_000_000]; // 10, 20, 30 USDC
    let id = t.escrow.create_agreement(
        &t.freelancer,
        &t.client,
        &String::from_str(&t.env, "Big"),
        &vec![
            &t.env,
            MilestoneInput {
                title: String::from_str(&t.env, "M1"),
                amount: amounts[0],
            },
            MilestoneInput {
                title: String::from_str(&t.env, "M2"),
                amount: amounts[1],
            },
            MilestoneInput {
                title: String::from_str(&t.env, "M3"),
                amount: amounts[2],
            },
        ],
        &REVIEW_WINDOW,
    );

    let client_start = t.token.balance(&t.client);
    let fl_start = t.token.balance(&t.freelancer);
    let fee_start = t.token.balance(&t.fee_recipient);

    for i in 0..3u32 {
        t.escrow.fund_milestone(&id, &i);
    }

    // M0: approved.
    t.escrow
        .submit_milestone(&id, &0, &String::from_str(&t.env, "ev0"));
    t.escrow.approve_milestone(&id, &0);
    // M1: claimed after window.
    t.escrow
        .submit_milestone(&id, &1, &String::from_str(&t.env, "ev1"));
    t.advance_time(REVIEW_WINDOW + 1);
    t.escrow.claim_milestone(&id, &1);
    // M2: disputed then resolved 60/40.
    t.escrow
        .submit_milestone(&id, &2, &String::from_str(&t.env, "ev2"));
    t.escrow
        .dispute_milestone(&id, &2, &String::from_str(&t.env, "dispute"));
    t.escrow.resolve_dispute(&id, &2, &6_000);

    let fee0 = amounts[0] * FEE_BPS as i128 / BPS_DENOMINATOR;
    let fee1 = amounts[1] * FEE_BPS as i128 / BPS_DENOMINATOR;
    let fl2 = amounts[2] * 6_000 / BPS_DENOMINATOR;
    let fee2 = fl2 * FEE_BPS as i128 / BPS_DENOMINATOR;
    let client_part = amounts[2] - fl2;

    let fl_gain = (amounts[0] - fee0) + (amounts[1] - fee1) + (fl2 - fee2);
    let fee_total = fee0 + fee1 + fee2;
    let total = amounts[0] + amounts[1] + amounts[2];

    assert_eq!(t.token.balance(&t.freelancer), fl_start + fl_gain);
    assert_eq!(t.token.balance(&t.fee_recipient), fee_start + fee_total);
    assert_eq!(
        t.token.balance(&t.client),
        client_start - total + client_part
    );
    assert_eq!(t.token.balance(&t.escrow_id), 0);
}
