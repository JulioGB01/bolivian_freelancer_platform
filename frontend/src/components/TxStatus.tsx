"use client";

import { EXPLORER_URL } from "@/lib/config";
import { useT } from "@/lib/i18n";
import { useMode } from "@/lib/mode";

// Pending / success / error indicator for a transaction (docs/04_FRONTEND_SPEC.md).
export type TxPhase = "idle" | "pending" | "success" | "error";

export default function TxStatus({
  phase,
  error,
  txHash,
}: {
  phase: TxPhase;
  error?: string;
  txHash?: string | null;
}) {
  const { t } = useT();
  const mode = useMode();
  if (phase === "idle") return null;
  if (phase === "pending") {
    return (
      <span role="status" className="ml-2 inline-flex items-center gap-1 text-xs text-amber-700">
        <span className="h-2 w-2 animate-ping rounded-full bg-amber-500" />
        {mode === "demo" ? t("tx.processing") : t("tx.signing")}
      </span>
    );
  }
  if (phase === "success") {
    return (
      <span role="status" className="ml-2 text-xs font-medium text-brand-700">
        {t("tx.done")}
        {txHash && (
          <>
            {" · "}
            <a className="underline" href={`${EXPLORER_URL}/tx/${txHash}`} target="_blank" rel="noreferrer noopener">
              {t("tx.view")}
            </a>
          </>
        )}
      </span>
    );
  }
  return (
    <span role="alert" className="ml-2 text-xs text-red-600">
      {error ?? t("tx.failed")}
    </span>
  );
}
