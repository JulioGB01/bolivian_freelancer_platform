"use client";

// Live totals read from the deployed escrow contract on Stellar testnet (like a DeFi "TVL" strip).
// This is the landing's one animated moment: the numbers tick up with NumberFlow once they load.
import { useEffect, useState } from "react";
import NumberFlow from "@number-flow/react";
import { EXPLORER_URL, ESCROW_CONTRACT_ID } from "@/lib/config";
import { escrowFor } from "@/lib/escrow";
import { USDC_DECIMALS } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { protocolStats, type ProtocolStats as Stats } from "@/lib/metrics";

const usdc = (units: number) => units / 10 ** USDC_DECIMALS;
const money = { minimumFractionDigits: 2, maximumFractionDigits: 2 } as const;

export default function ProtocolStats() {
  const { t } = useT();
  const [stats, setStats] = useState<Stats | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    escrowFor("testnet")
      .listAll()
      .then((list) => setStats(protocolStats(list)))
      .catch(() => setFailed(true));
  }, []);

  const small: [string, number, boolean][] = [
    [t("stats.paid"), stats ? usdc(stats.paid) : 0, true],
    [t("stats.agreements"), stats?.agreements ?? 0, false],
    [t("stats.milestones"), stats?.milestonesPaid ?? 0, false],
  ];

  return (
    <section className="mx-auto max-w-6xl px-5">
      <div className="grid border border-ink bg-white lg:grid-cols-[1.4fr_1fr]">
        <div className="relative overflow-hidden border-b border-ink p-7 sm:p-10 lg:border-r lg:border-b-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-2 font-mono text-[11px] font-medium tracking-[0.18em] uppercase">
              <span className="h-2 w-2 animate-pulse bg-bo-green" aria-hidden />
              {t("land.liveK")}
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
          <p className="mt-10 text-sm text-ink/60">{t("land.liveT")}</p>
          <p className="mt-1 flex items-baseline gap-3 text-[3.5rem] leading-none font-semibold tracking-[-0.05em] tabular-nums sm:text-[6.5rem]">
            {failed ? "—" : <NumberFlow value={stats ? usdc(stats.locked) : 0} format={money} locales="en-US" willChange />}
            <span className="font-mono text-base font-normal tracking-normal text-ink/40">USDC</span>
          </p>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-ink/60">{t("land.liveB")}</p>
          <div className="bo-stripe absolute inset-x-0 bottom-0 h-1" aria-hidden />
        </div>
        <div className="grid">
          {small.map(([label, value, isMoney], i) => (
            <div key={label} className={`flex flex-col justify-between gap-4 p-7 sm:px-10 ${i < 2 ? "border-b border-line" : ""}`}>
              <p className="font-mono text-[11px] tracking-[0.18em] text-ink/50 uppercase">{label}</p>
              <p className="text-4xl font-semibold tracking-[-0.04em] tabular-nums">
                {failed ? "—" : <NumberFlow value={value} format={isMoney ? money : undefined} locales="en-US" />}
                {isMoney && <span className="ml-2 font-mono text-sm font-normal tracking-normal text-ink/40">USDC</span>}
              </p>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-2 font-mono text-[11px] text-ink/40">{stats ? t("stats.source") : failed ? "—" : t("stats.loading")}</p>
    </section>
  );
}
