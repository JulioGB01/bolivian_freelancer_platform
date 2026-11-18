"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AgreementCard from "@/components/AgreementCard";
import { ESCROW_CHANGED, getEscrow, lockedAmountOf } from "@/lib/escrow";
import { formatAmount } from "@/lib/format";
import { actionsNeeded, roleIn } from "@/lib/status";
import { useNow } from "@/lib/useNow";
import { useWallet } from "@/lib/useWallet";
import type { Agreement } from "@/lib/types";

export default function Dashboard() {
  const { wallet } = useWallet();
  const now = useNow();
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Without a wallet the page renders the "connect" message and never reads the list.
    if (!wallet) return;
    const load = () =>
      getEscrow()
        .agreementsOf(wallet.address)
        .then((a) => {
          setAgreements(a);
          setLoading(false);
        });
    load();
    window.addEventListener(ESCROW_CHANGED, load);
    return () => window.removeEventListener(ESCROW_CHANGED, load);
  }, [wallet]);

  if (!wallet) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
        <p className="text-slate-600">Connect your wallet (top right) to see your agreements.</p>
      </div>
    );
  }

  if (loading) return <p className="text-slate-500">Loading…</p>;

  const lockedForMe = agreements
    .filter((a) => a.freelancer === wallet.address)
    .reduce((s, a) => s + lockedAmountOf(a), 0);
  const lockedByMe = agreements
    .filter((a) => a.client === wallet.address)
    .reduce((s, a) => s + lockedAmountOf(a), 0);
  const todo = agreements.reduce((s, a) => s + actionsNeeded(a, roleIn(a, wallet.address), now), 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">My agreements</h1>
        <Link
          href="/agreements/new"
          className="rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          + New agreement
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Locked for my work" value={`${formatAmount(lockedForMe)} USDC`} accent />
        <Stat label="I locked as a client" value={`${formatAmount(lockedByMe)} USDC`} />
        <Stat label="Waiting on me" value={`${todo} action${todo === 1 ? "" : "s"}`} />
      </div>

      {agreements.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="font-medium text-slate-800">No agreements yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Create one, send the link to your client, and start working once the money is locked.
          </p>
          <Link
            href="/agreements/new"
            className="mt-4 inline-block rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Create my first agreement
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
    <div
      className={`rounded-xl border p-4 ${accent ? "border-brand-200 bg-brand-50" : "border-slate-200 bg-white"}`}
    >
      <p className={`text-xs font-medium ${accent ? "text-brand-800" : "text-slate-500"}`}>{label}</p>
      <p className={`mt-1 text-xl font-semibold ${accent ? "text-brand-900" : "text-slate-900"}`}>{value}</p>
    </div>
  );
}
