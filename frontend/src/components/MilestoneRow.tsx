"use client";

import { useState } from "react";
import { BPS_DENOMINATOR, formatAmount, formatCountdown, formatDate } from "@/lib/format";
import { getEscrow, notifyEscrowChanged } from "@/lib/escrow";
import { errorMessage } from "@/lib/errors";
import { nextStep, reviewDeadline, TONE_BADGE, TONE_BORDER } from "@/lib/status";
import { useNow } from "@/lib/useNow";
import type { Agreement, Milestone } from "@/lib/types";
import type { Role } from "@/lib/wallet";
import TxStatus, { type TxPhase } from "./TxStatus";

export default function MilestoneRow({
  agreement,
  milestone,
  index,
  role,
  onChanged,
}: {
  agreement: Agreement;
  milestone: Milestone;
  index: number;
  role: Role;
  onChanged: () => void;
}) {
  const [phase, setPhase] = useState<TxPhase>("idle");
  const [err, setErr] = useState<string>();
  const [evidence, setEvidence] = useState("");
  const [reason, setReason] = useState("");
  const [splitPct, setSplitPct] = useState(50);

  // Ticks every second, so the countdown and the Claim / Dispute buttons update live.
  const now = useNow();
  const deadline = reviewDeadline(agreement, milestone);
  const fee = Math.floor((milestone.amount * agreement.feeBps) / BPS_DENOMINATOR);
  const net = milestone.amount - fee;
  const step = nextStep(agreement, milestone, role, now);

  async function run(fn: () => Promise<void>, confirmText?: string) {
    if (confirmText && !window.confirm(confirmText)) return;
    setPhase("pending");
    setErr(undefined);
    try {
      await fn();
      setPhase("success");
      onChanged();
      notifyEscrowChanged();
    } catch (e) {
      setPhase("error");
      setErr(errorMessage(e));
    }
  }

  const can = {
    fund: role === "client" && milestone.status === "Pending",
    submit: role === "freelancer" && milestone.status === "Funded",
    approve: role === "client" && milestone.status === "Submitted",
    claim: role === "freelancer" && milestone.status === "Submitted" && now >= deadline,
    dispute: role === "client" && milestone.status === "Submitted" && now < deadline,
    resolve: role === "arbiter" && milestone.status === "Disputed",
    refund:
      role === "freelancer" && (milestone.status === "Funded" || milestone.status === "Submitted"),
  };

  const freelancerPart = Math.floor((milestone.amount * splitPct) / 100);
  const evidenceIsLink = /^https?:\/\//i.test(evidence.trim());

  return (
    <div
      className={`rounded-lg border border-l-4 border-slate-200 bg-white p-4 shadow-sm ${TONE_BORDER[step.tone]}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Milestone {index + 1}
          </p>
          <p className="font-semibold text-slate-900">{milestone.title}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold text-slate-900">
            {formatAmount(milestone.amount)} <span className="text-sm font-normal text-slate-500">USDC</span>
          </p>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${TONE_BADGE[step.tone]}`}
          >
            {step.tone === "safe" && <span aria-hidden>🔒</span>}
            {step.label}
          </span>
        </div>
      </div>

      <p className={`mt-2 text-sm ${step.needsAction ? "font-medium text-slate-900" : "text-slate-600"}`}>
        {step.needsAction && (
          <span className="mr-1.5 rounded bg-brand-600 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            Your turn
          </span>
        )}
        {step.text}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        Platform fee {formatAmount(fee)} USDC · freelancer receives {formatAmount(net)} USDC
      </p>

      {milestone.status === "Submitted" && (
        <p className="mt-1 text-xs text-amber-700">
          {now < deadline ? (
            <>
              Review window closes in <strong>{formatCountdown(deadline, now)}</strong> ({formatDate(deadline)})
            </>
          ) : (
            <>Review window closed on {formatDate(deadline)}</>
          )}
        </p>
      )}

      {milestone.evidence && (
        <div className="mt-2 text-xs">
          <span className="text-slate-500">Delivered work: </span>
          <a
            href={milestone.evidence}
            target="_blank"
            rel="noreferrer noopener"
            className="break-all text-brand-600 underline"
          >
            {milestone.evidence}
          </a>
        </div>
      )}
      {milestone.disputeReason && (
        <div className="mt-2 rounded-md bg-red-50 px-2 py-1 text-xs text-red-700">
          Dispute reason: {milestone.disputeReason}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {can.fund && (
          <ActionButton
            onClick={() =>
              run(
                () => getEscrow().fundMilestone(agreement.id, index),
                `Lock ${formatAmount(milestone.amount)} USDC in escrow for "${milestone.title}"?`,
              )
            }
          >
            Lock {formatAmount(milestone.amount)} USDC
          </ActionButton>
        )}

        {can.submit && (
          <>
            <input
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              placeholder="https://… link to your work (Drive, GitHub…)"
              aria-label="Link to your work"
              className="min-w-0 flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm sm:max-w-sm"
            />
            <ActionButton
              onClick={() => run(() => getEscrow().submitMilestone(agreement.id, index, evidence.trim()))}
              disabled={!evidenceIsLink}
            >
              Submit work
            </ActionButton>
          </>
        )}

        {can.approve && (
          <ActionButton
            onClick={() =>
              run(
                () => getEscrow().approveMilestone(agreement.id, index),
                `Approve and release ${formatAmount(milestone.amount)} USDC? The freelancer receives ${formatAmount(net)} USDC. This cannot be undone.`,
              )
            }
          >
            Approve &amp; release
          </ActionButton>
        )}

        {can.claim && (
          <ActionButton
            onClick={() => run(() => getEscrow().claimMilestone(agreement.id, index))}
          >
            Claim {formatAmount(net)} USDC
          </ActionButton>
        )}

        {can.dispute && (
          <>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="What is wrong with the work?"
              aria-label="Reason for dispute"
              className="min-w-0 flex-1 rounded-md border border-red-200 px-2 py-1.5 text-sm sm:max-w-xs"
            />
            <ActionButton
              danger
              onClick={() =>
                run(
                  () => getEscrow().disputeMilestone(agreement.id, index, reason.trim()),
                  "Open a dispute? The money stays locked until the arbiter decides how to split it.",
                )
              }
              disabled={!reason.trim()}
            >
              Open dispute
            </ActionButton>
          </>
        )}

        {can.resolve && (
          <div className="w-full space-y-2 rounded-md bg-slate-50 p-3">
            <label className="flex items-center gap-3 text-xs text-slate-600">
              <span>Freelancer share</span>
              <input
                type="range"
                min={0}
                max={100}
                value={splitPct}
                onChange={(e) => setSplitPct(Number(e.target.value))}
                className="flex-1"
              />
              <span className="w-10 text-right font-semibold text-slate-800">{splitPct}%</span>
            </label>
            <p className="text-xs text-slate-500">
              Freelancer {formatAmount(freelancerPart)} USDC (before fee) · Client{" "}
              {formatAmount(milestone.amount - freelancerPart)} USDC
            </p>
            <ActionButton
              onClick={() =>
                run(
                  () => getEscrow().resolveDispute(agreement.id, index, splitPct * 100),
                  `Resolve: ${splitPct}% to the freelancer and ${100 - splitPct}% to the client? This cannot be undone.`,
                )
              }
            >
              Resolve dispute
            </ActionButton>
          </div>
        )}

        {can.refund && (
          <ActionButton
            subtle
            onClick={() =>
              run(
                () => getEscrow().refundMilestone(agreement.id, index),
                `Refund the full ${formatAmount(milestone.amount)} USDC to the client? This cannot be undone.`,
              )
            }
          >
            Refund client
          </ActionButton>
        )}

        <TxStatus phase={phase} error={err} />
      </div>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  danger,
  subtle,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  subtle?: boolean;
  disabled?: boolean;
}) {
  const base = danger
    ? "bg-red-600 text-white hover:bg-red-500"
    : subtle
      ? "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
      : "bg-brand-600 text-white hover:bg-brand-700";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full px-4 py-1.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${base}`}
    >
      {children}
    </button>
  );
}
