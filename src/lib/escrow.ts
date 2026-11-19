// Escrow client. In demo mode this is a faithful in-browser simulation of the
// Soroban contract (same state machine and money math as
// contracts/escrow/src/lib.rs). In testnet mode the same `EscrowApi` interface is
// implemented by RealEscrow (lib/escrowReal.ts) over the generated contract bindings.
//
// Amounts are integers in the token's smallest unit (7 decimals). Money math is
// integer-only, rounding down, multiplication before division, exactly like the
// contract (docs/contract.md, money math).
import { getMode } from "./mode";
import { RealEscrow } from "./escrowReal";
import { BPS_DENOMINATOR } from "./format";
import type { ActivityItem, ActivityKind, Agreement, Config, Milestone, MilestoneStatus } from "./types";

export interface NewMilestoneInput {
  title: string;
  amount: number;
}

export interface NewAgreementInput {
  freelancer: string;
  client: string;
  title: string;
  milestones: NewMilestoneInput[];
  reviewWindowSecs: number;
}

export interface EscrowApi {
  getConfig(): Promise<Config>;
  getAgreement(id: number): Promise<Agreement | null>;
  agreementsOf(address: string): Promise<Agreement[]>;
  /** Demo-only: list every agreement (used by the arbiter panel). */
  listAll(): Promise<Agreement[]>;
  balanceOf(address: string): Promise<number>;
  createAgreement(input: NewAgreementInput): Promise<number>;
  fundMilestone(id: number, index: number): Promise<void>;
  submitMilestone(id: number, index: number, evidence: string): Promise<void>;
  approveMilestone(id: number, index: number): Promise<void>;
  claimMilestone(id: number, index: number): Promise<void>;
  disputeMilestone(id: number, index: number, reason: string): Promise<void>;
  resolveDispute(id: number, index: number, freelancerBps: number): Promise<void>;
  refundMilestone(id: number, index: number): Promise<void>;
  /** State changes of one agreement, oldest first. */
  activity(id: number): Promise<ActivityItem[]>;
  /** Hash of the last submitted transaction (testnet mode only). */
  lastTxHash?: string | null;
}

export class EscrowError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EscrowError";
  }
}

// ---------------------------------------------------------------------------
// Demo (mock) implementation
// ---------------------------------------------------------------------------

const STATE_KEY = "bfe.mock.state";
const MAX_MILESTONES = 10;
export const DEMO_FEE_BPS = 150; // 1.5%, matching the hardened contract.
export const MIN_REVIEW_WINDOW_SECS = 3600; // 1 hour
export const MAX_REVIEW_WINDOW_SECS = 30 * 86400; // 30 days
const DEMO_INITIAL_BALANCE = 1_000_000_000; // 100 USDC, 7 decimals.
export const DEMO_TOP_UP_AMOUNT = 10_000_000_000; // 1,000 USDC, 7 decimals.

interface MockState {
  config: Config;
  nextId: number;
  agreements: Record<number, Agreement>;
  balances: Record<string, number>;
  activity?: Record<number, ActivityItem[]>;
}

function nowSecs(): number {
  return Math.floor(Date.now() / 1000);
}

function defaultState(): MockState {
  return {
    config: {
      admin: "demo-admin",
      arbiter: "demo-arbiter",
      token: "demo-usdc",
      feeBps: DEMO_FEE_BPS,
      feeRecipient: "demo-fee-recipient",
    },
    nextId: 0,
    agreements: {},
    balances: {
      "demo-freelancer": DEMO_INITIAL_BALANCE,
      "demo-client": DEMO_INITIAL_BALANCE,
      "demo-arbiter": 0,
      "demo-fee-recipient": 0,
      "demo-admin": 0,
    },
  };
}

function loadState(): MockState {
  if (typeof window === "undefined") return defaultState();
  const raw = window.localStorage.getItem(STATE_KEY);
  if (!raw) return defaultState();
  try {
    const parsed = JSON.parse(raw) as MockState;
    // Reset demo data saved with an older fee so the demo matches the 1.5% fee.
    if (!parsed.config || !parsed.balances || !parsed.agreements || parsed.config.feeBps !== DEMO_FEE_BPS) {
      return defaultState();
    }
    return parsed;
  } catch {
    return defaultState();
  }
}

function saveState(s: MockState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STATE_KEY, JSON.stringify(s));
}

/** Deterministic "next state" executor shared by all state changes. */
export class MockEscrow implements EscrowApi {
  private state: MockState;

  constructor(initialState?: MockState) {
    this.state = initialState ?? loadState();
  }

  topUp(address: string, amount: number): void {
    if (!Number.isFinite(amount) || amount <= 0) throw new EscrowError("InvalidAmount");
    this.state.balances[address] = (this.state.balances[address] ?? 0) + Math.floor(amount);
    this.persist();
  }

  private log(id: number, kind: ActivityKind, index?: number): void {
    const all = (this.state.activity ??= {});
    (all[id] ??= []).push({ kind, index, at: nowSecs() });
  }

  async activity(id: number): Promise<ActivityItem[]> {
    return [...(this.state.activity?.[id] ?? [])];
  }

  private persist(): void {
    saveState(this.state);
  }

  private agreement(id: number): Agreement {
    const a = this.state.agreements[id];
    if (!a) throw new EscrowError("AgreementNotFound");
    return a;
  }

  private milestone(a: Agreement, index: number): Milestone {
    const m = a.milestones[index];
    if (!m) throw new EscrowError("MilestoneNotFound");
    return m;
  }

  private requireStatus(a: Agreement, index: number, allowed: MilestoneStatus[]): Milestone {
    const m = this.milestone(a, index);
    if (!allowed.includes(m.status)) throw new EscrowError("InvalidStatus");
    return m;
  }

  private transfer(from: string, to: string, amount: number): void {
    if (amount <= 0) return;
    if ((this.state.balances[from] ?? 0) < amount) {
      throw new EscrowError("InsufficientBalance");
    }
    this.state.balances[from] -= amount;
    this.state.balances[to] = (this.state.balances[to] ?? 0) + amount;
  }

  async getConfig(): Promise<Config> {
    return this.state.config;
  }

  async getAgreement(id: number): Promise<Agreement | null> {
    return this.state.agreements[id] ?? null;
  }

  async agreementsOf(address: string): Promise<Agreement[]> {
    return Object.values(this.state.agreements)
      .filter((a) => a.freelancer === address || a.client === address)
      .sort((a, b) => b.id - a.id);
  }

  async listAll(): Promise<Agreement[]> {
    return Object.values(this.state.agreements).sort((a, b) => b.id - a.id);
  }

  async balanceOf(address: string): Promise<number> {
    return this.state.balances[address] ?? 0;
  }

  async createAgreement(input: NewAgreementInput): Promise<number> {
    if (input.freelancer === input.client) throw new EscrowError("SameParty");
    if (input.reviewWindowSecs < MIN_REVIEW_WINDOW_SECS || input.reviewWindowSecs > MAX_REVIEW_WINDOW_SECS) {
      throw new EscrowError("InvalidReviewWindow");
    }
    const count = input.milestones.length;
    if (count === 0 || count > MAX_MILESTONES) throw new EscrowError("InvalidMilestoneCount");
    for (const m of input.milestones) {
      if (m.amount <= 0) throw new EscrowError("InvalidAmount");
    }
    const id = this.state.nextId;
    const milestones: Milestone[] = input.milestones.map((m) => ({
      title: m.title,
      amount: m.amount,
      status: "Pending",
      evidence: "",
      submittedAt: 0,
      disputeReason: "",
    }));
    this.state.agreements[id] = {
      id,
      freelancer: input.freelancer,
      client: input.client,
      title: input.title,
      reviewWindowSecs: input.reviewWindowSecs,
      feeBps: this.state.config.feeBps, // snapshot
      arbiter: this.state.config.arbiter, // snapshot
      feeRecipient: this.state.config.feeRecipient, // snapshot
      milestones,
      createdAt: nowSecs(),
    };
    this.state.nextId += 1;
    this.log(id, "created"); this.persist();
    return id;
  }

  async fundMilestone(id: number, index: number): Promise<void> {
    const a = this.agreement(id);
    const m = this.requireStatus(a, index, ["Pending"]);
    this.transfer(a.client, "CONTRACT", m.amount);
    m.status = "Funded";
    this.log(id, "funded", index); this.persist();
  }

  async submitMilestone(id: number, index: number, evidence: string): Promise<void> {
    const a = this.agreement(id);
    const m = this.requireStatus(a, index, ["Funded"]);
    m.evidence = evidence;
    m.submittedAt = nowSecs();
    m.status = "Submitted";
    this.log(id, "submitted", index); this.persist();
  }

  async approveMilestone(id: number, index: number): Promise<void> {
    const a = this.agreement(id);
    const m = this.requireStatus(a, index, ["Submitted"]);
    const amount = m.amount;
    m.status = "Released";
    const fee = Math.floor((amount * a.feeBps) / BPS_DENOMINATOR);
    this.transfer("CONTRACT", a.freelancer, amount - fee);
    this.transfer("CONTRACT", a.feeRecipient ?? this.state.config.feeRecipient, fee);
    this.log(id, "approved", index); this.persist();
  }

  async claimMilestone(id: number, index: number): Promise<void> {
    const a = this.agreement(id);
    const m = this.requireStatus(a, index, ["Submitted"]);
    if (nowSecs() < m.submittedAt + a.reviewWindowSecs) throw new EscrowError("ReviewWindowOpen");
    const amount = m.amount;
    m.status = "Released";
    const fee = Math.floor((amount * a.feeBps) / BPS_DENOMINATOR);
    this.transfer("CONTRACT", a.freelancer, amount - fee);
    this.transfer("CONTRACT", a.feeRecipient ?? this.state.config.feeRecipient, fee);
    this.log(id, "claimed", index); this.persist();
  }

  async disputeMilestone(id: number, index: number, reason: string): Promise<void> {
    const a = this.agreement(id);
    const m = this.requireStatus(a, index, ["Funded", "Submitted"]);
    if (m.status === "Submitted" && nowSecs() >= m.submittedAt + a.reviewWindowSecs) {
      throw new EscrowError("ReviewWindowClosed");
    }
    m.disputeReason = reason;
    m.status = "Disputed";
    this.log(id, "disputed", index); this.persist();
  }

  async resolveDispute(id: number, index: number, freelancerBps: number): Promise<void> {
    const a = this.agreement(id);
    const m = this.requireStatus(a, index, ["Disputed"]);
    if (!Number.isInteger(freelancerBps) || freelancerBps < 0 || freelancerBps > BPS_DENOMINATOR) {
      throw new EscrowError("InvalidBps");
    }
    const amount = m.amount;
    m.status = "Resolved";
    m.resolvedFreelancerBps = freelancerBps;
    const freelancerPart = Math.floor((amount * freelancerBps) / BPS_DENOMINATOR);
    const clientPart = amount - freelancerPart;
    const fee = Math.floor((freelancerPart * a.feeBps) / BPS_DENOMINATOR);
    this.transfer("CONTRACT", a.freelancer, freelancerPart - fee);
    this.transfer("CONTRACT", a.feeRecipient ?? this.state.config.feeRecipient, fee);
    this.transfer("CONTRACT", a.client, clientPart);
    this.log(id, "resolved", index); this.persist();
  }

  async refundMilestone(id: number, index: number): Promise<void> {
    const a = this.agreement(id);
    const m = this.requireStatus(a, index, ["Funded", "Submitted"]);
    const amount = m.amount;
    m.status = "Refunded";
    this.transfer("CONTRACT", a.client, amount);
    this.log(id, "refunded", index); this.persist();
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

let instance: EscrowApi | null = null;

export function getEscrow(): EscrowApi {
  if (!instance) {
    instance = getMode() === "testnet" ? new RealEscrow() : new MockEscrow();
  }
  return instance;
}

/**
 * Escrow client for a given mode, ignoring the visitor's own mode. Public pages (verify, profile)
 * read testnet unless the shared link says it is a demo link (?demo=1).
 */
export function escrowFor(mode: "demo" | "testnet"): EscrowApi {
  return mode === getMode() ? getEscrow() : mode === "testnet" ? new RealEscrow() : new MockEscrow();
}

/** Re-read the demo state after an external change (used by the wallet switcher). */
export function resetEscrow(): void {
  instance = null;
}

/** Add simulated USDC to demo-client so large milestones can be tested in demo mode. */
export function topUpDemoClient(amount: number = DEMO_TOP_UP_AMOUNT): void {
  const escrow = getEscrow();
  if (escrow instanceof MockEscrow) {
    escrow.topUp("demo-client", amount);
  } else {
    const state = loadState();
    state.balances["demo-client"] = (state.balances["demo-client"] ?? 0) + Math.floor(amount);
    saveState(state);
  }
  notifyEscrowChanged();
}

/** Amount an agreement currently has locked in the contract. */
export function lockedAmountOf(agreement: Agreement): number {
  let total = 0;
  for (const m of agreement.milestones) {
    if (["Funded", "Submitted", "Disputed"].includes(m.status)) total += m.amount;
  }
  return total;
}

/** Event fired after any state change so balances and lists can refresh. */
export const ESCROW_CHANGED = "bfe:escrow-changed";

export function notifyEscrowChanged(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(ESCROW_CHANGED));
}
