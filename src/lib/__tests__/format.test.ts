import { describe, expect, it } from "vitest";
import { formatAmount, formatCountdown, parseAmount, shortAddress } from "../format";

describe("formatAmount", () => {
  it("formats integer smallest units with at least 2 decimals", () => {
    expect(formatAmount(0)).toBe("0.00");
    expect(formatAmount(1_000_000_000)).toBe("100.00");
    expect(formatAmount(1_505_000_000)).toBe("150.50");
    expect(formatAmount(12_345_678_900)).toBe("1,234.56789");
  });
});

describe("parseAmount", () => {
  it("parses valid positive decimal strings into 7-decimal units", () => {
    expect(parseAmount("100")).toBe(1_000_000_000);
    expect(parseAmount("150.50")).toBe(1_505_000_000);
    expect(parseAmount("  42.1234567  ")).toBe(421_234_567);
    expect(parseAmount(".5")).toBe(5_000_000);
    expect(parseAmount("10.")).toBe(100_000_000);
    expect(parseAmount("0.123456789")).toBe(1_234_567); // truncates beyond 7 decimals
    expect(parseAmount("0")).toBe(0);
  });

  it("rejects scientific notation, Infinity, negative values, and malformed decimals cleanly", () => {
    expect(parseAmount("")).toBe(0);
    expect(parseAmount("   ")).toBe(0);
    expect(parseAmount("1e5")).toBe(0);
    expect(parseAmount("1E-2")).toBe(0);
    expect(parseAmount("Infinity")).toBe(0);
    expect(parseAmount("-Infinity")).toBe(0);
    expect(parseAmount("NaN")).toBe(0);
    expect(parseAmount("-0.5")).toBe(0);
    expect(parseAmount("-1.5")).toBe(0);
    expect(parseAmount("-100")).toBe(0);
    expect(parseAmount("+50")).toBe(0);
    expect(parseAmount("1.2.3")).toBe(0);
    expect(parseAmount("12abc")).toBe(0);
    expect(parseAmount("99999999999999999999")).toBe(0); // overflow guard
  });
});

describe("formatCountdown", () => {
  it("formats remaining time accurately", () => {
    expect(formatCountdown(10_000, 6_340, "es")).toBe("1h 1m");
    expect(formatCountdown(1_000, 915, "en")).toBe("1m 25s");
  });

  it("localizes expired countdown in Spanish and English", () => {
    expect(formatCountdown(100, 100, "es")).toBe("vencido");
    expect(formatCountdown(100, 200, "es")).toBe("vencido");
    expect(formatCountdown(100, 100, "en")).toBe("expired");
    expect(formatCountdown(100, 200, "en")).toBe("expired");
    // Default is Spanish
    expect(formatCountdown(100, 200)).toBe("vencido");
  });
});

describe("shortAddress", () => {
  it("keeps short demo addresses intact and shortens Stellar keys", () => {
    expect(shortAddress("demo-client")).toBe("demo-client");
    expect(shortAddress("GBAKHIEBPVK2AUODWXKDED4P27WNVTEIZZ647PGCJRFSQVZKU4KB3EGS")).toBe("GBAKHI…3EGS");
  });
});
