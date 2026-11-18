//! bfe-escrow: milestone escrow for freelancer agreements, paid in USDC on Stellar.
//!
//! Full specification: docs/03_CONTRACT_SPEC.md. The milestone state machine is
//! described there; every function below enforces exactly the transitions and
//! preconditions in that document.
#![no_std]

mod errors;
mod events;
mod types;

pub use errors::Error;
pub use events::{Approved, Claimed, Created, Disputed, Funded, Refunded, Resolved, Submitted};
pub use types::{Agreement, Config, DataKey, Milestone, MilestoneInput, MilestoneStatus};

use soroban_sdk::{contract, contractimpl, token, Address, Env, String, Vec};

/// Upper bound on milestones per agreement. Value is decision D-06.
pub const MAX_MILESTONES: u32 = 10;
/// 100% in basis points.
pub const BPS_DENOMINATOR: i128 = 10_000;

/// TTL extension (decision D-07): follow the `soroban-examples/ttl` pattern.
/// `extend_ttl(threshold, extend_to)` sets the remaining TTL to `extend_to`
/// ledgers only when it is currently below `threshold`.
const INSTANCE_TTL_THRESHOLD: u32 = 2_000;
const INSTANCE_TTL_EXTEND_TO: u32 = 10_000;
const PERSISTENT_TTL_THRESHOLD: u32 = 1_000;
const PERSISTENT_TTL_EXTEND_TO: u32 = 5_000;

#[contract]
pub struct EscrowContract;

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------

fn extend_instance_ttl(env: &Env) {
    env.storage()
        .instance()
        .extend_ttl(INSTANCE_TTL_THRESHOLD, INSTANCE_TTL_EXTEND_TO);
}

fn read_config(env: &Env) -> Result<Config, Error> {
    env.storage()
        .instance()
        .get(&DataKey::Config)
        .ok_or(Error::NotInitialized)
}

fn has_config(env: &Env) -> bool {
    env.storage().instance().has(&DataKey::Config)
}

fn read_next_id(env: &Env) -> u64 {
    env.storage().instance().get(&DataKey::NextId).unwrap_or(0)
}

fn set_next_id(env: &Env, id: u64) {
    env.storage().instance().set(&DataKey::NextId, &id);
    extend_instance_ttl(env);
}

fn read_agreement(env: &Env, id: u64) -> Result<Agreement, Error> {
    env.storage()
        .persistent()
        .get(&DataKey::Agreement(id))
        .ok_or(Error::AgreementNotFound)
}

fn save_agreement(env: &Env, agreement: &Agreement) {
    let key = DataKey::Agreement(agreement.id);
    env.storage().persistent().set(&key, agreement);
    env.storage()
        .persistent()
        .extend_ttl(&key, PERSISTENT_TTL_THRESHOLD, PERSISTENT_TTL_EXTEND_TO);
}

fn push_index(env: &Env, key: &DataKey, id: u64) {
    let mut ids: Vec<u64> = env.storage().persistent().get(key).unwrap_or(Vec::new(env));
    ids.push_back(id);
    env.storage().persistent().set(key, &ids);
    env.storage()
        .persistent()
        .extend_ttl(key, PERSISTENT_TTL_THRESHOLD, PERSISTENT_TTL_EXTEND_TO);
}

/// Transfer `amount` from the contract to `to`, skipping zero-value transfers.
fn payout_transfer(env: &Env, token: &Address, to: &Address, amount: i128) {
    if amount > 0 {
        token::Client::new(env, token).transfer(&env.current_contract_address(), to, &amount);
    }
}

#[contractimpl]
impl EscrowContract {
    // ------------------------------------------------------------------
    // Admin
    // ------------------------------------------------------------------

    /// One-time setup. Requires admin auth. Fails with AlreadyInitialized on a
    /// second call and InvalidBps when `fee_bps` is above 10_000.
    pub fn initialize(
        env: Env,
        admin: Address,
        arbiter: Address,
        token: Address,
        fee_bps: u32,
        fee_recipient: Address,
    ) -> Result<(), Error> {
        if has_config(&env) {
            return Err(Error::AlreadyInitialized);
        }
        admin.require_auth();
        if fee_bps > BPS_DENOMINATOR as u32 {
            return Err(Error::InvalidBps);
        }
        env.storage().instance().set(
            &DataKey::Config,
            &Config {
                admin,
                arbiter,
                token,
                fee_bps,
                fee_recipient,
            },
        );
        set_next_id(&env, 0);
        Ok(())
    }

    /// Admin changes fee, fee recipient and arbiter for FUTURE agreements only.
    /// Existing agreements keep their fee snapshot.
    pub fn update_config(
        env: Env,
        fee_bps: u32,
        fee_recipient: Address,
        arbiter: Address,
    ) -> Result<(), Error> {
        let mut config = read_config(&env)?;
        config.admin.require_auth();
        if fee_bps > BPS_DENOMINATOR as u32 {
            return Err(Error::InvalidBps);
        }
        config.fee_bps = fee_bps;
        config.fee_recipient = fee_recipient;
        config.arbiter = arbiter;
        env.storage().instance().set(&DataKey::Config, &config);
        extend_instance_ttl(&env);
        Ok(())
    }

    // ------------------------------------------------------------------
    // Agreement lifecycle
    // ------------------------------------------------------------------

    /// Freelancer creates the agreement and its milestones. Requires freelancer
    /// auth. All milestones start Pending. Snapshots Config.fee_bps into the
    /// agreement and indexes the id under both parties.
    pub fn create_agreement(
        env: Env,
        freelancer: Address,
        client: Address,
        title: String,
        milestones: Vec<MilestoneInput>,
        review_window_secs: u64,
    ) -> Result<u64, Error> {
        freelancer.require_auth();
        let config = read_config(&env)?;
        if freelancer == client {
            return Err(Error::SameParty);
        }
        let count = milestones.len();
        if count == 0 || count > MAX_MILESTONES {
            return Err(Error::InvalidMilestoneCount);
        }

        let mut stored: Vec<Milestone> = Vec::new(&env);
        for i in 0..count {
            let input = milestones.get(i).unwrap();
            if input.amount <= 0 {
                return Err(Error::InvalidAmount);
            }
            stored.push_back(Milestone {
                title: input.title,
                amount: input.amount,
                status: MilestoneStatus::Pending,
                evidence: String::from_str(&env, ""),
                submitted_at: 0,
                dispute_reason: String::from_str(&env, ""),
            });
        }

        let id = read_next_id(&env);
        let agreement = Agreement {
            id,
            freelancer: freelancer.clone(),
            client: client.clone(),
            title,
            review_window_secs,
            fee_bps: config.fee_bps,
            milestones: stored,
            created_at: env.ledger().timestamp(),
        };
        save_agreement(&env, &agreement);
        push_index(&env, &DataKey::ByFreelancer(freelancer), id);
        push_index(&env, &DataKey::ByClient(client), id);
        set_next_id(&env, id + 1);
        events::Created {
            agreement_id: id,
            milestone_count: count,
        }
        .publish(&env);
        Ok(id)
    }

    /// Client locks the milestone amount in the contract. Requires client auth.
    /// Pending -> Funded. Token moves client -> contract.
    pub fn fund_milestone(env: Env, agreement_id: u64, index: u32) -> Result<(), Error> {
        let mut agreement = read_agreement(&env, agreement_id)?;
        agreement.client.require_auth();
        let milestone = agreement
            .milestones
            .get(index)
            .ok_or(Error::MilestoneNotFound)?;
        if milestone.status != MilestoneStatus::Pending {
            return Err(Error::InvalidStatus);
        }
        let config = read_config(&env)?;
        token::Client::new(&env, &config.token).transfer(
            &agreement.client,
            env.current_contract_address(),
            &milestone.amount,
        );
        agreement.milestones.set(
            index,
            Milestone {
                status: MilestoneStatus::Funded,
                ..milestone
            },
        );
        save_agreement(&env, &agreement);
        events::Funded {
            agreement_id,
            index,
        }
        .publish(&env);
        Ok(())
    }

    /// Freelancer delivers. Requires freelancer auth. Funded -> Submitted.
    pub fn submit_milestone(
        env: Env,
        agreement_id: u64,
        index: u32,
        evidence: String,
    ) -> Result<(), Error> {
        let mut agreement = read_agreement(&env, agreement_id)?;
        agreement.freelancer.require_auth();
        let milestone = agreement
            .milestones
            .get(index)
            .ok_or(Error::MilestoneNotFound)?;
        if milestone.status != MilestoneStatus::Funded {
            return Err(Error::InvalidStatus);
        }
        agreement.milestones.set(
            index,
            Milestone {
                status: MilestoneStatus::Submitted,
                evidence,
                submitted_at: env.ledger().timestamp(),
                ..milestone
            },
        );
        save_agreement(&env, &agreement);
        events::Submitted {
            agreement_id,
            index,
        }
        .publish(&env);
        Ok(())
    }

    /// Client approves a submission. Requires client auth.
    /// Submitted -> Released. Pays amount - fee to freelancer, fee to recipient.
    pub fn approve_milestone(env: Env, agreement_id: u64, index: u32) -> Result<(), Error> {
        let mut agreement = read_agreement(&env, agreement_id)?;
        agreement.client.require_auth();
        let milestone = agreement
            .milestones
            .get(index)
            .ok_or(Error::MilestoneNotFound)?;
        if milestone.status != MilestoneStatus::Submitted {
            return Err(Error::InvalidStatus);
        }
        let amount = milestone.amount;
        // State is updated before outgoing transfers (security checklist).
        agreement.milestones.set(
            index,
            Milestone {
                status: MilestoneStatus::Released,
                ..milestone
            },
        );
        save_agreement(&env, &agreement);
        let config = read_config(&env)?;
        let fee = amount * (agreement.fee_bps as i128) / BPS_DENOMINATOR;
        payout_transfer(&env, &config.token, &agreement.freelancer, amount - fee);
        payout_transfer(&env, &config.token, &config.fee_recipient, fee);
        events::Approved {
            agreement_id,
            index,
        }
        .publish(&env);
        Ok(())
    }

    /// Freelancer collects after the review window ended with no approval and no
    /// dispute. Requires freelancer auth. Submitted -> Released (same payout).
    pub fn claim_milestone(env: Env, agreement_id: u64, index: u32) -> Result<(), Error> {
        let mut agreement = read_agreement(&env, agreement_id)?;
        agreement.freelancer.require_auth();
        let milestone = agreement
            .milestones
            .get(index)
            .ok_or(Error::MilestoneNotFound)?;
        if milestone.status != MilestoneStatus::Submitted {
            return Err(Error::InvalidStatus);
        }
        let now = env.ledger().timestamp();
        if now
            < milestone
                .submitted_at
                .saturating_add(agreement.review_window_secs)
        {
            return Err(Error::ReviewWindowOpen);
        }
        let amount = milestone.amount;
        agreement.milestones.set(
            index,
            Milestone {
                status: MilestoneStatus::Released,
                ..milestone
            },
        );
        save_agreement(&env, &agreement);
        let config = read_config(&env)?;
        let fee = amount * (agreement.fee_bps as i128) / BPS_DENOMINATOR;
        payout_transfer(&env, &config.token, &agreement.freelancer, amount - fee);
        payout_transfer(&env, &config.token, &config.fee_recipient, fee);
        events::Claimed {
            agreement_id,
            index,
        }
        .publish(&env);
        Ok(())
    }

    /// Client disputes a submission inside the review window. Requires client
    /// auth. Submitted -> Disputed.
    pub fn dispute_milestone(
        env: Env,
        agreement_id: u64,
        index: u32,
        reason: String,
    ) -> Result<(), Error> {
        let mut agreement = read_agreement(&env, agreement_id)?;
        agreement.client.require_auth();
        let milestone = agreement
            .milestones
            .get(index)
            .ok_or(Error::MilestoneNotFound)?;
        if milestone.status != MilestoneStatus::Submitted {
            return Err(Error::InvalidStatus);
        }
        let now = env.ledger().timestamp();
        if now
            >= milestone
                .submitted_at
                .saturating_add(agreement.review_window_secs)
        {
            return Err(Error::ReviewWindowClosed);
        }
        agreement.milestones.set(
            index,
            Milestone {
                status: MilestoneStatus::Disputed,
                dispute_reason: reason,
                ..milestone
            },
        );
        save_agreement(&env, &agreement);
        events::Disputed {
            agreement_id,
            index,
        }
        .publish(&env);
        Ok(())
    }

    /// Arbiter splits a disputed milestone. Requires arbiter auth. Disputed ->
    /// Resolved. `freelancer_bps` of the amount goes to the freelancer side
    /// (fee taken from that side only), the rest back to the client.
    pub fn resolve_dispute(
        env: Env,
        agreement_id: u64,
        index: u32,
        freelancer_bps: u32,
    ) -> Result<(), Error> {
        let mut agreement = read_agreement(&env, agreement_id)?;
        let config = read_config(&env)?;
        config.arbiter.require_auth();
        if freelancer_bps > BPS_DENOMINATOR as u32 {
            return Err(Error::InvalidBps);
        }
        let milestone = agreement
            .milestones
            .get(index)
            .ok_or(Error::MilestoneNotFound)?;
        if milestone.status != MilestoneStatus::Disputed {
            return Err(Error::InvalidStatus);
        }
        let amount = milestone.amount;
        agreement.milestones.set(
            index,
            Milestone {
                status: MilestoneStatus::Resolved,
                ..milestone
            },
        );
        save_agreement(&env, &agreement);

        let freelancer_part = amount * (freelancer_bps as i128) / BPS_DENOMINATOR;
        let client_part = amount - freelancer_part;
        let fee = freelancer_part * (agreement.fee_bps as i128) / BPS_DENOMINATOR;
        payout_transfer(
            &env,
            &config.token,
            &agreement.freelancer,
            freelancer_part - fee,
        );
        payout_transfer(&env, &config.token, &config.fee_recipient, fee);
        payout_transfer(&env, &config.token, &agreement.client, client_part);
        events::Resolved {
            agreement_id,
            index,
        }
        .publish(&env);
        Ok(())
    }

    /// Freelancer voluntarily returns the full amount to the client. Requires
    /// freelancer auth. Funded or Submitted -> Refunded. No fee.
    pub fn refund_milestone(env: Env, agreement_id: u64, index: u32) -> Result<(), Error> {
        let mut agreement = read_agreement(&env, agreement_id)?;
        agreement.freelancer.require_auth();
        let milestone = agreement
            .milestones
            .get(index)
            .ok_or(Error::MilestoneNotFound)?;
        if milestone.status != MilestoneStatus::Funded
            && milestone.status != MilestoneStatus::Submitted
        {
            return Err(Error::InvalidStatus);
        }
        let amount = milestone.amount;
        agreement.milestones.set(
            index,
            Milestone {
                status: MilestoneStatus::Refunded,
                ..milestone
            },
        );
        save_agreement(&env, &agreement);
        let config = read_config(&env)?;
        payout_transfer(&env, &config.token, &agreement.client, amount);
        events::Refunded {
            agreement_id,
            index,
        }
        .publish(&env);
        Ok(())
    }

    // ------------------------------------------------------------------
    // Read-only
    // ------------------------------------------------------------------

    pub fn get_config(env: Env) -> Result<Config, Error> {
        let config = read_config(&env)?;
        extend_instance_ttl(&env);
        Ok(config)
    }

    pub fn get_agreement(env: Env, agreement_id: u64) -> Result<Agreement, Error> {
        let agreement = read_agreement(&env, agreement_id)?;
        extend_instance_ttl(&env);
        Ok(agreement)
    }

    /// Ids where `address` is the freelancer. Empty Vec if none.
    pub fn agreements_of_freelancer(env: Env, address: Address) -> Vec<u64> {
        let ids = env
            .storage()
            .persistent()
            .get(&DataKey::ByFreelancer(address))
            .unwrap_or(Vec::new(&env));
        extend_instance_ttl(&env);
        ids
    }

    /// Ids where `address` is the client. Empty Vec if none.
    pub fn agreements_of_client(env: Env, address: Address) -> Vec<u64> {
        let ids = env
            .storage()
            .persistent()
            .get(&DataKey::ByClient(address))
            .unwrap_or(Vec::new(&env));
        extend_instance_ttl(&env);
        ids
    }
}

mod test;
