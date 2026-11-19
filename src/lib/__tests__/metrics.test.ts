import { describe, expect, it } from "vitest";
import { freelancerStats, levelFor, protocolStats, TRUSTED_MIN_VOLUME } from "../metrics";
import type { Agreement } from "../types";

function makeAgreement(partial: Partial<Agreement>): Agreement {
  return {
    id: 0,
    freelancer: "F1",
    client: "C1",
    title: "Test",
    reviewWindowSecs: 86400,
    feeBps: 150, // 1.5%
    milestones: [],
    createdAt: 1_700_000_000,
    ...partial,
  };
}

describe("levelFor (Sybil resistance)", () => {
  it("requires both >= 5 paid milestones AND >= $100 USDC volume for trusted", () => {
    expect(levelFor(0, 0)).toBe("new");
    expect(levelFor(1, 500_000_000)).toBe("active");
    expect(levelFor(4, 5_000_000_000)).toBe("active");
    // 5 x 1-stroop wash-trading must NOT grant trusted!
    expect(levelFor(5, 5)).toBe("active");
    expect(levelFor(10, TRUSTED_MIN_VOLUME - 1)).toBe("active");
    // Meets both thresholds
    expect(levelFor(5, TRUSTED_MIN_VOLUME)).toBe("trusted");
  });
});

describe("protocolStats & freelancerStats with Resolved milestones", () => {
  it("credits Resolved milestones using resolvedFreelancerBps and 1.5% fee", () => {
    const a = makeAgreement({
      milestones: [
        {
          title: "M1 Released",
          amount: 1_000_000_000, // 100 USDC -> 1.50 fee -> 98.50 net (985_000_000)
          status: "Released",
          evidence: "https://example.com/1",
          submittedAt: 100,
          disputeReason: "",
        },
        {
          title: "M2 Resolved 80% freelancer",
          amount: 1_000_000_000, // 80 USDC to freelancer -> 1.20 fee -> 78.80 net (788_000_000)
          status: "Resolved",
          evidence: "https://example.com/2",
          submittedAt: 200,
          disputeReason: "partial",
          resolvedFreelancerBps: 8000,
        },
        {
          title: "M3 Resolved 0% freelancer",
          amount: 500_000_000,
          status: "Resolved",
          evidence: "",
          submittedAt: 0,
          disputeReason: "ghosted",
          resolvedFreelancerBps: 0,
        },
      ],
    });

    const pStats = protocolStats([a]);
    expect(pStats.agreements).toBe(1);
    expect(pStats.locked).toBe(0);
    expect(pStats.milestonesPaid).toBe(2); // M1 + M2 (M3 had 0 bps)
    expect(pStats.paid).toBe(985_000_000 + 788_000_000);

    const fStats = freelancerStats([a], "F1");
    expect(fStats.milestonesPaid).toBe(2);
    expect(fStats.earned).toBe(985_000_000 + 788_000_000);
    expect(fStats.disputes).toBe(2);
    expect(fStats.level).toBe("active");
  });

  it("prevents 1-stroop Sybil gaming in freelancerStats", () => {
    const sybilAgreement = makeAgreement({
      milestones: Array.from({ length: 6 }, (_, i) => ({
        title: `Tiny ${i}`,
        amount: 10, // 0.0000010 USDC
        status: "Released" as const,
        evidence: "https://example.com",
        submittedAt: 100,
        disputeReason: "",
      })),
    });

    const stats = freelancerStats([sybilAgreement], "F1");
    expect(stats.milestonesPaid).toBe(6);
    expect(stats.earned).toBe(60);
    expect(stats.level).toBe("active"); // NOT trusted
  });
});
