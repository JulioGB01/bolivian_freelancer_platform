use soroban_sdk::{contracttype, Address, String, Vec};

/// Global configuration, set once by `initialize`.
#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct Config {
    /// Can change `fee_bps`, `fee_recipient` and `arbiter` for FUTURE agreements.
    pub admin: Address,
    /// Resolves disputed milestones.
    pub arbiter: Address,
    /// Stellar Asset Contract address of the stablecoin used for all agreements (USDC).
    pub token: Address,
    /// Platform fee in basis points (1 bp = 0.01%). Value is decision D-03.
    pub fee_bps: u32,
    /// Receives the platform fee on every release.
    pub fee_recipient: Address,
}

/// What the freelancer sends to `create_agreement` for each milestone.
#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct MilestoneInput {
    pub title: String,
    /// Amount in the token's smallest unit (USDC on Stellar uses 7 decimals).
    pub amount: i128,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[contracttype]
pub enum MilestoneStatus {
    /// Created, no money locked yet.
    Pending,
    /// Client locked `amount` in the contract.
    Funded,
    /// Freelancer delivered; review window is running.
    Submitted,
    /// Client opened a dispute during the review window.
    Disputed,
    /// Money paid to the freelancer (minus fee). Final.
    Released,
    /// Arbiter split the money. Final.
    Resolved,
    /// Money returned to the client by the freelancer. Final.
    Refunded,
}

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct Milestone {
    pub title: String,
    pub amount: i128,
    pub status: MilestoneStatus,
    /// Link or hash of the delivered work, set by `submit_milestone`.
    pub evidence: String,
    /// Ledger timestamp (seconds) of the last submission; 0 if never submitted.
    pub submitted_at: u64,
    /// Reason given by the client in `dispute_milestone`.
    pub dispute_reason: String,
}

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct Agreement {
    pub id: u64,
    pub freelancer: Address,
    pub client: Address,
    pub title: String,
    /// Seconds the client has to approve or dispute after a submission.
    /// After that, the freelancer can `claim_milestone`. Value is decision D-05.
    pub review_window_secs: u64,
    /// Fee snapshot taken from Config at creation. Later fee changes never
    /// affect an existing agreement.
    pub fee_bps: u32,
    pub milestones: Vec<Milestone>,
    pub created_at: u64,
}

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub enum DataKey {
    /// Instance storage: Config.
    Config,
    /// Instance storage: u64 counter, next agreement id.
    NextId,
    /// Persistent storage: Agreement by id.
    Agreement(u64),
    /// Persistent storage: Vec<u64> of agreement ids where the address is the freelancer.
    ByFreelancer(Address),
    /// Persistent storage: Vec<u64> of agreement ids where the address is the client.
    ByClient(Address),
}
