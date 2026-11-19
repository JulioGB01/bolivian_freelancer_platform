// Figures computed from agreements read from the contract: protocol totals and a freelancer's
// public track record. Nothing here is stored anywhere else, so nobody can edit it.
import { lockedAmountOf } from "./escrow";
import { BPS_DENOMINATOR } from "./format";
import type { Agreement } from "./types";

const feeOf = (amount: number, feeBps: number) => Math.floor((amount * feeBps) / BPS_DENOMINATOR);

export interface ProtocolStats {
  agreements: number;
  locked: number;
  /** Net amount paid to freelancers (after fees), approved or claimed milestones. */
  paid: number;
  milestonesPaid: number;
}

export const TRUSTED_MIN_MILESTONES = 5;
/** $100 USDC in 7-decimal smallest units (prevents 1-stroop Sybil gaming). */
export const TRUSTED_MIN_VOLUME = 1_000_000_000;

export function protocolStats(list: Agreement[]): ProtocolStats {
  let locked = 0;
  let paid = 0;
  let milestonesPaid = 0;
  for (const a of list) {
    locked += lockedAmountOf(a);
    for (const m of a.milestones) {
      if (m.status === "Released") {
        paid += m.amount - feeOf(m.amount, a.feeBps);
        milestonesPaid += 1;
      } else if (m.status === "Resolved") {
        const bps = m.resolvedFreelancerBps ?? 5000;
        const freelancerPart = Math.floor((m.amount * bps) / BPS_DENOMINATOR);
        paid += freelancerPart - feeOf(freelancerPart, a.feeBps);
        if (bps > 0) milestonesPaid += 1;
      }
    }
  }
  return { agreements: list.length, locked, paid, milestonesPaid };
}

export type Level = "new" | "active" | "trusted";

export interface FreelancerStats {
  agreements: Agreement[];
  milestonesPaid: number;
  earned: number;
  locked: number;
  disputes: number;
  refunds: number;
  clients: number;
  since: number;
  level: Level;
}

/**
 * Level rule (shown to users):
 * - New: 0 paid milestones
 * - Active: >= 1 paid milestone (or < $100 USDC net volume)
 * - Trusted: >= 5 paid milestones AND >= $100 USDC net volume (prevents 1-stroop Sybil gaming)
 */
export function levelFor(milestonesPaid: number, earnedUnits: number = 0): Level {
  if (milestonesPaid >= TRUSTED_MIN_MILESTONES && earnedUnits >= TRUSTED_MIN_VOLUME) {
    return "trusted";
  }
  return milestonesPaid >= 1 ? "active" : "new";
}

export function freelancerStats(all: Agreement[], address: string): FreelancerStats {
  const mine = all.filter((a) => a.freelancer === address);
  let milestonesPaid = 0;
  let earned = 0;
  let locked = 0;
  let disputes = 0;
  let refunds = 0;
  for (const a of mine) {
    locked += lockedAmountOf(a);
    for (const m of a.milestones) {
      if (m.status === "Released") {
        milestonesPaid += 1;
        earned += m.amount - feeOf(m.amount, a.feeBps);
      } else if (m.status === "Resolved") {
        const bps = m.resolvedFreelancerBps ?? 5000;
        const freelancerPart = Math.floor((m.amount * bps) / BPS_DENOMINATOR);
        earned += freelancerPart - feeOf(freelancerPart, a.feeBps);
        if (bps > 0) milestonesPaid += 1;
      }
      if (m.status === "Disputed" || m.status === "Resolved") disputes += 1;
      if (m.status === "Refunded") refunds += 1;
    }
  }
  return {
    agreements: mine,
    milestonesPaid,
    earned,
    locked,
    disputes,
    refunds,
    clients: new Set(mine.map((a) => a.client)).size,
    since: mine.length ? Math.min(...mine.map((a) => a.createdAt)) : 0,
    level: levelFor(milestonesPaid, earned),
  };
}
