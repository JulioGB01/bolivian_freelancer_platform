"use client";

// Live totals read from the deployed escrow contract on Stellar testnet (like a DeFi "TVL" strip).
import { useEffect, useState } from "react";
import { EXPLORER_URL, ESCROW_CONTRACT_ID } from "@/lib/config";
import { escrowFor } from "@/lib/escrow";
import { formatAmount } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { protocolStats, type ProtocolStats as Stats } from "@/lib/metrics";

export default function ProtocolStats() {
  const { t } = useT();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    escrowFor("testnet")
      .listAll()
      .then((list) => setStats(protocolStats(list)))
      .catch(() => setStats(null));
  }, []);

  const cells: [string, string, string?][] = [
    [t("stats.locked"), stats ? formatAmount(stats.locked) : "—", "USDC"],
    [t("stats.paid"), stats ? formatAmount(stats.paid) : "—", "USDC"],
    [t("stats.agreements"), stats ? String(stats.agreements) : "—"],
    [t("stats.milestones"), stats ? String(stats.milestonesPaid) : "—"],
  ];

  return (
    <section className="mx-auto max-w-6xl px-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink pb-3">
        <p className="flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.18em]">
          <span className="h-2 w-2 animate-pulse bg-lime" aria-hidden />
          {t("stats.kicker")}
        </p>
        <a
          href={`${EXPLORER_URL}/contract/${ESCROW_CONTRACT_ID}`}
          target="_blank"
          rel="noreferrer noopener"
          className="font-mono text-[11px] text-ink/50 underline underline-offset-4 hover:text-ink"
        >
          {ESCROW_CONTRACT_ID.slice(0, 6)}…{ESCROW_CONTRACT_ID.slice(-6)} ↗
        </a>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4">
        {cells.map(([label, value, unit], i) => (
          <div key={label} className={`border-b border-line py-8 lg:border-b-0 ${i > 0 ? "lg:border-l lg:pl-8" : ""}`}>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink/50">{label}</p>
            <p className="mt-3 text-5xl font-semibold tracking-[-0.04em]">
              {value} {unit && <span className="font-mono text-sm font-normal text-ink/40">{unit}</span>}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-2 font-mono text-[11px] text-ink/40">{stats ? t("stats.source") : t("stats.loading")}</p>
    </section>
  );
}
