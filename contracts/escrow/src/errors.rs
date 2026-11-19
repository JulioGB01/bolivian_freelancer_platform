use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    AgreementNotFound = 3,
    MilestoneNotFound = 4,
    /// The milestone is not in the status this function requires.
    InvalidStatus = 5,
    /// Amount must be greater than zero.
    InvalidAmount = 6,
    /// fee_bps or a split share is above 10_000.
    InvalidBps = 7,
    /// Milestone list is empty or longer than MAX_MILESTONES.
    InvalidMilestoneCount = 8,
    /// Freelancer and client must be different addresses.
    SameParty = 9,
    /// `claim_milestone` called before the review window ended.
    ReviewWindowOpen = 10,
    /// `dispute_milestone` called after the review window ended.
    ReviewWindowClosed = 11,
    /// `review_window_secs` is outside `[MIN_REVIEW_WINDOW_SECS, MAX_REVIEW_WINDOW_SECS]`.
    InvalidReviewWindow = 12,
    /// A text field exceeds its maximum allowed length.
    StringTooLong = 13,
}
