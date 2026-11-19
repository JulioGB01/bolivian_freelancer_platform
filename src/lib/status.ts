// Plain-language status and "what happens next" for each milestone, per role.
// Returns translation keys (lib/i18n.ts) so the text follows the UI language.
import type { MsgKey } from "./i18n";
import type { Agreement, Milestone } from "./types";
import type { Role } from "./wallet";

export interface NextStep {
  label: MsgKey;
  text: MsgKey;
  /** True when the viewer is the one who has to act. */
  needsAction: boolean;
  tone: "waiting" | "safe" | "review" | "danger" | "done" | "neutral";
}

export function reviewDeadline(agreement: Agreement, m: Milestone): number {
  return m.submittedAt + agreement.reviewWindowSecs;
}

export function nextStep(agreement: Agreement, m: Milestone, role: Role, nowSecs: number): NextStep {
  const windowOpen = nowSecs < reviewDeadline(agreement, m);
  switch (m.status) {
    case "Pending":
      return {
        label: "st.notFunded",
        text: role === "client" ? "st.pendingClient" : role === "freelancer" ? "st.pendingFreelancer" : "st.pendingOther",
        needsAction: role === "client",
        tone: "waiting",
      };
    case "Funded":
      return {
        label: "st.locked",
        text: role === "freelancer" ? "st.fundedFreelancer" : "st.fundedOther",
        needsAction: role === "freelancer",
        tone: "safe",
      };
    case "Submitted":
      if (windowOpen) {
        return {
          label: "st.inReview",
          text: role === "client" ? "st.reviewClient" : "st.reviewOther",
          needsAction: role === "client",
          tone: "review",
        };
      }
      return role === "freelancer"
        ? { label: "st.readyToClaim", text: "st.claimFreelancer", needsAction: true, tone: "review" }
        : { label: "st.reviewEnded", text: role === "client" ? "st.endedClient" : "st.endedOther", needsAction: false, tone: "review" };
    case "Disputed":
      return {
        label: "st.disputed",
        text: role === "arbiter" ? "st.disputedArbiter" : "st.disputedOther",
        needsAction: role === "arbiter",
        tone: "danger",
      };
    case "Released":
      return { label: "st.paid", text: "st.paidText", needsAction: false, tone: "done" };
    case "Resolved":
      return { label: "st.settled", text: "st.settledText", needsAction: false, tone: "done" };
    case "Refunded":
      return { label: "st.refunded", text: "st.refundedText", needsAction: false, tone: "neutral" };
  }
}

export const TONE_BADGE: Record<NextStep["tone"], string> = {
  waiting: "bg-slate-100 text-slate-700 ring-slate-300",
  safe: "bg-lime text-ink ring-lime",
  review: "bg-amber-100 text-amber-800 ring-amber-300",
  danger: "bg-red-100 text-red-800 ring-red-300",
  done: "bg-ink text-white ring-ink",
  neutral: "bg-slate-100 text-slate-600 ring-slate-300",
};

export const TONE_BORDER: Record<NextStep["tone"], string> = {
  waiting: "border-l-slate-300",
  safe: "border-l-lime",
  review: "border-l-amber-500",
  danger: "border-l-red-500",
  done: "border-l-slate-400",
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
