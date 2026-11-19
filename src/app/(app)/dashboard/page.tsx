"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AgreementCard from "@/components/AgreementCard";
import { ESCROW_CHANGED, getEscrow, lockedAmountOf } from "@/lib/escrow";
import { errorMessage } from "@/lib/errors";
import { formatAmount } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { actionsNeeded, roleIn } from "@/lib/status";
import { useNow } from "@/lib/useNow";
import { useWallet } from "@/lib/useWallet";
import type { Agreement } from "@/lib/types";

export default function Dashboard() {
  const { t } = useT();
  const { wallet } = useWallet();
  const now = useNow();
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Without a wallet the page renders the "connect" message and never reads the list.
    if (!wallet) return;
    const load = () =>
      getEscrow()
        .agreementsOf(wallet.address)
        .then((a) => {
          setAgreements(a);
          setError("");
        })
        .catch((e: unknown) => setError(errorMessage(e, t)))
        .finally(() => setLoading(false));
    void load();
    window.addEventListener(ESCROW_CHANGED, load);
    return () => window.removeEventListener(ESCROW_CHANGED, load);
  }, [wallet, t]);

  if (!wallet) {
    return (
      <div className="rounded-3xl border border-line bg-white p-8 text-center">
        <p className="text-slate-600">{t("dash.connect")}</p>
      </div>
    );
  }

  if (loading) return <p className="text-slate-500">{t("ag.loading")}</p>;

  const lockedForMe = agreements.filter((a) => a.freelancer === wallet.address).reduce((s, a) => s + lockedAmountOf(a), 0);
  const lockedByMe = agreements.filter((a) => a.client === wallet.address).reduce((s, a) => s + lockedAmountOf(a), 0);
  const todo = agreements.reduce((s, a) => s + actionsNeeded(a, roleIn(a, wallet.address), now), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">{t("dash.title")}</h1>
        <Link
          href="/agreements/new"
          className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-black"
        >
          {t("dash.new")}
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label={t("dash.lockedForMe")} value={`${formatAmount(lockedForMe)} USDC`} accent />
        <Stat label={t("dash.lockedByMe")} value={`${formatAmount(lockedByMe)} USDC`} />
        <Stat label={t("dash.waiting")} value={t("dash.actions", { n: todo })} />
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {agreements.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-ink/20 bg-white p-10 text-center">
          <p className="font-medium text-slate-800">{t("dash.emptyT")}</p>
          <p className="mt-1 text-sm text-slate-500">{t("dash.emptyB")}</p>
          <Link
            href="/agreements/new"
            className="mt-4 inline-block rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-black"
          >
            {t("dash.emptyCta")}
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {agreements.map((a) => (
            <AgreementCard key={a.id} agreement={a} viewer={wallet.address} now={now} />
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-3xl border p-6 ${accent ? "border-ink bg-ink text-white" : "border-line bg-white"}`}>
      <p className={`text-xs font-medium uppercase tracking-wider ${accent ? "text-white/60" : "text-ink/50"}`}>{label}</p>
      <p className={`mt-3 text-3xl font-semibold tracking-tight ${accent ? "text-lime" : "text-ink"}`}>{value}</p>
    </div>
  );
}
