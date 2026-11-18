"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import MilestoneRow from "./MilestoneRow";
import MoneyLocked from "./MoneyLocked";
import { getEscrow } from "@/lib/escrow";
import { formatDuration, shortAddress } from "@/lib/format";
import { roleIn } from "@/lib/status";
import { useWallet } from "@/lib/useWallet";
import type { Agreement, Config } from "@/lib/types";

export default function AgreementDetail({ id }: { id: number }) {
  const { wallet } = useWallet();
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [config, setConfig] = useState<Config | null>(null);
  const [missing, setMissing] = useState(false);
  const [copied, setCopied] = useState(false);

  const refresh = useCallback(() => {
    getEscrow()
      .getAgreement(id)
      .then((a) => {
        // Copy so React sees a new object after the mock mutates state in place.
        setAgreement(a ? structuredClone(a) : null);
        setMissing(!a);
      });
  }, [id]);

  useEffect(() => {
    refresh();
    getEscrow().getConfig().then(setConfig);
  }, [refresh, wallet]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link and send it to your client:", window.location.href);
    }
  }

  if (missing) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
        <p className="text-slate-600">Agreement #{id} not found.</p>
        <Link href="/dashboard" className="mt-2 inline-block text-sm text-brand-600 underline">
          Back to my agreements
        </Link>
      </div>
    );
  }

  if (!agreement || !config) return <p className="text-slate-500">Loading…</p>;

  const role = roleIn(agreement, wallet?.address, config.arbiter);
  const showShare = role === "freelancer" && agreement.milestones.some((m) => m.status === "Pending");

  return (
    <div className="space-y-5">
      <div>
        <Link href="/dashboard" className="text-sm text-brand-600 hover:underline">
          ← My agreements
        </Link>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">{agreement.title}</h1>
          <button
            type="button"
            onClick={copyLink}
            className="rounded-full border border-slate-300 bg-white px-4 py-1.5 text-sm font-medium text-slate-700 hover:border-brand-600 hover:text-brand-700"
          >
            {copied ? "✓ Link copied" : "Copy link for your client"}
          </button>
        </div>
        <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-500">
          <div>
            <dt className="inline">Agreement </dt>
            <dd className="inline">#{agreement.id}</dd>
          </div>
          <div>
            <dt className="inline">Freelancer: </dt>
            <dd className="inline font-mono" title={agreement.freelancer}>{shortAddress(agreement.freelancer)}</dd>
          </div>
          <div>
            <dt className="inline">Client: </dt>
            <dd className="inline font-mono" title={agreement.client}>{shortAddress(agreement.client)}</dd>
          </div>
          <div>
            <dt className="inline">Fee: </dt>
            <dd className="inline">{(agreement.feeBps / 100).toFixed(2)}% (fixed)</dd>
          </div>
          <div>
            <dt className="inline">Review window: </dt>
            <dd className="inline">{formatDuration(agreement.reviewWindowSecs)}</dd>
          </div>
        </dl>
        {wallet ? (
          <p className="mt-2 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
            You are viewing as: <strong>{role}</strong>
          </p>
        ) : (
          <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Connect your wallet (top right) to take action on this agreement.
          </p>
        )}
      </div>

      {showShare && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <strong>Next: send this agreement to your client.</strong> Use “Copy link for your
          client”. Once they lock the funds you will see it below, and you can start working.
        </div>
      )}

      <MoneyLocked agreement={agreement} />

      <div className="space-y-3">
        {agreement.milestones.map((m, i) => (
          <MilestoneRow
            key={i}
            agreement={agreement}
            milestone={m}
            index={i}
            role={role}
            onChanged={refresh}
          />
        ))}
      </div>
    </div>
  );
}
