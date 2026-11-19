"use client";

// The "see the money" panel: how much of the agreement is locked in the contract right now,
// how much was already paid out, and how much the client has not locked yet. In testnet mode it
// links to the block explorer so either party can verify the funds independently.
import { EXPLORER_URL, ESCROW_CONTRACT_ID } from "@/lib/config";
import { lockedAmountOf } from "@/lib/escrow";
import { formatAmount } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { useMode } from "@/lib/mode";
import type { Agreement } from "@/lib/types";

export default function MoneyLocked({ agreement }: { agreement: Agreement }) {
  const { t } = useT();
  const mode = useMode();
  const locked = lockedAmountOf(agreement);
  let total = 0;
  let settled = 0;
  let unfunded = 0;
  for (const m of agreement.milestones) {
    total += m.amount;
    if (m.status === "Pending") unfunded += m.amount;
    if (["Released", "Resolved", "Refunded"].includes(m.status)) settled += m.amount;
  }
  const pct = (n: number) => (total > 0 ? (n / total) * 100 : 0);

  return (
    <section className="rounded-xl border border-brand-200 bg-brand-50/60 p-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-brand-900">
            <span aria-hidden>🔒 </span>
            {t("money.lockedNow")}
          </p>
          <p className="text-3xl font-bold text-brand-900">
            {formatAmount(locked)} <span className="text-base font-medium text-brand-700">USDC</span>
          </p>
        </div>
        <p className="text-sm text-slate-600">{t("money.of", { amount: formatAmount(total) })}</p>
      </div>

      <div
        className="mt-4 flex h-3 overflow-hidden rounded-full bg-slate-200"
        role="img"
        aria-label={`${t("money.settled", { amount: formatAmount(settled) })}, ${t("money.locked", { amount: formatAmount(locked) })}, ${t("money.unfunded", { amount: formatAmount(unfunded) })}`}
      >
        <div className="bg-slate-400" style={{ width: `${pct(settled)}%` }} />
        <div className="bg-brand-600" style={{ width: `${pct(locked)}%` }} />
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
        <Legend color="bg-slate-400" label={t("money.settled", { amount: formatAmount(settled) })} />
        <Legend color="bg-brand-600" label={t("money.locked", { amount: formatAmount(locked) })} />
        <Legend color="bg-slate-300" label={t("money.unfunded", { amount: formatAmount(unfunded) })} />
      </div>

      <p className="mt-3 text-xs text-slate-500">
        {mode === "demo" ? (
          t("money.demoNote")
        ) : (
          <>
            {t("money.verify")}{" "}
            <a
              className="font-medium text-brand-800 underline"
              href={`${EXPLORER_URL}/contract/${ESCROW_CONTRACT_ID}`}
              target="_blank"
              rel="noreferrer noopener"
            >
              {t("money.explorer")}
            </a>
          </>
        )}
      </p>
    </section>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}
