import { describe, expect, it } from "vitest";
import {
  computeSha256Hex,
  formatOnChainEvidence,
  MAX_ONCHAIN_EVIDENCE_BYTES,
  parseOnChainEvidence,
} from "../evidence";

describe("evidence utilities", () => {
  it("computes deterministic SHA-256 hex digests", async () => {
    const a = await computeSha256Hex("https://github.com/papichulo369963/bolivian_freelancer_platform");
    const b = await computeSha256Hex("https://github.com/papichulo369963/bolivian_freelancer_platform");
    expect(a).toHaveLength(64);
    expect(a).toBe(b);
  });

  it("formats and parses on-chain evidence within 512 bytes", async () => {
    const sha = await computeSha256Hex("deliverable-v1");
    const formatted = formatOnChainEvidence({
      sha256: sha,
      url: "https://example.com/deliverable.zip",
      note: "Final build",
    });
    expect(new TextEncoder().encode(formatted).length).toBeLessThanOrEqual(MAX_ONCHAIN_EVIDENCE_BYTES);

    const parsed = parseOnChainEvidence(formatted);
    expect(parsed.sha256).toBe(sha);
    expect(parsed.url).toBe("https://example.com/deliverable.zip");
    expect(parsed.note).toBe("Final build");
  });

  it("truncates long notes without exceeding MAX_ONCHAIN_EVIDENCE_BYTES", async () => {
    const sha = await computeSha256Hex("big-note");
    const formatted = formatOnChainEvidence({
      sha256: sha,
      note: "x".repeat(700),
    });
    expect(new TextEncoder().encode(formatted).length).toBeLessThanOrEqual(MAX_ONCHAIN_EVIDENCE_BYTES);
    expect(parseOnChainEvidence(formatted).sha256).toBe(sha);
  });
});
