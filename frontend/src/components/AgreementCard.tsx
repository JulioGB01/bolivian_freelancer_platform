"use client";

import Link from "next/link";
import { lockedAmountOf } from "@/lib/escrow";
import { formatAmount, formatDate } from "@/lib/format";
import { actionsNeeded, roleIn } from "@/lib/status";
import type { Agreement } from "@/lib/types";

export default function AgreementCard({
  agreement,
  viewer,
  now,
}: {
  agreement: Agreement;
  viewer: string;
  now: number;
}) {
  const role = roleIn(agreement, viewer);
  const total = agreement.milestones.reduce((s, m) => s + m.amount, 0);
  const locked = lockedAmountOf(agreement);
  const done = agreement.milestones.filter((m) => ["Released", "Resolved", "Refunded"].includes(m.status)).length;
  const todo = actionsNeeded(agreement, role, now);

  return (
    <Link
      href={`/agreements/${agreement.id}`}
      className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-300 hover:shadow"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-semibold text-slate-900">{agreement.title}</span>
        <div className="flex items-center gap-2">
          {todo > 0 && (
            <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-xs font-semibold text-white">
              {todo} action{todo === 1 ? "" : "s"} for you
            </span>
          )}
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              role === "freelancer" ? "bg-emerald-50 text-emerald-700" : role === "client" ? "bg-sky-50 text-sky-700" : "bg-slate-100 text-slate-600"
            }`}
          >
            you are the {role}
          </span>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
        <span className="font-medium text-emerald-700">🔒 {formatAmount(locked)} USDC locked</span>
        <span>of {formatAmount(total)} USDC</span>
        <span>
          {done}/{agreement.milestones.length} milestone{agreement.milestones.length === 1 ? "" : "s"} done
        </span>
        <span className="ml-auto text-xs">#{agreement.id} · {formatDate(agreement.createdAt)}</span>
      </div>
    </Link>
  );
}
