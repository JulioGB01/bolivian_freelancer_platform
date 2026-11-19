"use client";

// Public, read-only proof of one agreement: no wallet, no buttons.
import Link from "next/link";
import MilestoneRow from "./MilestoneRow";
import MoneyLocked from "./MoneyLocked";
import Timeline from "./Timeline";
import { duration, useAgreement } from "./AgreementDetail";
import { shortAddress } from "@/lib/format";
import { useT } from "@/lib/i18n";

export default function VerifyView({ id }: { id: number }) {
  const { t } = useT();
  const { agreement, missing, loadError } = useAgreement(id);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-5 py-10 sm:py-14">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/50">{t("ver.kicker")} · #{id}</p>
        {missing || loadError ? (
          <p className="mt-4 rounded-3xl border border-line bg-white p-8 text-center text-ink/60">{missing ? t("ag.notFound", { id }) : loadError}</p>
        ) : !agreement ? (
          <p className="mt-4 text-ink/50">{t("ag.loading")}</p>
        ) : (
          <>
            <h1 className="mt-2 text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">{agreement.title}</h1>
            <p className="mt-2 text-sm text-ink/50">
              {t("ag.freelancer")} <span className="font-mono">{shortAddress(agreement.freelancer)}</span> · {t("ag.client")}{" "}
              <span className="font-mono">{shortAddress(agreement.client)}</span> · {t("ag.fee")} {(agreement.feeBps / 100).toFixed(2)}% ·{" "}
              {t("ag.window")} {duration(agreement.reviewWindowSecs, t)}
            </p>
          </>
        )}
      </div>

      {agreement && (
        <>
          <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs text-ink/60 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-lime" aria-hidden />
            {t("ver.readOnly")}
          </p>
          <MoneyLocked agreement={agreement} />
          <div className="space-y-3">
            {agreement.milestones.map((m, i) => (
              <MilestoneRow key={i} agreement={agreement} milestone={m} index={i} role="viewer" onChanged={() => undefined} readOnly />
            ))}
          </div>
          <h2 className="pt-4 text-xs font-semibold uppercase tracking-[0.2em] text-ink/50">{t("tab.activity")}</h2>
          <Timeline id={agreement.id} />
          <Link href={`/app/acuerdo/${agreement.id}`} className="inline-block rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-black">
            {t("ver.open")} ↗
          </Link>
        </>
      )}
    </div>
  );
}
