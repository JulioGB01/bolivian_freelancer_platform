"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Invitation from "./Invitation";
import MilestoneRow from "./MilestoneRow";
import MoneyLocked from "./MoneyLocked";
import NotificationBar from "./NotificationBar";
import PayoutEcosystemPanel from "./PayoutEcosystemPanel";
import Timeline from "./Timeline";
import { EXPLORER_URL, ESCROW_CONTRACT_ID, USDC_CONTRACT_ID } from "@/lib/config";
import { ESCROW_CHANGED, escrowFor, getEscrow } from "@/lib/escrow";
import { formatDate, shortAddress } from "@/lib/format";
import { useT, type MsgKey, type TFn } from "@/lib/i18n";
import { useMode } from "@/lib/mode";
import { roleIn } from "@/lib/status";
import { useWallet } from "@/lib/useWallet";
import type { Agreement, Config } from "@/lib/types";

export function duration(secs: number, t: TFn): string {
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

/** Loads one agreement and the contract config, and reloads after any escrow change. */
export function useAgreement(id: number, source?: "demo" | "testnet") {
  const { wallet } = useWallet();
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [config, setConfig] = useState<Config | null>(null);
  const [missing, setMissing] = useState(false);
  const [loadError, setLoadError] = useState("");

  const refresh = useCallback(() => {
    (source ? escrowFor(source) : getEscrow())
      .getAgreement(id)
      .then((a) => {
        // Copy so React sees a new object after the demo mock mutates state in place.
        setAgreement(a ? structuredClone(a) : null);
        setMissing(!a);
      })
      .catch((e: unknown) => setLoadError(e instanceof Error ? e.message : String(e)));
  }, [id, source]);

  useEffect(() => {
    refresh();
    (source ? escrowFor(source) : getEscrow())
      .getConfig()
      .then(setConfig)
      .catch((e: unknown) => setLoadError(e instanceof Error ? e.message : String(e)));
    window.addEventListener(ESCROW_CHANGED, refresh);
    return () => window.removeEventListener(ESCROW_CHANGED, refresh);
  }, [refresh, wallet, source]);

  return { agreement, config, missing, loadError, refresh };
}

type Tab = "summary" | "activity" | "details";

export default function AgreementDetail({ id }: { id: number }) {
  const { t, lang } = useT();
  const mode = useMode();
  const { wallet } = useWallet();
  const { agreement, config, missing, loadError, refresh } = useAgreement(id);
  const [tab, setTab] = useState<Tab>("summary");
  const [copied, setCopied] = useState<"client" | "verify" | null>(null);

  async function copy(kind: "client" | "verify") {
    const url = `${window.location.origin}${kind === "client" ? `/app/acuerdo/${id}` : `/verificar/${id}${mode === "demo" ? "?demo=1" : ""}`}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      window.prompt(t("ag.copyPrompt"), url);
    }
  }

  if (missing || loadError) {
    return (
      <div className=" border border-line bg-white p-8 text-center">
        <p className="text-ink/60">{missing ? t("ag.notFound", { id }) : loadError}</p>
        <Link href="/app" className="mt-2 inline-block text-sm text-brand-700 underline">
          {t("ag.back")}
        </Link>
      </div>
    );
  }

  if (!agreement || !config) {
    return (
      <div className="animate-pulse space-y-6" aria-label={t("ag.loading")}>
        <div className="h-4 w-28 bg-line" />
        <div className="h-10 w-2/3 bg-line" />
        <div className="h-28 w-full border border-line bg-white p-5">
          <div className="h-4 w-1/3 bg-line" />
          <div className="mt-4 h-3 w-full bg-paper" />
        </div>
        <div className="space-y-3">
          <div className="h-32 w-full border border-line bg-white" />
          <div className="h-32 w-full border border-line bg-white" />
        </div>
      </div>
    );
  }

  const pinnedArbiter = agreement.arbiter ?? config.arbiter;
  const role = roleIn(agreement, wallet?.address, pinnedArbiter);
  const nothingFunded = agreement.milestones.every((m) => m.status === "Pending");
  const showInvitation = nothingFunded && role !== "freelancer" && role !== "arbiter";
  const showShare = role === "freelancer" && nothingFunded;
  const backHref = role === "client" ? "/app/cliente" : role === "arbiter" ? "/app/arbitro" : "/app/freelancer";
  const locale = lang === "es" ? "es-BO" : "en-US";

  return (
    <div className="space-y-6">
      <div>
        <Link href={backHref} className="text-sm text-brand-700 hover:underline">
          {t("ag.back")}
        </Link>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <h1 className="text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">{agreement.title}</h1>
          <div className="flex flex-wrap gap-2">
            {role === "freelancer" && (
              <button type="button" onClick={() => copy("client")} className=" bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-black">
                {copied === "client" ? t("ag.copied") : t("ag.copy")}
              </button>
            )}
            <button
              type="button"
              onClick={() => copy("verify")}
              className=" border border-line bg-white px-4 py-2 text-sm font-medium hover:border-ink"
            >
              {copied === "verify" ? t("ver.copied") : t("ver.copy")}
            </button>
          </div>
        </div>
        <p className="mt-2 text-sm text-ink/50">
          #{agreement.id} · {t("ag.fee")} {(agreement.feeBps / 100).toFixed(2)}% {t("ag.fixed")} · {t("ag.arbiter")}{" "}
          <span className="font-mono text-ink/70">{shortAddress(pinnedArbiter)}</span> · {t("ag.window")}{" "}
          {duration(agreement.reviewWindowSecs, t)}
          {wallet && (
            <>
              {" · "}
              {t("ag.viewingAs")} <strong className="text-ink">{t(`role.${role}` as MsgKey)}</strong>
            </>
          )}
        </p>
      </div>

      {showInvitation && <Invitation agreement={agreement} onChanged={refresh} />}

      {showShare && (
        <div className=" border border-bo-yellow bg-bo-yellow/20 p-4 text-sm">
          <strong>{t("ag.nextShareT")}</strong> {t("ag.nextShareB")}
        </div>
      )}

      <div className="flex gap-1 bg-white p-1 text-sm font-semibold shadow-sm sm:inline-flex" role="tablist">
        {(["summary", "activity", "details"] as Tab[]).map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={`flex-1 px-5 py-2 transition sm:flex-none ${tab === k ? "bg-ink text-white" : "text-ink/60 hover:text-ink"}`}
          >
            {t(`tab.${k}` as MsgKey)}
          </button>
        ))}
      </div>

      {tab === "summary" && (
        <div className="space-y-4">
          <MoneyLocked agreement={agreement} />
          <NotificationBar agreementId={agreement.id} />
          <div className="space-y-3">
            {agreement.milestones.map((m, i) => (
              <MilestoneRow key={i} agreement={agreement} milestone={m} index={i} role={role} onChanged={refresh} />
            ))}
          </div>
          <PayoutEcosystemPanel agreement={agreement} arbiter={pinnedArbiter} />
        </div>
      )}

      {tab === "activity" && <Timeline id={agreement.id} />}

      {tab === "details" && (
        <dl className="divide-y divide-line border border-line bg-white text-sm">
          <Row label={t("ag.agreement")} value={`#${agreement.id}`} />
          <Row label={t("ag.freelancer")} value={agreement.freelancer} mono href={`/perfil/${agreement.freelancer}${mode === "demo" ? "?demo=1" : ""}`} />
          <Row label={t("ag.client")} value={agreement.client} mono />
          <Row label={t("ag.arbiter")} value={pinnedArbiter} mono />
          <Row label={t("ag.fee")} value={`${(agreement.feeBps / 100).toFixed(2)}% ${t("ag.fixed")}`} />
          <Row label={t("ag.window")} value={duration(agreement.reviewWindowSecs, t)} />
          <Row label={t("det.created")} value={formatDate(agreement.createdAt, locale)} />
          <Row label={t("det.network")} value={mode === "testnet" ? "Stellar testnet" : "Demo"} />
          {mode === "testnet" && (
            <>
              <Row label={t("det.contract")} value={ESCROW_CONTRACT_ID} mono href={`${EXPLORER_URL}/contract/${ESCROW_CONTRACT_ID}`} />
              <Row label={t("det.token")} value={USDC_CONTRACT_ID} mono href={`${EXPLORER_URL}/contract/${USDC_CONTRACT_ID}`} />
            </>
          )}
          <Row label={t("det.verifyLink")} value={`/verificar/${agreement.id}`} href={`/verificar/${agreement.id}${mode === "demo" ? "?demo=1" : ""}`} />
        </dl>
      )}
    </div>
  );
}

function Row({ label, value, mono, href }: { label: string; value: string; mono?: boolean; href?: string }) {
  const isExternal = href?.startsWith("http");
  return (
    <div className="grid gap-1 px-5 py-3.5 sm:grid-cols-[12rem_1fr]">
      <dt className="text-ink/50">{label}</dt>
      <dd className={`break-all ${mono ? "font-mono text-xs leading-5" : ""}`}>
        {href ? (
          isExternal ? (
            <a href={href} target="_blank" rel="noreferrer noopener" className="text-brand-700 underline underline-offset-2">
              {value} ↗
            </a>
          ) : (
            <Link href={href} className="text-brand-700 underline underline-offset-2">
              {value}
            </Link>
          )
        ) : (
          value
        )}
      </dd>
    </div>
  );
}

