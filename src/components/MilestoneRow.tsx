"use client";

import { useState } from "react";
import { BPS_DENOMINATOR, formatAmount, formatCountdown, formatDate, shortAddress } from "@/lib/format";
import { getEscrow, notifyEscrowChanged } from "@/lib/escrow";
import { useT } from "@/lib/i18n";
import { nextStep, reviewDeadline, TONE_BADGE, TONE_BORDER } from "@/lib/status";
import { useNow } from "@/lib/useNow";
import type { Agreement, Milestone } from "@/lib/types";
import type { Role } from "@/lib/wallet";
import ReviewDialog, { type ReviewRequest } from "./ReviewDialog";

export default function MilestoneRow({
  agreement,
  milestone,
  index,
  role,
  onChanged,
  readOnly,
}: {
  agreement: Agreement;
  milestone: Milestone;
  index: number;
  role: Role;
  onChanged: () => void;
  /** Public verify page: show state only, no actions. */
  readOnly?: boolean;
}) {
  const { t, lang } = useT();
  const [review, setReview] = useState<ReviewRequest | null>(null);
  const [evidence, setEvidence] = useState("");
  const [reason, setReason] = useState("");
  const [splitPct, setSplitPct] = useState(50);

  // Ticks every second, so the countdown and the Claim / Dispute buttons update live.
  const now = useNow();
  const deadline = reviewDeadline(agreement, milestone);
  const pct = (agreement.feeBps / 100).toFixed(2);
  const fee = Math.floor((milestone.amount * agreement.feeBps) / BPS_DENOMINATOR);
  const net = milestone.amount - fee;
  const step = nextStep(agreement, milestone, readOnly ? "viewer" : role, now);
  const amount = formatAmount(milestone.amount);
  const usd = (n: number) => `${formatAmount(n)} USDC`;
  const F = shortAddress(agreement.freelancer);
  const C = shortAddress(agreement.client);

  const done = () => {
    onChanged();
    notifyEscrowChanged();
  };
  const ask = (r: Omit<ReviewRequest, "onDone">) => setReview({ ...r, onDone: done });

  const can = readOnly
    ? {}
    : {
        fund: role === "client" && milestone.status === "Pending",
        submit: role === "freelancer" && milestone.status === "Funded",
        approve: role === "client" && milestone.status === "Submitted",
        claim: role === "freelancer" && milestone.status === "Submitted" && now >= deadline,
        dispute: role === "client" && milestone.status === "Submitted" && now < deadline,
        resolve: role === "arbiter" && milestone.status === "Disputed",
        refund: role === "freelancer" && (milestone.status === "Funded" || milestone.status === "Submitted"),
      };

  const freelancerPart = Math.floor((milestone.amount * splitPct) / 100);
  const splitFee = Math.floor((freelancerPart * agreement.feeBps) / BPS_DENOMINATOR);
  const evidenceIsLink = /^https?:\/\/\S+$/i.test(evidence.trim());
  const dateLocale = lang === "es" ? "es-BO" : "en-US";
  const payoutRows = [
    { label: t("rv.amount"), value: usd(milestone.amount) },
    { label: t("rv.fee", { pct }), value: `− ${usd(fee)}` },
    { label: `${t("rv.freelancerGets")} (${F})`, value: usd(net), strong: true },
  ];

  return (
    <div className={`rounded-3xl border border-l-4 border-line bg-white p-5 shadow-sm ${TONE_BORDER[step.tone]}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink/40">{t("ms.milestone", { n: index + 1 })}</p>
          <p className="font-semibold">{milestone.title}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold">
            {amount} <span className="text-sm font-normal text-ink/50">USDC</span>
          </p>
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${TONE_BADGE[step.tone]}`}>
            {step.tone === "safe" && <span aria-hidden>🔒</span>}
            {t(step.label)}
          </span>
        </div>
      </div>

      <p className={`mt-2 text-sm ${step.needsAction ? "font-medium" : "text-ink/60"}`}>
        {step.needsAction && (
          <span className="mr-1.5 rounded-full bg-bo-yellow px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink">
            {t("ms.yourTurn")}
          </span>
        )}
        {t(step.text)}
      </p>

      <p className="mt-1 text-xs text-ink/50">{t("ms.fee", { fee: formatAmount(fee), net: formatAmount(net) })}</p>

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
          <span className="text-ink/50">{t("ms.delivered")} </span>
          {/^https?:\/\//i.test(milestone.evidence) ? (
            <a href={milestone.evidence} target="_blank" rel="noreferrer noopener nofollow" className="break-all text-brand-700 underline">
              {milestone.evidence}
            </a>
          ) : (
            <span className="break-all">{milestone.evidence}</span>
          )}
        </div>
      )}
      {milestone.disputeReason && (
        <div className="mt-2 rounded-xl bg-red-50 px-3 py-1.5 text-xs text-red-700">
          {t("ms.disputeReason")} {milestone.disputeReason}
        </div>
      )}

      {!readOnly && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {can.fund && (
            <ActionButton
              onClick={() =>
                ask({
                  title: "rv.fund",
                  rows: [
                    { label: t("rv.amount"), value: usd(milestone.amount), strong: true },
                    { label: t("rv.from"), value: `${t("rv.yourWallet")} (${C})` },
                    { label: t("rv.to"), value: t("rv.contract") },
                  ],
                  what: "rv.whatFund",
                  action: () => getEscrow().fundMilestone(agreement.id, index),
                })
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
                className="min-w-0 flex-1 rounded-full border border-line px-4 py-2 text-sm sm:max-w-sm"
              />
              <ActionButton
                disabled={!evidenceIsLink}
                onClick={() =>
                  ask({
                    title: "rv.submit",
                    rows: [
                      { label: t("ms.milestone", { n: index + 1 }), value: milestone.title },
                      { label: t("ms.delivered"), value: evidence.trim() },
                    ],
                    what: "rv.whatSubmit",
                    action: () => getEscrow().submitMilestone(agreement.id, index, evidence.trim()),
                  })
                }
              >
                {t("ms.submit")}
              </ActionButton>
            </>
          )}

          {can.approve && (
            <ActionButton
              onClick={() =>
                ask({ title: "rv.approve", rows: payoutRows, what: "rv.whatApprove", action: () => getEscrow().approveMilestone(agreement.id, index) })
              }
            >
              {t("ms.approve")}
            </ActionButton>
          )}

          {can.claim && (
            <ActionButton
              onClick={() =>
                ask({ title: "rv.claim", rows: payoutRows, what: "rv.whatClaim", action: () => getEscrow().claimMilestone(agreement.id, index) })
              }
            >
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
                className="min-w-0 flex-1 rounded-full border border-red-200 px-4 py-2 text-sm sm:max-w-xs"
              />
              <ActionButton
                danger
                disabled={!reason.trim()}
                onClick={() =>
                  ask({
                    title: "rv.dispute",
                    rows: [
                      { label: t("rv.amount"), value: usd(milestone.amount) },
                      { label: t("ms.disputeReason"), value: reason.trim() },
                    ],
                    what: "rv.whatDispute",
                    action: () => getEscrow().disputeMilestone(agreement.id, index, reason.trim()),
                  })
                }
              >
                {t("ms.dispute")}
              </ActionButton>
            </>
          )}

          {can.resolve && (
            <div className="w-full space-y-2 rounded-2xl bg-paper p-4">
              <label className="flex items-center gap-3 text-xs text-ink/60">
                <span>{t("ms.share")}</span>
                <input type="range" min={0} max={100} value={splitPct} onChange={(e) => setSplitPct(Number(e.target.value))} className="flex-1 accent-ink" />
                <span className="w-10 text-right font-semibold text-ink">{splitPct}%</span>
              </label>
              <p className="text-xs text-ink/50">{t("ms.splitLine", { f: formatAmount(freelancerPart), c: formatAmount(milestone.amount - freelancerPart) })}</p>
              <ActionButton
                onClick={() =>
                  ask({
                    title: "rv.resolve",
                    rows: [
                      { label: t("rv.amount"), value: usd(milestone.amount) },
                      { label: `${t("rv.freelancerGets")} (${F})`, value: usd(freelancerPart - splitFee), strong: true },
                      { label: t("rv.fee", { pct }), value: usd(splitFee) },
                      { label: `${t("rv.clientGets")} (${C})`, value: usd(milestone.amount - freelancerPart), strong: true },
                    ],
                    what: "rv.whatResolve",
                    action: () => getEscrow().resolveDispute(agreement.id, index, splitPct * 100),
                  })
                }
              >
                {t("ms.resolve")}
              </ActionButton>
            </div>
          )}

          {can.refund && (
            <ActionButton
              subtle
              onClick={() =>
                ask({
                  title: "rv.refund",
                  rows: [
                    { label: t("rv.amount"), value: usd(milestone.amount) },
                    { label: `${t("rv.clientGets")} (${C})`, value: usd(milestone.amount), strong: true },
                  ],
                  what: "rv.whatRefund",
                  action: () => getEscrow().refundMilestone(agreement.id, index),
                })
              }
            >
              {t("ms.refund")}
            </ActionButton>
          )}
        </div>
      )}

      <ReviewDialog request={review} onClose={() => setReview(null)} />
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
      ? "border border-line bg-white text-ink/70 hover:border-ink"
      : "bg-ink text-white hover:bg-black";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full px-5 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${base}`}
    >
      {children}
    </button>
  );
}
