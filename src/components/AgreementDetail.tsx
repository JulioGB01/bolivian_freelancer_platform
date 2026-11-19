"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import MilestoneRow from "./MilestoneRow";
import MoneyLocked from "./MoneyLocked";
import { ESCROW_CHANGED, getEscrow } from "@/lib/escrow";
import { shortAddress } from "@/lib/format";
import { useT, type MsgKey, type TFn } from "@/lib/i18n";
import { roleIn } from "@/lib/status";
import { useWallet } from "@/lib/useWallet";
import type { Agreement, Config } from "@/lib/types";

function duration(secs: number, t: TFn): string {
  const units: [number, MsgKey][] = [
    [86400, "dur.day"],
    [3600, "dur.hour"],
    [60, "dur.minute"],
  ];
  for (const [size, key] of units)
    if (secs >= size && secs % size === 0) {
      const n = secs / size;
      return t((n === 1 ? key : `${key}s`) as MsgKey, { n });
    }
  return t("dur.second", { n: secs });
}

export default function AgreementDetail({ id }: { id: number }) {
  const { t } = useT();
  const { wallet } = useWallet();
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [config, setConfig] = useState<Config | null>(null);
  const [missing, setMissing] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [copied, setCopied] = useState(false);

  const refresh = useCallback(() => {
    getEscrow()
      .getAgreement(id)
      .then((a) => {
        // Copy so React sees a new object after the demo mock mutates state in place.
        setAgreement(a ? structuredClone(a) : null);
        setMissing(!a);
      })
      .catch((e: unknown) => setLoadError(e instanceof Error ? e.message : String(e)));
  }, [id]);

  useEffect(() => {
    refresh();
    getEscrow()
      .getConfig()
      .then(setConfig)
      .catch((e: unknown) => setLoadError(e instanceof Error ? e.message : String(e)));
    window.addEventListener(ESCROW_CHANGED, refresh);
    return () => window.removeEventListener(ESCROW_CHANGED, refresh);
  }, [refresh, wallet]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt(t("ag.copyPrompt"), window.location.href);
    }
  }

  if (missing || loadError) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-slate-600">{missing ? t("ag.notFound", { id }) : loadError}</p>
        <Link href="/dashboard" className="mt-2 inline-block text-sm text-brand-700 underline">
          {t("ag.back")}
        </Link>
      </div>
    );
  }

  if (!agreement || !config) return <p className="text-slate-500">{t("ag.loading")}</p>;

  const role = roleIn(agreement, wallet?.address, config.arbiter);
  const showShare = role === "freelancer" && agreement.milestones.some((m) => m.status === "Pending");

  return (
    <div className="space-y-5">
      <div>
        <Link href="/dashboard" className="text-sm text-brand-700 hover:underline">
          {t("ag.back")}
        </Link>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{agreement.title}</h1>
          <button
            type="button"
            onClick={copyLink}
            className="rounded-full border border-slate-300 bg-white px-4 py-1.5 text-sm font-medium text-slate-700 hover:border-brand-600 hover:text-brand-700"
          >
            {copied ? t("ag.copied") : t("ag.copy")}
          </button>
        </div>
        <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-500">
          <Item label={t("ag.agreement")} value={`#${agreement.id}`} />
          <Item label={t("ag.freelancer")} value={shortAddress(agreement.freelancer)} title={agreement.freelancer} mono />
          <Item label={t("ag.client")} value={shortAddress(agreement.client)} title={agreement.client} mono />
          <Item label={t("ag.fee")} value={`${(agreement.feeBps / 100).toFixed(2)}% ${t("ag.fixed")}`} />
          <Item label={t("ag.window")} value={duration(agreement.reviewWindowSecs, t)} />
        </dl>
        {wallet ? (
          <p className="mt-2 inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">
            {t("ag.viewingAs")} <strong>{t(`role.${role}` as MsgKey)}</strong>
          </p>
        ) : (
          <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{t("ag.connectToAct")}</p>
        )}
      </div>

      {showShare && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <strong>{t("ag.nextShareT")}</strong> {t("ag.nextShareB")}
        </div>
      )}

      <MoneyLocked agreement={agreement} />

      <div className="space-y-3">
        {agreement.milestones.map((m, i) => (
          <MilestoneRow key={i} agreement={agreement} milestone={m} index={i} role={role} onChanged={refresh} />
        ))}
      </div>
    </div>
  );
}

function Item({ label, value, title, mono }: { label: string; value: string; title?: string; mono?: boolean }) {
  return (
    <div>
      <dt className="inline">{label}: </dt>
      <dd className={`inline ${mono ? "font-mono" : ""}`} title={title}>
        {value}
      </dd>
    </div>
  );
}
