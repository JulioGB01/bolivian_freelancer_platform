"use client";

import { useEffect, useState } from "react";
import { computeSha256Hex, formatOnChainEvidence, parseOnChainEvidence, type EvidenceRecord } from "@/lib/evidence";
import { BPS_DENOMINATOR, formatAmount, formatCountdown, formatDate, shortAddress } from "@/lib/format";
import { getEscrow, notifyEscrowChanged } from "@/lib/escrow";
import { useT } from "@/lib/i18n";
import { nextStep, reviewDeadline, TONE_BADGE, TONE_BORDER } from "@/lib/status";
import { useNow } from "@/lib/useNow";
import { useWallet } from "@/lib/useWallet";
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
  const { wallet } = useWallet();
  const [review, setReview] = useState<ReviewRequest | null>(null);
  const [evidence, setEvidence] = useState("");
  const [attachedFile, setAttachedFile] = useState<{ name: string; size: number; type: string; sha256: string } | null>(null);
  const [reason, setReason] = useState("");
  const [splitPct, setSplitPct] = useState(50);
  const [threadOpen, setThreadOpen] = useState(false);
  const [threadRecords, setThreadRecords] = useState<EvidenceRecord[]>([]);
  const [threadNote, setThreadNote] = useState("");
  const [threadBusy, setThreadBusy] = useState(false);

  useEffect(() => {
    if (!threadOpen) return;
    fetch(`/api/evidence?agreementId=${agreement.id}&milestoneIndex=${index}`)
      .then((r) => r.json())
      .then((d: { records?: EvidenceRecord[] }) => setThreadRecords(d.records ?? []))
      .catch(() => {});
  }, [threadOpen, agreement.id, index]);

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
        dispute:
          role === "client" &&
          (milestone.status === "Funded" || (milestone.status === "Submitted" && now < deadline)),
        resolve: role === "arbiter" && milestone.status === "Disputed",
        refund: role === "freelancer" && (milestone.status === "Funded" || milestone.status === "Submitted"),
      };

  const freelancerPart = Math.floor((milestone.amount * splitPct) / 100);
  const splitFee = Math.floor((freelancerPart * agreement.feeBps) / BPS_DENOMINATOR);
  const evidenceIsLink = /^https?:\/\/\S+$/i.test(evidence.trim());
  const canSubmitWork = evidenceIsLink || attachedFile !== null;
  const parsedOnChain = milestone.evidence ? parseOnChainEvidence(milestone.evidence) : null;
  const dateLocale = lang === "es" ? "es-BO" : "en-US";
  const payoutRows = [
    { label: t("rv.amount"), value: usd(milestone.amount) },
    { label: t("rv.fee", { pct }), value: `− ${usd(fee)}` },
    { label: `${t("rv.freelancerGets")} (${F})`, value: usd(net), strong: true },
  ];

  return (
    <div className={` border border-l-4 border-line bg-white p-5 shadow-sm ${TONE_BORDER[step.tone]}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink/40">{t("ms.milestone", { n: index + 1 })}</p>
          <p className="font-semibold">{milestone.title}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold">
            {amount} <span className="text-sm font-normal text-ink/50">USDC</span>
          </p>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${TONE_BADGE[step.tone]}`}>
            {step.tone === "safe" && <span aria-hidden>🔒</span>}
            {t(step.label)}
          </span>
        </div>
      </div>

      <p className={`mt-2 text-sm ${step.needsAction ? "font-medium" : "text-ink/60"}`}>
        {step.needsAction && (
          <span className="mr-1.5 bg-bo-yellow px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink">
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
              {t("ms.closesIn")} <strong>{formatCountdown(deadline, now, lang)}</strong> ({formatDate(deadline, dateLocale)})
            </>
          ) : (
            t("ms.closedOn", { date: formatDate(deadline, dateLocale) })
          )}
        </p>
      )}

      {parsedOnChain && (
        <div className="mt-2 space-y-1 text-xs">
          <div>
            <span className="text-ink/50">{t("ms.delivered")} </span>
            {parsedOnChain.url ? (
              <a href={parsedOnChain.url} target="_blank" rel="noreferrer noopener nofollow" className="break-all text-brand-700 underline">
                {parsedOnChain.url}
              </a>
            ) : (
              <span className="break-all">{parsedOnChain.raw}</span>
            )}
          </div>
          {parsedOnChain.sha256 && (
            <p className="inline-block bg-paper px-2 py-0.5 font-mono text-[11px] text-ink/70">
              SHA-256: {parsedOnChain.sha256.slice(0, 16)}…{parsedOnChain.sha256.slice(-8)}
            </p>
          )}
        </div>
      )}
      {milestone.disputeReason && (
        <div className="mt-2 bg-red-50 px-3 py-1.5 text-xs text-red-700">
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
            <div className="flex w-full flex-col gap-1.5 sm:flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  value={evidence}
                  onChange={(e) => setEvidence(e.target.value)}
                  placeholder={t("ms.workPh")}
                  aria-label={t("ms.workPh")}
                  aria-invalid={evidence.trim().length > 0 && !evidenceIsLink}
                  className={`min-w-0 flex-1 border px-4 py-2 text-sm sm:max-w-sm ${
                    evidence.trim().length > 0 && !evidenceIsLink ? "border-red-400" : "border-line"
                  }`}
                />
                <label className="cursor-pointer border border-line bg-paper px-3 py-2 text-xs font-medium text-ink hover:border-ink">
                  {attachedFile ? `SHA-256: ${attachedFile.sha256.slice(0, 8)}…` : "Adjuntar archivo (SHA-256)"}
                  <input
                    type="file"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const buf = await f.arrayBuffer();
                      const sha256 = await computeSha256Hex(buf);
                      setAttachedFile({ name: f.name, size: f.size, type: f.type, sha256 });
                    }}
                  />
                </label>
                <ActionButton
                  disabled={!canSubmitWork}
                  onClick={async () => {
                    const cleanUrl = evidence.trim();
                    let payload = cleanUrl;
                    if (attachedFile) {
                      payload = formatOnChainEvidence({
                        sha256: attachedFile.sha256,
                        url: cleanUrl || undefined,
                        note: attachedFile.name,
                      });
                    } else if (cleanUrl) {
                      const sha256 = await computeSha256Hex(cleanUrl);
                      payload = formatOnChainEvidence({ sha256, url: cleanUrl });
                    }
                    ask({
                      title: "rv.submit",
                      rows: [
                        { label: t("ms.milestone", { n: index + 1 }), value: milestone.title },
                        { label: t("ms.delivered"), value: payload },
                      ],
                      what: "rv.whatSubmit",
                      action: async () => {
                        await getEscrow().submitMilestone(agreement.id, index, payload);
                        if (attachedFile) {
                          await fetch("/api/evidence", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              agreementId: agreement.id,
                              milestoneIndex: index,
                              author: wallet?.address ?? agreement.freelancer,
                              kind: "deliverable",
                              fileName: attachedFile.name,
                              fileSizeBytes: attachedFile.size,
                              mimeType: attachedFile.type,
                              url: cleanUrl || undefined,
                              note: `Entrega inicial: ${attachedFile.name}`,
                              sha256: attachedFile.sha256,
                            }),
                          }).catch(() => {});
                        }
                      },
                    });
                  }}
                >
                  {t("ms.submit")}
                </ActionButton>
              </div>
              {evidence.trim().length > 0 && !evidenceIsLink && (
                <p className="text-xs text-red-600" role="alert">
                  {t("ms.errEvidenceUrl")}
                </p>
              )}
            </div>
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
            <div className="flex w-full flex-col gap-1.5 sm:w-auto sm:flex-1">
              {milestone.status === "Funded" && (
                <p className="text-xs text-amber-700">{t("ms.disputeFundedHint")}</p>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={t("ms.reasonPh")}
                  aria-label={t("ms.reasonPh")}
                  className="min-w-0 flex-1 border border-red-200 px-4 py-2 text-sm sm:max-w-xs"
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
              </div>
            </div>
          )}

          {can.resolve && (
            <div className="w-full space-y-2 bg-paper p-4">
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

      {(milestone.status === "Submitted" || milestone.status === "Disputed") && (
        <div className="mt-3 border-t border-line pt-3">
          <button
            type="button"
            onClick={() => setThreadOpen((v) => !v)}
            className="text-xs font-medium text-brand-700 hover:underline"
          >
            {threadOpen ? "Ocultar hilo de evidencia / disputa" : "Ver hilo de evidencia y disputa (SHA-256)"}
          </button>
          {threadOpen && (
            <div className="mt-2 space-y-2 bg-paper p-3 text-xs">
              {threadRecords.length === 0 ? (
                <p className="text-ink/50">Sin mensajes o adjuntos off-chain registrados aún.</p>
              ) : (
                <ul className="space-y-1.5">
                  {threadRecords.map((r) => (
                    <li key={r.id} className="border border-line bg-white p-2">
                      <div className="flex flex-wrap justify-between gap-1 text-[11px] text-ink/50">
                        <span>{shortAddress(r.author)}</span>
                        <span className="font-mono">sha256:{r.sha256.slice(0, 12)}…</span>
                      </div>
                      <p className="mt-1 text-ink">{r.note}</p>
                      {r.fileName && <p className="mt-0.5 text-[11px] text-ink/60">Archivo: {r.fileName}</p>}
                    </li>
                  ))}
                </ul>
              )}
              {!readOnly && (
                <div className="flex flex-wrap gap-2 pt-1">
                  <input
                    value={threadNote}
                    onChange={(e) => setThreadNote(e.target.value)}
                    placeholder="Agregar nota o descargo verificable..."
                    className="min-w-0 flex-1 border border-line bg-white px-2.5 py-1.5 text-xs"
                  />
                  <button
                    type="button"
                    disabled={!threadNote.trim() || threadBusy}
                    onClick={async () => {
                      setThreadBusy(true);
                      try {
                        const res = await fetch("/api/evidence", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            agreementId: agreement.id,
                            milestoneIndex: index,
                            author: wallet?.address ?? role,
                            kind: "dispute_message",
                            note: threadNote.trim(),
                          }),
                        });
                        const data = (await res.json()) as { record?: EvidenceRecord };
                        if (res.ok && data.record) {
                          setThreadRecords((prev) => [...prev, data.record!]);
                          setThreadNote("");
                        }
                      } finally {
                        setThreadBusy(false);
                      }
                    }}
                    className="bg-ink px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    {threadBusy ? "..." : "Registrar"}
                  </button>
                </div>
              )}
            </div>
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
      className={` px-5 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${base}`}
    >
      {children}
    </button>
  );
}
