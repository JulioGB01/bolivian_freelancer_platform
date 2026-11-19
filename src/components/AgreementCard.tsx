"use client";

import Link from "next/link";
import { lockedAmountOf } from "@/lib/escrow";
import { formatAmount, formatDate } from "@/lib/format";
import { useT, type MsgKey } from "@/lib/i18n";
import { actionsNeeded, roleIn } from "@/lib/status";
import type { Agreement } from "@/lib/types";

export default function AgreementCard({ agreement, viewer, now }: { agreement: Agreement; viewer: string; now: number }) {
  const { t, lang } = useT();
  const role = roleIn(agreement, viewer);
  const total = agreement.milestones.reduce((s, m) => s + m.amount, 0);
  const locked = lockedAmountOf(agreement);
  const done = agreement.milestones.filter((m) => ["Released", "Resolved", "Refunded"].includes(m.status)).length;
  const todo = actionsNeeded(agreement, role, now);

  return (
    <Link
      href={`/app/acuerdo/${agreement.id}`}
      className="block border border-line bg-white p-4 shadow-sm transition hover:border-ink hover:shadow-lg"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-semibold text-slate-900">{agreement.title}</span>
        <div className="flex items-center gap-2">
          {todo > 0 && (
            <span className=" bg-ink px-2.5 py-0.5 text-xs font-semibold text-lime">
              {t("card.actions", { n: todo })}
            </span>
          )}
          <span
            className={` px-2 py-0.5 text-xs font-medium ${
              role === "freelancer" ? "bg-brand-50 text-brand-700" : role === "client" ? "bg-amber-50 text-amber-800" : "bg-slate-100 text-slate-600"
            }`}
          >
            {t("card.youAre", { role: t(`role.${role}` as MsgKey).toLowerCase() })}
          </span>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
        <span className="font-medium text-brand-700">🔒 {t("card.locked", { amount: formatAmount(locked) })}</span>
        <span>{t("card.of", { amount: formatAmount(total) })}</span>
        <span>{t("card.done", { done, total: agreement.milestones.length })}</span>
        <span className="ml-auto text-xs">
          #{agreement.id} · {formatDate(agreement.createdAt, lang === "es" ? "es-BO" : "en-US")}
        </span>
      </div>
    </Link>
  );
}
