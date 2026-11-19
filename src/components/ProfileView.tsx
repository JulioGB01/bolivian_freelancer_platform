"use client";

// Public track record of a freelancer, computed from the contract (like a credit score, but open).
import Link from "next/link";
import { useEffect, useState } from "react";
import { escrowFor } from "@/lib/escrow";
import { formatAmount, formatDate, shortAddress } from "@/lib/format";
import { useT, type MsgKey } from "@/lib/i18n";
import { freelancerStats, type FreelancerStats } from "@/lib/metrics";

const LEVEL_STYLE = { new: "bg-paper text-ink", active: "bg-bo-yellow text-ink", trusted: "bg-lime text-ink" } as const;

export default function ProfileView({ address, source }: { address: string; source: "demo" | "testnet" }) {
  const { t, lang } = useT();
  const [stats, setStats] = useState<FreelancerStats | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    escrowFor(source)
      .agreementsOf(address)
      .then((list) => setStats(freelancerStats(list, address)))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, [address, source]);

  const q = source === "demo" ? "?demo=1" : "";
  const locale = lang === "es" ? "es-BO" : "en-US";

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-5 py-12 sm:py-16">
      <header className="grid gap-6 border-b border-ink pb-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-ink/50">
            {t("prof.kicker")} · {source === "testnet" ? "Stellar testnet" : "Demo"}
          </p>
          <h1 className="mt-3 text-5xl font-semibold tracking-[-0.035em] sm:text-6xl">{t("prof.title")}</h1>
          <p className="mt-3 break-all font-mono text-sm text-ink/70">{address}</p>
          <p className="mt-3 max-w-2xl text-ink/60">{t("prof.lead")}</p>
        </div>
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(window.location.href);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 2000);
            } catch {
              /* clipboard blocked */
            }
          }}
          className="border border-ink px-5 py-3 text-sm font-semibold hover:bg-ink hover:text-white"
        >
          {copied ? t("prof.copied") : t("prof.share")}
        </button>
      </header>

      {error && <p className="bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {!stats && !error && <p className="font-mono text-sm text-ink/50">{t("stats.loading")}</p>}

      {stats && (
        <>
          <section className="grid gap-px border border-ink bg-ink sm:grid-cols-4">
            <div className={`p-6 sm:col-span-1 ${LEVEL_STYLE[stats.level]}`}>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] opacity-60">{t("prof.level")}</p>
              <p className="mt-3 text-4xl font-semibold tracking-tight">{t(`prof.level.${stats.level}` as MsgKey)}</p>
            </div>
            <Cell label={t("prof.completed")} value={String(stats.milestonesPaid)} />
            <Cell label={t("prof.earned")} value={`${formatAmount(stats.earned)}`} unit="USDC" />
            <Cell label={t("prof.locked")} value={`${formatAmount(stats.locked)}`} unit="USDC" />
            <Cell label={t("prof.agreements")} value={String(stats.agreements.length)} />
            <Cell label={t("prof.clients")} value={String(stats.clients)} />
            <Cell label={t("prof.disputes")} value={String(stats.disputes)} />
            <Cell label={t("prof.since")} value={stats.since ? formatDate(stats.since, locale).split(",")[0] : "—"} small />
          </section>
          <p className="font-mono text-xs text-ink/50">{t("prof.levelNote")}</p>

          <section>
            <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-ink/50">{t("prof.list")}</h2>
            {stats.agreements.length === 0 ? (
              <p className="mt-4 border border-line bg-white p-8 text-center text-ink/60">{t("prof.empty")}</p>
            ) : (
              <ul className="mt-4 border-t border-ink">
                {stats.agreements.map((a) => {
                  const paid = a.milestones.filter((m) => m.status === "Released").length;
                  return (
                    <li key={a.id}>
                      <Link
                        href={`/verificar/${a.id}${q}`}
                        className="grid grid-cols-[3rem_1fr_auto] items-center gap-4 border-b border-line py-4 transition hover:bg-white"
                      >
                        <span className="font-mono text-sm text-ink/40">#{a.id}</span>
                        <span>
                          <span className="font-semibold">{a.title}</span>
                          <span className="ml-2 font-mono text-xs text-ink/50">{shortAddress(a.client)}</span>
                        </span>
                        <span className="font-mono text-sm">
                          {paid}/{a.milestones.length} ↗
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function Cell({ label, value, unit, small }: { label: string; value: string; unit?: string; small?: boolean }) {
  return (
    <div className="bg-paper p-6">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink/50">{label}</p>
      <p className={`mt-3 font-semibold tracking-tight ${small ? "text-xl" : "text-4xl"}`}>
        {value} {unit && <span className="font-mono text-xs text-ink/50">{unit}</span>}
      </p>
    </div>
  );
}
