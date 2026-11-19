"use client";

import { useState } from "react";
import { BPS_DENOMINATOR, formatAmount, formatCountdown, formatDate } from "@/lib/format";
import { getEscrow, notifyEscrowChanged } from "@/lib/escrow";
import { errorMessage } from "@/lib/errors";
import { useT } from "@/lib/i18n";
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
  const { t, lang } = useT();
  const [phase, setPhase] = useState<TxPhase>("idle");
  const [err, setErr] = useState<string>();
  const [txHash, setTxHash] = useState<string | null>(null);
  const [evidence, setEvidence] = useState("");
  const [reason, setReason] = useState("");
  const [splitPct, setSplitPct] = useState(50);

  // Ticks every second, so the countdown and the Claim / Dispute buttons update live.
  const now = useNow();
  const deadline = reviewDeadline(agreement, milestone);
  const fee = Math.floor((milestone.amount * agreement.feeBps) / BPS_DENOMINATOR);
  const net = milestone.amount - fee;
  const step = nextStep(agreement, milestone, role, now);
  const amount = formatAmount(milestone.amount);

  async function run(fn: () => Promise<void>, confirmText?: string) {
    if (confirmText && !window.confirm(confirmText)) return;
    setPhase("pending");
    setErr(undefined);
    setTxHash(null);
    try {
      await fn();
      setTxHash(getEscrow().lastTxHash ?? null);
      setPhase("success");
      onChanged();
      notifyEscrowChanged();
    } catch (e) {
      setPhase("error");
      setErr(errorMessage(e, t));
    }
  }

  const busy = phase === "pending";
  const can = {
    fund: role === "client" && milestone.status === "Pending",
    submit: role === "freelancer" && milestone.status === "Funded",
    approve: role === "client" && milestone.status === "Submitted",
    claim: role === "freelancer" && milestone.status === "Submitted" && now >= deadline,
    dispute: role === "client" && milestone.status === "Submitted" && now < deadline,
    resolve: role === "arbiter" && milestone.status === "Disputed",
    refund: role === "freelancer" && (milestone.status === "Funded" || milestone.status === "Submitted"),
  };

  const freelancerPart = Math.floor((milestone.amount * splitPct) / 100);
  const evidenceIsLink = /^https?:\/\/\S+$/i.test(evidence.trim());
  const dateLocale = lang === "es" ? "es-BO" : "en-US";

  return (
    <div className={`rounded-xl border border-l-4 border-slate-200 bg-white p-4 shadow-sm ${TONE_BORDER[step.tone]}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{t("ms.milestone", { n: index + 1 })}</p>
          <p className="font-semibold text-slate-900">{milestone.title}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold text-slate-900">
            {amount} <span className="text-sm font-normal text-slate-500">USDC</span>
          </p>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${TONE_BADGE[step.tone]}`}
          >
            {step.tone === "safe" && <span aria-hidden>🔒</span>}
            {t(step.label)}
          </span>
        </div>
      </div>

      <p className={`mt-2 text-sm ${step.needsAction ? "font-medium text-slate-900" : "text-slate-600"}`}>
        {step.needsAction && (
          <span className="mr-1.5 rounded-full bg-bo-yellow px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink">
            {t("ms.yourTurn")}
          </span>
        )}
        {t(step.text)}
      </p>

      <p className="mt-1 text-xs text-slate-500">{t("ms.fee", { fee: formatAmount(fee), net: formatAmount(net) })}</p>

      {milestone.status === "Submitted" && (
        <p className="mt-1 text-xs text-amber-700">
          {now < deadline ? (
            <>
              {t("ms.closesIn")} <strong>{formatCountdown(deadline, now)}</strong> ({formatDate(deadline, dateLocale)})
            </>
          ) : (
            t("ms.closedOn", { date: formatDate(deadline, dateLocale) })
          )}
        </p>
      )}

      {milestone.evidence && (
        <div className="mt-2 text-xs">
          <span className="text-slate-500">{t("ms.delivered")} </span>
          {/^https?:\/\//i.test(milestone.evidence) ? (
            <a href={milestone.evidence} target="_blank" rel="noreferrer noopener nofollow" className="break-all text-brand-700 underline">
              {milestone.evidence}
            </a>
          ) : (
            <span className="break-all text-slate-700">{milestone.evidence}</span>
          )}
        </div>
      )}
      {milestone.disputeReason && (
        <div className="mt-2 rounded-md bg-red-50 px-2 py-1 text-xs text-red-700">
          {t("ms.disputeReason")} {milestone.disputeReason}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {can.fund && (
          <ActionButton
            disabled={busy}
            onClick={() =>
              run(() => getEscrow().fundMilestone(agreement.id, index), t("ms.lockConfirm", { amount, title: milestone.title }))
            }
          >
            {t("ms.lock", { amount })}
          </ActionButton>
        )}

        {can.submit && (
          <>
            <input
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              placeholder={t("ms.workPh")}
              aria-label={t("ms.workPh")}
              className="min-w-0 flex-1 rounded-full border border-slate-300 px-3 py-1.5 text-sm sm:max-w-sm"
            />
            <ActionButton
              onClick={() => run(() => getEscrow().submitMilestone(agreement.id, index, evidence.trim()))}
              disabled={!evidenceIsLink || busy}
            >
              {t("ms.submit")}
            </ActionButton>
          </>
        )}

        {can.approve && (
          <ActionButton
            disabled={busy}
            onClick={() =>
              run(
                () => getEscrow().approveMilestone(agreement.id, index),
                t("ms.approveConfirm", { amount, net: formatAmount(net) }),
              )
            }
          >
            {t("ms.approve")}
          </ActionButton>
        )}

        {can.claim && (
          <ActionButton disabled={busy} onClick={() => run(() => getEscrow().claimMilestone(agreement.id, index))}>
            {t("ms.claim", { net: formatAmount(net) })}
          </ActionButton>
        )}

        {can.dispute && (
          <>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("ms.reasonPh")}
              aria-label={t("ms.reasonPh")}
              className="min-w-0 flex-1 rounded-full border border-red-200 px-3 py-1.5 text-sm sm:max-w-xs"
            />
            <ActionButton
              danger
              onClick={() =>
                run(() => getEscrow().disputeMilestone(agreement.id, index, reason.trim()), t("ms.disputeConfirm"))
              }
              disabled={!reason.trim() || busy}
            >
              {t("ms.dispute")}
            </ActionButton>
          </>
        )}

        {can.resolve && (
          <div className="w-full space-y-2 rounded-lg bg-slate-50 p-3">
            <label className="flex items-center gap-3 text-xs text-slate-600">
              <span>{t("ms.share")}</span>
              <input
                type="range"
                min={0}
                max={100}
                value={splitPct}
                onChange={(e) => setSplitPct(Number(e.target.value))}
                className="flex-1 accent-brand-600"
              />
              <span className="w-10 text-right font-semibold text-slate-800">{splitPct}%</span>
            </label>
            <p className="text-xs text-slate-500">
              {t("ms.splitLine", { f: formatAmount(freelancerPart), c: formatAmount(milestone.amount - freelancerPart) })}
            </p>
            <ActionButton
              disabled={busy}
              onClick={() =>
                run(
                  () => getEscrow().resolveDispute(agreement.id, index, splitPct * 100),
                  t("ms.resolveConfirm", { f: splitPct, c: 100 - splitPct }),
                )
              }
            >
              {t("ms.resolve")}
            </ActionButton>
          </div>
        )}

        {can.refund && (
          <ActionButton
            subtle
            disabled={busy}
            onClick={() => run(() => getEscrow().refundMilestone(agreement.id, index), t("ms.refundConfirm", { amount }))}
          >
            {t("ms.refund")}
          </ActionButton>
        )}

        <TxStatus phase={phase} error={err} txHash={txHash} />
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
      : "bg-ink text-white hover:bg-black";
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
