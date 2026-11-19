// Lightweight Soroban contract event indexer for Bolivia Escrow.
// Polls Soroban RPC `getEvents` for ESCROW_CONTRACT_ID so the backend can
// serve fast timelines and dispatch email/WhatsApp alerts on state transitions
// (especially `Submitted`, where the client's review countdown begins).

import { rpc, scValToNative, xdr } from "@stellar/stellar-sdk";
import { ESCROW_CONTRACT_ID, STELLAR_RPC_URL } from "./config";

export type IndexedEventTopic =
  | "created"
  | "funded"
  | "submitted"
  | "approved"
  | "claimed"
  | "disputed"
  | "resolved"
  | "refunded";

export interface IndexedEscrowEvent {
  id: string;
  ledger: number;
  ledgerClosedAt: string;
  txHash: string;
  topic: IndexedEventTopic;
  agreementId: number | null;
  milestoneIndex: number | null;
  payload: unknown;
}

const KNOWN_TOPICS = new Set<string>([
  "created",
  "funded",
  "submitted",
  "approved",
  "claimed",
  "disputed",
  "resolved",
  "refunded",
]);

function decodeScVal(base64: string): unknown {
  try {
    return scValToNative(xdr.ScVal.fromXDR(base64, "base64"));
  } catch {
    return null;
  }
}

/** Fetches recent contract events from Soroban RPC starting at `startLedger` (defaults to ~1h ago). */
export async function fetchEscrowEvents(opts?: {
  startLedger?: number;
  agreementId?: number;
  limit?: number;
}): Promise<{ latestLedger: number; events: IndexedEscrowEvent[] }> {
  const server = new rpc.Server(STELLAR_RPC_URL);
  const latest = await server.getLatestLedger();
  // ~720 ledgers ≈ 1 hour at ~5s/ledger.
  const startLedger = opts?.startLedger ?? Math.max(1, latest.sequence - 720);

  const res = await server.getEvents({
    startLedger,
    filters: [{ type: "contract", contractIds: [ESCROW_CONTRACT_ID] }],
    limit: opts?.limit ?? 100,
  });

  const events: IndexedEscrowEvent[] = [];
  for (const ev of res.events) {
    const rawTopics = ev.topic.map((t) => decodeScVal(t.toXDR("base64")));
    const topicName = typeof rawTopics[0] === "string" ? rawTopics[0].toLowerCase() : "";
    if (!KNOWN_TOPICS.has(topicName)) continue;

    const payload = decodeScVal(ev.value.toXDR("base64"));
    const agreementId =
      typeof rawTopics[1] === "number" || typeof rawTopics[1] === "bigint"
        ? Number(rawTopics[1])
        : payload && typeof payload === "object" && "agreement_id" in payload
          ? Number((payload as { agreement_id: unknown }).agreement_id)
          : null;

    if (opts?.agreementId !== undefined && agreementId !== opts.agreementId) continue;

    const milestoneIndex =
      typeof rawTopics[2] === "number" || typeof rawTopics[2] === "bigint"
        ? Number(rawTopics[2])
        : payload && typeof payload === "object" && "index" in payload
          ? Number((payload as { index: unknown }).index)
          : null;

    events.push({
      id: ev.id,
      ledger: ev.ledger,
      ledgerClosedAt: ev.ledgerClosedAt,
      txHash: ev.txHash,
      topic: topicName as IndexedEventTopic,
      agreementId,
      milestoneIndex,
      payload,
    });
  }

  return { latestLedger: latest.sequence, events };
}
