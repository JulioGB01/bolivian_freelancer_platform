"use client";

// Activity timeline of one agreement: on testnet read from the contract's events.
import { useEffect, useState } from "react";
import { EXPLORER_URL } from "@/lib/config";
import { ESCROW_CHANGED, escrowFor, getEscrow } from "@/lib/escrow";
import { formatDate } from "@/lib/format";
import { useT, type MsgKey } from "@/lib/i18n";
import { useMode } from "@/lib/mode";
import type { ActivityItem } from "@/lib/types";

const DOT: Record<ActivityItem["kind"], string> = {
  created: "bg-ink",
  funded: "bg-lime",
  submitted: "bg-bo-yellow",
  approved: "bg-brand-600",
  claimed: "bg-brand-600",
  disputed: "bg-bo-red",
  resolved: "bg-ink",
  refunded: "bg-ink/30",
};

export default function Timeline({ id, source }: { id: number; source?: "demo" | "testnet" }) {
  const { t, lang } = useT();
  const visitorMode = useMode();
  const mode = source ?? visitorMode;
  const [items, setItems] = useState<ActivityItem[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = () =>
      (source ? escrowFor(source) : getEscrow())
        .activity(id)
        .then((a) => {
          setItems(a);
          setError("");
        })
        .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
    void load();
    window.addEventListener(ESCROW_CHANGED, load);
    return () => window.removeEventListener(ESCROW_CHANGED, load);
  }, [id, source]);

  const locale = lang === "es" ? "es-BO" : "en-US";

  return (
    <div className=" border border-line bg-white p-6">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!items && !error && <p className="text-sm text-ink/50">{t("ag.loading")}</p>}
      {items && items.length === 0 && <p className="text-sm text-ink/50">{t("act.empty")}</p>}
      {items && items.length > 0 && (
        <ol className="relative space-y-5 border-l border-line pl-6">
          {items.map((it, i) => (
            <li key={i} className="relative">
              <span className={`absolute -left-[1.95rem] top-1 h-3 w-3 ring-4 ring-white ${DOT[it.kind]}`} aria-hidden />
              <p className="text-sm font-semibold">{t(`act.${it.kind}` as MsgKey, { n: (it.index ?? 0) + 1 })}</p>
              <p className="mt-0.5 text-xs text-ink/50">
                {formatDate(it.at, locale)}
                {it.txHash && (
                  <>
                    {" · "}
                    <a className="text-brand-700 underline underline-offset-2" href={`${EXPLORER_URL}/tx/${it.txHash}`} target="_blank" rel="noreferrer noopener">
                      tx {it.txHash.slice(0, 8)}… ↗
                    </a>
                  </>
                )}
              </p>
            </li>
          ))}
        </ol>
      )}
      <p className="mt-5 border-t border-line pt-3 text-xs text-ink/40">{mode === "testnet" ? t("act.noteTestnet") : t("act.noteDemo")}</p>
    </div>
  );
}
