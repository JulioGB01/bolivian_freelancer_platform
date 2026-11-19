import { describe, expect, it } from "vitest";
import {
  DEMO_FEE_BPS,
  DEMO_TOP_UP_AMOUNT,
  EscrowError,
  MAX_REVIEW_WINDOW_SECS,
  MIN_REVIEW_WINDOW_SECS,
  MockEscrow,
} from "../escrow";
import { isValidAgreementId } from "../escrowReal";

describe("MockEscrow", () => {
  it("uses 150 bps (1.5%) default fee and snapshots fee + arbiter at creation", async () => {
    const escrow = new MockEscrow();
    const cfg = await escrow.getConfig();
    expect(cfg.feeBps).toBe(150);
    expect(DEMO_FEE_BPS).toBe(150);

    const id = await escrow.createAgreement({
      freelancer: "demo-freelancer",
      client: "demo-client",
      title: "Landing page",
      milestones: [{ title: "Design", amount: 1_000_000_000 }], // 100 USDC
      reviewWindowSecs: 86400,
    });

    const ag = await escrow.getAgreement(id);
    expect(ag).not.toBeNull();
    expect(ag!.feeBps).toBe(150);
    expect(ag!.arbiter).toBe("demo-arbiter");
    expect(ag!.feeRecipient).toBe("demo-fee-recipient");
  });

  it("enforces review window bounds (1h - 30d)", async () => {
    const escrow = new MockEscrow();
    await expect(
      escrow.createAgreement({
        freelancer: "demo-freelancer",
        client: "demo-client",
        title: "Too short",
        milestones: [{ title: "M1", amount: 100_000_000 }],
        reviewWindowSecs: MIN_REVIEW_WINDOW_SECS - 1,
      }),
    ).rejects.toThrow(EscrowError);

    await expect(
      escrow.createAgreement({
        freelancer: "demo-freelancer",
        client: "demo-client",
        title: "Too long",
        milestones: [{ title: "M1", amount: 100_000_000 }],
        reviewWindowSecs: MAX_REVIEW_WINDOW_SECS + 1,
      }),
    ).rejects.toThrow(EscrowError);
  });

  it("runs fund -> submit -> approve with 1.5% fee", async () => {
    const escrow = new MockEscrow();
    const id = await escrow.createAgreement({
      freelancer: "demo-freelancer",
      client: "demo-client",
      title: "App MVP",
      milestones: [{ title: "Sprint 1", amount: 1_000_000_000 }], // 100 USDC
      reviewWindowSecs: 3600,
    });

    await escrow.fundMilestone(id, 0);
    expect(await escrow.balanceOf("demo-client")).toBe(0);

    await escrow.submitMilestone(id, 0, "https://github.com/org/repo");
    await escrow.approveMilestone(id, 0);

    // Freelancer started with 100 USDC + 98.50 net = 198.50 USDC
    expect(await escrow.balanceOf("demo-freelancer")).toBe(1_000_000_000 + 985_000_000);
    expect(await escrow.balanceOf("demo-fee-recipient")).toBe(15_000_000);
  });

  it("allows client to dispute a Funded milestone (anti-ghosting) and validates resolveDispute bps", async () => {
    const escrow = new MockEscrow();
    const id = await escrow.createAgreement({
      freelancer: "demo-freelancer",
      client: "demo-client",
      title: "Ghosted work",
      milestones: [{ title: "M1", amount: 500_000_000 }], // 50 USDC
      reviewWindowSecs: 3600,
    });

    await escrow.fundMilestone(id, 0);
    // Dispute directly from Funded (no submission!)
    await escrow.disputeMilestone(id, 0, "Freelancer stopped responding");

    // Reject negative and >10000 bps
    await expect(escrow.resolveDispute(id, 0, -100)).rejects.toThrow("InvalidBps");
    await expect(escrow.resolveDispute(id, 0, 10001)).rejects.toThrow("InvalidBps");
    await expect(escrow.resolveDispute(id, 0, 50.5)).rejects.toThrow("InvalidBps");

    // Resolve 40% freelancer / 60% client
    await escrow.resolveDispute(id, 0, 4000);
    const ag = await escrow.getAgreement(id);
    expect(ag!.milestones[0].status).toBe("Resolved");
    expect(ag!.milestones[0].resolvedFreelancerBps).toBe(4000);

    // 40% of 50 USDC = 20 USDC; 1.5% fee = 0.30 USDC (3_000_000); net = 19.70 USDC
    expect(await escrow.balanceOf("demo-freelancer")).toBe(1_000_000_000 + 197_000_000);
    expect(await escrow.balanceOf("demo-fee-recipient")).toBe(3_000_000);
    // Client had 50 USDC left + 30 USDC returned = 80 USDC
    expect(await escrow.balanceOf("demo-client")).toBe(800_000_000);
  });

  it("supports topping up demo-client for milestones > 100 USDC", async () => {
    const escrow = new MockEscrow();
    const id = await escrow.createAgreement({
      freelancer: "demo-freelancer",
      client: "demo-client",
      title: "Enterprise build",
      milestones: [{ title: "Full delivery", amount: 5_000_000_000 }], // 500 USDC
      reviewWindowSecs: 86400,
    });

    await expect(escrow.fundMilestone(id, 0)).rejects.toThrow("InsufficientBalance");
    escrow.topUp("demo-client", DEMO_TOP_UP_AMOUNT); // +1,000 USDC
    await escrow.fundMilestone(id, 0);
    expect(await escrow.balanceOf("demo-client")).toBe(6_000_000_000);
  });
});

describe("isValidAgreementId", () => {
  it("accepts non-negative integers and rejects NaN, negative, or fractional IDs", () => {
    expect(isValidAgreementId(0)).toBe(true);
    expect(isValidAgreementId(42)).toBe(true);
    expect(isValidAgreementId(-1)).toBe(false);
    expect(isValidAgreementId(1.5)).toBe(false);
    expect(isValidAgreementId(Number.NaN)).toBe(false);
    expect(isValidAgreementId(Number.POSITIVE_INFINITY)).toBe(false);
  });
});
