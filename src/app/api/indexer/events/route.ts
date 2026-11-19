import { NextResponse } from "next/server";
import { fetchEscrowEvents } from "@/lib/indexer";
import { dispatchAlert } from "@/app/api/notifications/route";

const globalCursor = globalThis as unknown as {
  __bfeLastIndexedLedger?: number;
  __bfeSeenEventIds?: Set<string>;
};
const seenIds = globalCursor.__bfeSeenEventIds ?? new Set<string>();
globalCursor.__bfeSeenEventIds = seenIds;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawId = searchParams.get("agreementId");
  const rawStart = searchParams.get("startLedger");
  const agreementId = rawId !== null && rawId !== "" ? Number(rawId) : undefined;
  const startLedger = rawStart !== null && rawStart !== "" ? Number(rawStart) : undefined;

  try {
    const data = await fetchEscrowEvents({
      agreementId: Number.isInteger(agreementId) ? agreementId : undefined,
      startLedger: Number.isInteger(startLedger) ? startLedger : undefined,
    });
    return NextResponse.json(data);
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "No se pudieron indexar los eventos de Soroban." },
      { status: 502 },
    );
  }
}

export async function POST(req: Request) {
  const cronSecret = process.env.INDEXER_CRON_SECRET?.trim();
  if (cronSecret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }
  }

  try {
    const { latestLedger, events } = await fetchEscrowEvents({
      startLedger: globalCursor.__bfeLastIndexedLedger,
    });

    let dispatched = 0;
    for (const ev of events) {
      if (seenIds.has(ev.id)) continue;
      seenIds.add(ev.id);
      if (ev.agreementId !== null) {
        const idxLabel = ev.milestoneIndex !== null ? ` (Hito #${ev.milestoneIndex + 1})` : "";
        const res = await dispatchAlert({
          agreementId: ev.agreementId,
          subject: `Bolivia Escrow — Acuerdo #${ev.agreementId}${idxLabel}: ${ev.topic.toUpperCase()}`,
          message: `Se registró el evento '${ev.topic}' en Stellar (tx: ${ev.txHash}). Revisa tu acuerdo en /app/acuerdo/${ev.agreementId}.`,
        });
        if (res.emailSent || res.whatsappSent) dispatched++;
      }
    }

    globalCursor.__bfeLastIndexedLedger = latestLedger;
    return NextResponse.json({ latestLedger, processed: events.length, dispatched });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error en el ciclo del indexador." },
      { status: 502 },
    );
  }
}
