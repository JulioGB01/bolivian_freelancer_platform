// Map contract error codes to plain messages (docs/04_FRONTEND_SPEC.md).
const MAP: Record<string, string> = {
  AlreadyInitialized: "The contract is already initialized.",
  NotInitialized: "The contract is not initialized yet.",
  AgreementNotFound: "Agreement not found.",
  MilestoneNotFound: "Milestone not found.",
  InvalidStatus: "That action is not available for this milestone's current status.",
  InvalidAmount: "Amount must be greater than zero.",
  InvalidBps: "Percentage must be between 0% and 100%.",
  InvalidMilestoneCount: "An agreement needs between 1 and 10 milestones.",
  SameParty: "The freelancer and client must be different addresses.",
  ReviewWindowOpen: "The review window has not ended yet; you cannot claim yet.",
  ReviewWindowClosed: "The review window has already closed; you cannot dispute now.",
  InsufficientBalance: "Insufficient USDC balance.",
};

export function errorMessage(err: unknown): string {
  if (err instanceof Error) {
    const hit = MAP[err.message];
    if (hit) return hit;
    return err.message;
  }
  return "Something went wrong.";
}
