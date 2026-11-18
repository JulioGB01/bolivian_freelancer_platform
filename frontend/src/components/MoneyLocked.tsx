"use client";

// The "see the money" panel: how much of the agreement is locked in the contract right now,
// how much was already paid out, and how much the client has not locked yet. In real mode it
// links to the block explorer so either party can verify the funds independently.
import { DEMO_MODE, EXPLORER_URL, ESCROW_CONTRACT_ID } from "@/lib/config";
import { lockedAmountOf } from "@/lib/escrow";
import { formatAmount } from "@/lib/format";
import type { Agreement } from "@/lib/types";

export default function MoneyLocked({ agreement }: { agreement: Agreement }) {
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
    <section className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-emerald-900">
            <span aria-hidden>🔒 </span>Locked in escrow right now
          </p>
          <p className="text-3xl font-bold text-emerald-900">
            {formatAmount(locked)} <span className="text-base font-medium text-emerald-700">USDC</span>
          </p>
        </div>
        <p className="text-sm text-slate-600">
          of {formatAmount(total)} USDC agreed
        </p>
      </div>

      <div
        className="mt-4 flex h-3 overflow-hidden rounded-full bg-slate-200"
        role="img"
        aria-label={`${formatAmount(settled)} settled, ${formatAmount(locked)} locked, ${formatAmount(unfunded)} not funded yet`}
      >
        <div className="bg-indigo-500" style={{ width: `${pct(settled)}%` }} />
        <div className="bg-emerald-500" style={{ width: `${pct(locked)}%` }} />
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
        <Legend color="bg-indigo-500" label={`Settled ${formatAmount(settled)}`} />
        <Legend color="bg-emerald-500" label={`Locked ${formatAmount(locked)}`} />
        <Legend color="bg-slate-300" label={`Not funded yet ${formatAmount(unfunded)}`} />
      </div>

      <p className="mt-3 text-xs text-slate-500">
        {DEMO_MODE ? (
          <>Demo mode: amounts are simulated in your browser. On testnet this panel links to the contract on the block explorer.</>
        ) : (
          <>
            Verify it yourself:{" "}
            <a
              className="font-medium text-emerald-800 underline"
              href={`${EXPLORER_URL}/contract/${ESCROW_CONTRACT_ID}`}
              target="_blank"
              rel="noreferrer noopener"
            >
              see the contract on the block explorer ↗
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
