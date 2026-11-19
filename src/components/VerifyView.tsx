"use client";

// Public, read-only proof of one agreement: no wallet, no buttons.
import Link from "next/link";
import MilestoneRow from "./MilestoneRow";
import MoneyLocked from "./MoneyLocked";
import Timeline from "./Timeline";
import { duration, useAgreement } from "./AgreementDetail";
import { shortAddress } from "@/lib/format";
import { useT } from "@/lib/i18n";

export default function VerifyView({ id, source }: { id: number; source: "demo" | "testnet" }) {
  const { t } = useT();
  const { agreement, config, missing, loadError } = useAgreement(id, source);
  const pinnedArbiter = agreement?.arbiter ?? config?.arbiter;

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-5 py-10 sm:py-14">
      <div>
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-ink/50">{t("ver.kicker")} · #{id} · {source === "testnet" ? "Stellar testnet" : "Demo"}</p>
        {missing || loadError ? (
          <p className="mt-4 border border-line bg-white p-8 text-center text-ink/60">{missing ? t("ag.notFound", { id }) : loadError}</p>
        ) : !agreement ? (
          <p className="mt-4 text-ink/50">{t("ag.loading")}</p>
        ) : (
          <>
            <h1 className="mt-2 text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">{agreement.title}</h1>
            <p className="mt-2 text-sm text-ink/50">
              {t("ag.freelancer")}{" "}
              <Link className="font-mono underline underline-offset-2" href={`/perfil/${agreement.freelancer}${source === "demo" ? "?demo=1" : ""}`}>
                {shortAddress(agreement.freelancer)}
              </Link> · {t("ag.client")}{" "}
              <span className="font-mono">{shortAddress(agreement.client)}</span> · {t("ag.fee")} {(agreement.feeBps / 100).toFixed(2)}%
              {pinnedArbiter && (
                <>
                  {" · "}
                  {t("ag.arbiter")} <span className="font-mono">{shortAddress(pinnedArbiter)}</span>
                </>
              )}{" "}
              · {t("ag.window")} {duration(agreement.reviewWindowSecs, t)}
            </p>
          </>
        )}
      </div>

      {agreement && (
        <>
          <p className="inline-flex items-center gap-2 bg-white px-3 py-1.5 text-xs text-ink/60 shadow-sm">
            <span className="h-2 w-2 bg-lime" aria-hidden />
            {t("ver.readOnly")}
          </p>
          <MoneyLocked agreement={agreement} source={source} />
          <div className="space-y-3">
            {agreement.milestones.map((m, i) => (
              <MilestoneRow key={i} agreement={agreement} milestone={m} index={i} role="viewer" onChanged={() => undefined} readOnly />
            ))}
          </div>
          <h2 className="pt-4 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-ink/50">{t("tab.activity")}</h2>
          <Timeline id={agreement.id} source={source} />
          <Link href={`/app/acuerdo/${agreement.id}`} className="inline-block bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-black">
            {t("ver.open")} ↗
          </Link>
        </>
      )}
    </div>
  );
}
