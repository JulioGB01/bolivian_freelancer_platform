// Verifiable evidence utilities.
// Computes deterministic SHA-256 hashes (Web Crypto API) so deliverables,
// files, and dispute bundles fit inside the Soroban contract's 512-byte
// MAX_EVIDENCE_LEN limit while remaining cryptographically verifiable off-chain.

export const MAX_ONCHAIN_EVIDENCE_BYTES = 512;

export interface ParsedEvidence {
  raw: string;
  sha256: string | null;
  url: string | null;
  note: string | null;
}

export interface EvidenceRecord {
  id: string;
  agreementId: number;
  milestoneIndex: number;
  author: string;
  kind: "deliverable" | "dispute_message";
  fileName?: string;
  fileSizeBytes?: number;
  mimeType?: string;
  url?: string;
  note: string;
  sha256: string;
  createdAt: string;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Computes a lowercase hex SHA-256 digest for arbitrary text or binary bytes. */
export async function computeSha256Hex(input: string | Uint8Array | ArrayBuffer): Promise<string> {
  const bytes =
    typeof input === "string"
      ? new TextEncoder().encode(input)
      : input instanceof ArrayBuffer
        ? new Uint8Array(input)
        : input;
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", copy);
  return bytesToHex(new Uint8Array(digest));
}

/**
 * Formats an on-chain evidence string guaranteed to stay <= 512 UTF-8 bytes.
 * Format: `sha256:<hex>` optionally followed by `|url:<url>` and/or `|note:<note>`.
 */
export function formatOnChainEvidence(params: {
  sha256: string;
  url?: string;
  note?: string;
}): string {
  const parts: string[] = [`sha256:${params.sha256.trim()}`];
  const cleanUrl = params.url?.trim();
  if (cleanUrl) parts.push(`url:${cleanUrl}`);
  const cleanNote = params.note?.trim();
  if (cleanNote) parts.push(`note:${cleanNote}`);

  let result = parts.join("|");
  const encoder = new TextEncoder();
  while (encoder.encode(result).length > MAX_ONCHAIN_EVIDENCE_BYTES && result.length > 71) {
    result = result.slice(0, -1);
  }
  return result;
}

/** Parses an on-chain evidence string back into its hash, URL, and note parts. */
export function parseOnChainEvidence(raw: string): ParsedEvidence {
  const trimmed = raw.trim();
  if (!trimmed) return { raw, sha256: null, url: null, note: null };

  const shaMatch = trimmed.match(/(?:^|\|)sha256:([a-f0-9]{64})(?:\||$)/i);
  const urlMatch = trimmed.match(/(?:^|\|)url:([^|]+)/);
  const noteMatch = trimmed.match(/(?:^|\|)note:([^|]+)/);

  return {
    raw,
    sha256: shaMatch ? shaMatch[1].toLowerCase() : null,
    url: urlMatch ? urlMatch[1] : !shaMatch && /^https?:\/\//i.test(trimmed) ? trimmed : null,
    note: noteMatch ? noteMatch[1] : !shaMatch && !/^https?:\/\//i.test(trimmed) ? trimmed : null,
  };
}
