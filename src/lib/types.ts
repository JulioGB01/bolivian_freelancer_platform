// Shared TypeScript types mirroring the Soroban contract (docs/contract.md).
// Amounts are integers in the token's smallest unit (USDC on Stellar = 7 decimals).

export type MilestoneStatus =
  | "Pending"
  | "Funded"
  | "Submitted"
  | "Disputed"
  | "Released"
  | "Resolved"
  | "Refunded";

export interface Config {
  admin: string;
  arbiter: string;
  token: string;
  feeBps: number;
  feeRecipient: string;
}

export interface Milestone {
  title: string;
  /** Integer amount in the token's smallest unit. */
  amount: number;
  status: MilestoneStatus;
  evidence: string;
  /** Unix timestamp (seconds) of the last submission; 0 if never submitted. */
  submittedAt: number;
  disputeReason: string;
}

export interface Agreement {
  id: number;
  freelancer: string;
  client: string;
  title: string;
  reviewWindowSecs: number;
  /** Fee snapshot (basis points) taken at creation. */
  feeBps: number;
  milestones: Milestone[];
  createdAt: number;
}

/** One state change of an agreement, for the activity timeline. */
export type ActivityKind =
  | "created"
  | "funded"
  | "submitted"
  | "approved"
  | "claimed"
  | "disputed"
  | "resolved"
  | "refunded";

export interface ActivityItem {
  kind: ActivityKind;
  /** Milestone index; undefined for "created". */
  index?: number;
  /** Unix seconds. */
  at: number;
  /** Testnet only: the transaction that caused it. */
  txHash?: string;
}
