"use client";

import { DEMO_MODE } from "@/lib/config";

// Pending / success / error indicator for a transaction (docs/04_FRONTEND_SPEC.md).
export type TxPhase = "idle" | "pending" | "success" | "error";

export default function TxStatus({
  phase,
  error,
}: {
  phase: TxPhase;
  error?: string;
}) {
  if (phase === "idle") return null;
  if (phase === "pending") {
    return (
      <span role="status" className="ml-2 inline-flex items-center gap-1 text-xs text-amber-600">
        <span className="h-2 w-2 animate-ping rounded-full bg-amber-500" />
        {DEMO_MODE ? "Processing…" : "Waiting for your wallet signature…"}
      </span>
    );
  }
  if (phase === "success") {
    return (
      <span role="status" className="ml-2 text-xs font-medium text-brand-600">
        ✓ Done
      </span>
    );
  }
  return (
    <span role="alert" className="ml-2 text-xs text-red-600">
      {error ?? "Failed"}
    </span>
  );
}
