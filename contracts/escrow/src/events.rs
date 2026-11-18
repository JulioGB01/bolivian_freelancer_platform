//! Events emitted on every agreement/milestone state change (spec section 5).
//!
//! Each event carries `agreement_id` (and `index`, where relevant) as topics so
//! indexers can filter by them. The event name is the struct name, converted to
//! snake_case by the `#[contractevent]` macro (e.g. `Funded` -> "funded").
use soroban_sdk::contractevent;

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Created {
    #[topic]
    pub agreement_id: u64,
    pub milestone_count: u32,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Funded {
    #[topic]
    pub agreement_id: u64,
    #[topic]
    pub index: u32,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Submitted {
    #[topic]
    pub agreement_id: u64,
    #[topic]
    pub index: u32,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Approved {
    #[topic]
    pub agreement_id: u64,
    #[topic]
    pub index: u32,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Claimed {
    #[topic]
    pub agreement_id: u64,
    #[topic]
    pub index: u32,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Disputed {
    #[topic]
    pub agreement_id: u64,
    #[topic]
    pub index: u32,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Resolved {
    #[topic]
    pub agreement_id: u64,
    #[topic]
    pub index: u32,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Refunded {
    #[topic]
    pub agreement_id: u64,
    #[topic]
    pub index: u32,
}
