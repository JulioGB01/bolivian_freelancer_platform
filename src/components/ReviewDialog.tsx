"use client";

// Review → sign → receipt, for every money action (pattern used by DeFi apps).
import { useEffect, useState } from "react";
import { EXPLORER_URL } from "@/lib/config";
import { getEscrow } from "@/lib/escrow";
import { errorMessage } from "@/lib/errors";
import { useT, type MsgKey } from "@/lib/i18n";
import { useMode } from "@/lib/mode";

export interface ReviewRow {
  label: string;
  value: string;
  strong?: boolean;
}

export interface ReviewRequest {
  title: MsgKey;
  rows: ReviewRow[];
  what: MsgKey;
  action: () => Promise<void>;
  /** Called after a successful action, when the dialog closes. */
  onDone?: () => void;
}

type Phase = "review" | "pending" | "done" | "error";

export default function ReviewDialog({ request, onClose }: { request: ReviewRequest | null; onClose: () => void }) {
  const { t } = useT();
  const mode = useMode();
  const [phase, setPhase] = useState<Phase>("review");
  const [err, setErr] = useState("");
  const [txHash, setTxHash] = useState<string | null>(null);

  useEffect(() => {
    if (!request) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && phase !== "pending") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  if (!request) return null;

  function close() {
    if (phase === "done") request?.onDone?.();
    setPhase("review");
    setErr("");
    setTxHash(null);
    onClose();
  }

  async function confirm() {
    if (!request) return;
    setPhase("pending");
    setErr("");
    try {
      await request.action();
      setTxHash(getEscrow().lastTxHash ?? null);
      setPhase("done");
    } catch (e) {
      setErr(errorMessage(e, t));
      setPhase("error");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-3 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true">
      <div className="w-full max-w-md overflow-hidden bg-white text-left text-ink shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
          <h2 className="text-xl font-semibold tracking-tight">{phase === "done" ? t("rv.done") : t(request.title)}</h2>
          {phase !== "pending" && (
            <button type="button" onClick={close} aria-label={t("rv.close")} className="grid h-8 w-8 place-items-center bg-paper text-ink/60 hover:text-ink">
              ×
            </button>
          )}
        </div>

        {phase === "done" ? (
          <div className="px-6 py-6">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center bg-lime text-lg font-bold text-ink">✓</span>
              <p className="font-semibold">{t(request.title)}</p>
            </div>
            <div className="mt-5 bg-paper p-4 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink/50">{t("rv.receipt")}</p>
              <dl className="mt-2 space-y-1.5">
                {request.rows.map((r) => (
                  <div key={r.label} className="flex justify-between gap-4">
                    <dt className="text-ink/60">{r.label}</dt>
                    <dd className={r.strong ? "font-semibold" : ""}>{r.value}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 border-t border-line pt-3 text-xs">
                {mode === "testnet" && txHash ? (
                  <a className="font-semibold text-brand-700 underline underline-offset-4" href={`${EXPLORER_URL}/tx/${txHash}`} target="_blank" rel="noreferrer noopener">
                    {t("rv.viewTx")}
                  </a>
                ) : (
                  <span className="text-ink/50">{t("rv.demoReceipt")}</span>
                )}
              </p>
            </div>
            <button type="button" onClick={close} className="mt-5 w-full bg-ink py-3 text-sm font-semibold text-white hover:bg-black">
              {t("rv.close")}
            </button>
          </div>
        ) : (
          <div className="px-6 py-6">
            <dl className="divide-y divide-line border border-line">
              {request.rows.map((r) => (
                <div key={r.label} className="flex justify-between gap-4 px-4 py-3 text-sm">
                  <dt className="text-ink/60">{r.label}</dt>
                  <dd className={`text-right ${r.strong ? "font-semibold" : ""}`}>{r.value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-sm leading-relaxed text-ink/70">{t(request.what)}</p>
            {phase === "error" && (
              <p className="mt-3 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {err}
              </p>
            )}
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={close}
                disabled={phase === "pending"}
                className="flex-1 border border-line py-3 text-sm font-semibold text-ink/70 hover:border-ink disabled:opacity-40"
              >
                {t("rv.cancel")}
              </button>
              <button
                type="button"
                onClick={confirm}
                disabled={phase === "pending"}
                className="flex-[1.4] bg-ink py-3 text-sm font-semibold text-white hover:bg-black disabled:opacity-60"
              >
                {phase === "pending"
                  ? mode === "testnet"
                    ? t("rv.signing")
                    : t("rv.processing")
                  : mode === "testnet"
                    ? t("rv.sign")
                    : t("rv.confirm")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
