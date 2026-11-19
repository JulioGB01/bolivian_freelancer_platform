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

export default function MoneyLocked({ agreement, source }: { agreement: Agreement; source?: "demo" | "testnet" }) {
  const { t } = useT();
  const visitorMode = useMode();
  const mode = source ?? visitorMode;
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
    <section className="hero-grid relative overflow-hidden bg-ink p-7 text-white sm:p-9">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
            <span aria-hidden>🔒 </span>
            {t("money.lockedNow")}
          </p>
          <p className="mt-2 text-6xl font-semibold tracking-[-0.04em] sm:text-7xl">
            {formatAmount(locked)} <span className="text-lg font-medium text-lime">USDC</span>
          </p>
        </div>
        <p className="text-sm text-white/60">{t("money.of", { amount: formatAmount(total) })}</p>
      </div>

      <div
        className="mt-6 flex h-2 overflow-hidden bg-white/15"
        role="img"
        aria-label={`${t("money.settled", { amount: formatAmount(settled) })}, ${t("money.locked", { amount: formatAmount(locked) })}, ${t("money.unfunded", { amount: formatAmount(unfunded) })}`}
      >
        <div className="bg-white/50" style={{ width: `${pct(settled)}%` }} />
        <div className="bg-lime" style={{ width: `${pct(locked)}%` }} />
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-white/70">
        <Legend color="bg-white/50" label={t("money.settled", { amount: formatAmount(settled) })} />
        <Legend color="bg-lime" label={t("money.locked", { amount: formatAmount(locked) })} />
        <Legend color="bg-white/15" label={t("money.unfunded", { amount: formatAmount(unfunded) })} />
      </div>

      <p className="mt-5 border-t border-white/10 pt-4 text-xs text-white/50">
        {mode === "demo" ? (
          t("money.demoNote")
        ) : (
          <>
            {t("money.verify")}{" "}
            <a
              className="font-semibold text-lime underline decoration-lime/40 underline-offset-4"
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
      <span className={`h-2 w-2 ${color}`} />
      {label}
    </span>
  );
}
