// Plain-language status and "what happens next" text for each milestone, per role.
import type { Agreement, Milestone } from "./types";
import type { Role } from "./wallet";

export interface NextStep {
  /** Short plain label shown in the badge. */
  label: string;
  /** One sentence telling the viewer what happens next. */
  text: string;
  /** True when the viewer is the one who has to act. */
  needsAction: boolean;
  /** Visual tone of the milestone. */
  tone: "waiting" | "safe" | "review" | "danger" | "done" | "neutral";
}

export function reviewDeadline(agreement: Agreement, m: Milestone): number {
  return m.submittedAt + agreement.reviewWindowSecs;
}

export function nextStep(agreement: Agreement, m: Milestone, role: Role, nowSecs: number): NextStep {
  const windowOpen = nowSecs < reviewDeadline(agreement, m);
  switch (m.status) {
    case "Pending":
      return role === "client"
        ? { label: "Not funded", text: "Lock the funds so the freelancer can start this milestone.", needsAction: true, tone: "waiting" }
        : role === "freelancer"
          ? { label: "Not funded", text: "Waiting for the client to lock the funds. Don't start this milestone yet.", needsAction: false, tone: "waiting" }
          : { label: "Not funded", text: "Waiting for the client to lock the funds.", needsAction: false, tone: "waiting" };
    case "Funded":
      return role === "freelancer"
        ? { label: "Funds locked", text: "The money is locked in escrow. It is safe to start. Submit your work when it is ready.", needsAction: true, tone: "safe" }
        : { label: "Funds locked", text: "The money is locked in escrow. Waiting for the freelancer to deliver.", needsAction: false, tone: "safe" };
    case "Submitted":
      if (windowOpen) {
        return role === "client"
          ? { label: "In review", text: "Review the work, then approve it or open a dispute before the review window ends.", needsAction: true, tone: "review" }
          : { label: "In review", text: "Work delivered. Waiting for the client's review.", needsAction: false, tone: "review" };
      }
      return role === "freelancer"
        ? { label: "Ready to claim", text: "The review window ended without a dispute. You can claim the payment now.", needsAction: true, tone: "review" }
        : role === "client"
          ? { label: "Review ended", text: "The review window ended. You can still approve; the freelancer can now claim the payment.", needsAction: false, tone: "review" }
          : { label: "Review ended", text: "The review window ended. The freelancer can claim the payment.", needsAction: false, tone: "review" };
    case "Disputed":
      return role === "arbiter"
        ? { label: "Disputed", text: "Decide how to split the locked amount between both sides.", needsAction: true, tone: "danger" }
        : { label: "Disputed", text: "The money stays locked while the arbiter reviews the dispute.", needsAction: false, tone: "danger" };
    case "Released":
      return { label: "Paid", text: "Paid to the freelancer (minus the platform fee).", needsAction: false, tone: "done" };
    case "Resolved":
      return { label: "Settled", text: "The arbiter split the amount between both sides.", needsAction: false, tone: "done" };
    case "Refunded":
      return { label: "Refunded", text: "The full amount went back to the client.", needsAction: false, tone: "neutral" };
  }
}

export const TONE_BADGE: Record<NextStep["tone"], string> = {
  waiting: "bg-slate-100 text-slate-700 ring-slate-300",
  safe: "bg-emerald-100 text-emerald-800 ring-emerald-300",
  review: "bg-amber-100 text-amber-800 ring-amber-300",
  danger: "bg-red-100 text-red-800 ring-red-300",
  done: "bg-indigo-100 text-indigo-800 ring-indigo-300",
  neutral: "bg-slate-100 text-slate-600 ring-slate-300",
};

export const TONE_BORDER: Record<NextStep["tone"], string> = {
  waiting: "border-l-slate-300",
  safe: "border-l-emerald-500",
  review: "border-l-amber-500",
  danger: "border-l-red-500",
  done: "border-l-indigo-500",
  neutral: "border-l-slate-300",
};

/** Role of an address inside one agreement. */
export function roleIn(agreement: Agreement, address: string | undefined, arbiter?: string): Role {
  if (!address) return "viewer";
  if (address === agreement.freelancer) return "freelancer";
  if (address === agreement.client) return "client";
  if (arbiter && address === arbiter) return "arbiter";
  return "viewer";
}

/** Number of milestones in an agreement where this role has to act. */
export function actionsNeeded(agreement: Agreement, role: Role, nowSecs: number): number {
  return agreement.milestones.filter((m) => nextStep(agreement, m, role, nowSecs).needsAction).length;
}
