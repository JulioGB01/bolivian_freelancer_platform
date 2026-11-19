import { NextResponse } from "next/server";
import { createHash, randomUUID } from "crypto";
import type { EvidenceRecord } from "@/lib/evidence";

// In-memory store per server instance (swap for Postgres/S3/R2 in multi-instance production).
const globalStore = globalThis as unknown as {
  __bfeEvidenceStore?: Map<string, EvidenceRecord[]>;
};
const store = globalStore.__bfeEvidenceStore ?? new Map<string, EvidenceRecord[]>();
globalStore.__bfeEvidenceStore = store;

function keyFor(agreementId: number, milestoneIndex: number): string {
  return `${agreementId}:${milestoneIndex}`;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const agreementId = Number(searchParams.get("agreementId"));
  const milestoneIndex = Number(searchParams.get("milestoneIndex"));
  if (!Number.isInteger(agreementId) || !Number.isInteger(milestoneIndex)) {
    return NextResponse.json({ error: "Se requiere 'agreementId' y 'milestoneIndex' enteros." }, { status: 400 });
  }
  const records = store.get(keyFor(agreementId, milestoneIndex)) ?? [];
  return NextResponse.json({ records });
}

export async function POST(req: Request) {
  let body: {
    agreementId?: number;
    milestoneIndex?: number;
    author?: string;
    kind?: "deliverable" | "dispute_message";
    fileName?: string;
    fileSizeBytes?: number;
    mimeType?: string;
    url?: string;
    note?: string;
    sha256?: string;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON inválido." }, { status: 400 });
  }

  if (
    !Number.isInteger(body.agreementId) ||
    !Number.isInteger(body.milestoneIndex) ||
    !body.author ||
    !body.note?.trim()
  ) {
    return NextResponse.json(
      { error: "Faltan campos requeridos: agreementId, milestoneIndex, author, note." },
      { status: 400 },
    );
  }

  const canonical = JSON.stringify({
    agreementId: body.agreementId,
    milestoneIndex: body.milestoneIndex,
    author: body.author,
    fileName: body.fileName ?? null,
    url: body.url?.trim() ?? null,
    note: body.note.trim(),
  });
  const computedSha = createHash("sha256").update(canonical).digest("hex");
  const sha256 = body.sha256 && /^[a-f0-9]{64}$/i.test(body.sha256) ? body.sha256.toLowerCase() : computedSha;

  const record: EvidenceRecord = {
    id: randomUUID(),
    agreementId: body.agreementId!,
    milestoneIndex: body.milestoneIndex!,
    author: body.author,
    kind: body.kind === "dispute_message" ? "dispute_message" : "deliverable",
    fileName: body.fileName,
    fileSizeBytes: body.fileSizeBytes,
    mimeType: body.mimeType,
    url: body.url?.trim(),
    note: body.note.trim(),
    sha256,
    createdAt: new Date().toISOString(),
  };

  const k = keyFor(record.agreementId, record.milestoneIndex);
  const existing = store.get(k) ?? [];
  existing.push(record);
  store.set(k, existing);

  return NextResponse.json({ record }, { status: 201 });
}
