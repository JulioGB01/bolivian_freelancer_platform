"use client";

// What a client sees when they open a proposal link: the offer, then three guided steps.
import Link from "next/link";
import { useEffect, useState } from "react";
import { ESCROW_CHANGED, getEscrow, notifyEscrowChanged, topUpDemoClient } from "@/lib/escrow";
import { formatAmount, shortAddress } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { useMode } from "@/lib/mode";
import { getAccountBalances } from "@/lib/stellarAccount";
import type { Agreement } from "@/lib/types";
import { useWallet } from "@/lib/useWallet";
import { DEMO_IDENTITIES } from "@/lib/wallet";
import ReviewDialog, { type ReviewRequest } from "./ReviewDialog";

export default function Invitation({ agreement, onChanged }: { agreement: Agreement; onChanged: () => void }) {
  const { t } = useT();
  const mode = useMode();
  const { wallet, connectReal, connectPasskey, connectAs } = useWallet();
  const [ready, setReady] = useState(false);
  const [review, setReview] = useState<ReviewRequest | null>(null);

  const first = agreement.milestones[0];
  const total = agreement.milestones.reduce((s, m) => s + m.amount, 0);
  const isClient = wallet?.address === agreement.client;

  // Step 2 is done when the wallet can pay the first milestone.
  useEffect(() => {
    if (!wallet || !isClient) return;
    const check = async () => {
      if (mode === "testnet") {
        const b = await getAccountBalances(wallet.address).catch(() => null);
        setReady(!!b && b.exists && b.usdc !== null && b.usdc >= first.amount);
      } else {
        setReady((await getEscrow().balanceOf(wallet.address)) >= first.amount);
      }
    };
    const timer = window.setTimeout(check, 0);
    window.addEventListener(ESCROW_CHANGED, check);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(ESCROW_CHANGED, check);
    };
  }, [wallet, isClient, mode, first.amount]);

  const step1 = !!wallet && isClient;
  const step2 = step1 && ready;

  return (
    <section className="hero-grid overflow-hidden bg-ink text-white">
      <div className="grid gap-8 p-7 sm:p-10 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-lime">{t("inv.kicker")}</p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.03em] sm:text-4xl">{t("inv.title")}</h2>
          <p className="mt-2 text-sm text-white/60">
            {t("inv.from")} <span className="font-mono text-white/80">{shortAddress(agreement.freelancer)}</span>
          </p>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/70">{t("inv.lead")}</p>
          <div className="mt-6 flex flex-wrap gap-6">
            <div>
              <p className="text-xs uppercase tracking-wider text-white/50">{t("inv.total")}</p>
              <p className="mt-1 text-3xl font-semibold">
                {formatAmount(total)} <span className="text-sm text-lime">USDC</span>
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-white/50">{t("inv.first")}</p>
              <p className="mt-1 text-3xl font-semibold">
                {formatAmount(first.amount)} <span className="text-sm text-lime">USDC</span>
              </p>
            </div>
          </div>
        </div>

        <ol className="space-y-3 self-center">
          <Step n={1} done={step1} active={!step1} title={t("inv.step1")}>
            {!wallet && mode === "testnet" && (
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => void connectPasskey().catch(() => undefined)} className="bg-lime px-4 py-2 text-xs font-semibold text-ink">
                  Entrar con Passkey (sin wallet)
                </button>
                <button type="button" onClick={() => void connectReal().catch(() => undefined)} className="border border-white/25 px-3 py-2 text-xs font-medium text-white hover:border-lime">
                  {t("wallet.connect")}
                </button>
              </div>
            )}
            {mode === "demo" && !isClient && (
              <button type="button" onClick={() => connectAs(DEMO_IDENTITIES[1])} className="mt-3 bg-lime px-4 py-2 text-xs font-semibold text-ink">
                {t("wallet.connectAs")} {t("demo.client")}
              </button>
            )}
            {wallet && !isClient && mode === "testnet" && (
              <p className="mt-2 text-xs text-bo-yellow">{t("inv.notClient", { addr: shortAddress(agreement.client) })}</p>
            )}
          </Step>
          <Step n={2} done={step2} active={step1 && !step2} title={t("inv.step2")}>
            <p className="mt-1 text-xs text-white/50">{t("inv.step2b")}</p>
            {step1 && !step2 && mode === "testnet" && (
              <Link href="/app/billetera" className="mt-3 inline-block bg-lime px-4 py-2 text-xs font-semibold text-ink">
                {t("inv.goWallet")} ↗
              </Link>
            )}
            {step1 && !step2 && mode === "demo" && (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-bo-yellow">{t("inv.demoLowBalance")}</p>
                <button
                  type="button"
                  onClick={() => topUpDemoClient()}
                  className="bg-lime px-4 py-2 text-xs font-semibold text-ink hover:opacity-90"
                >
                  {t("inv.topUpDemo")}
                </button>
              </div>
            )}
          </Step>
          <Step n={3} done={false} active={step2} title={t("inv.step3")}>
            {step2 && (
              <button
                type="button"
                onClick={() =>
                  setReview({
                    title: "rv.fund",
                    rows: [
                      { label: t("rv.amount"), value: `${formatAmount(first.amount)} USDC`, strong: true },
                      { label: t("rv.from"), value: `${t("rv.yourWallet")} (${shortAddress(agreement.client)})` },
                      { label: t("rv.to"), value: t("rv.contract") },
                    ],
                    what: "rv.whatFund",
                    action: () => getEscrow().fundMilestone(agreement.id, 0),
                    onDone: () => {
                      onChanged();
                      notifyEscrowChanged();
                    },
                  })
                }
                className="mt-3 bg-lime px-5 py-2.5 text-sm font-semibold text-ink"
              >
                {t("inv.lockNow", { amount: formatAmount(first.amount) })}
              </button>
            )}
          </Step>
        </ol>
      </div>
      <ReviewDialog request={review} onClose={() => setReview(null)} />
    </section>
  );
}

function Step({ n, done, active, title, children }: { n: number; done: boolean; active: boolean; title: string; children?: React.ReactNode }) {
  return (
    <li className={` border p-4 ${active ? "border-lime/60 bg-white/5" : "border-white/10"}`}>
      <div className="flex items-center gap-3">
        <span
          className={`grid h-7 w-7 place-items-center text-xs font-bold ${done ? "bg-lime text-ink" : active ? "bg-white text-ink" : "bg-white/10 text-white/50"}`}
        >
          {done ? "✓" : n}
        </span>
        <p className={`text-sm font-semibold ${done || active ? "text-white" : "text-white/50"}`}>{title}</p>
      </div>
      {children}
    </li>
  );
}
