// Amount, address and date formatting helpers.

export const USDC_DECIMALS = 7;
export const BPS_DENOMINATOR = 10_000;

/** Convert an integer smallest-unit amount to a decimal string (e.g. "150.50"). */
export function formatAmount(units: number): string {
  const divisor = 10 ** USDC_DECIMALS;
  const whole = Math.trunc(units / divisor);
  const frac = Math.abs(units % divisor).toString().padStart(USDC_DECIMALS, "0");
  // Trim trailing zeros for a compact display, keep at least 2 decimals.
  const trimmed = frac.replace(/0+$/, "");
  const decimals = trimmed.length >= 2 ? trimmed : trimmed.padEnd(2, "0");
  return `${whole.toLocaleString("en-US")}.${decimals}`;
}

/** Parse a decimal string entered by the user into an integer smallest-unit amount. */
export function parseAmount(input: string): number {
  const clean = input.trim();
  if (clean === "" || Number.isNaN(Number(clean))) return 0;
  const [whole, frac = ""] = clean.split(".");
  const w = BigInt(whole || "0");
  const f = BigInt((frac + "0000000").slice(0, USDC_DECIMALS) || "0");
  return Number(w * BigInt(10 ** USDC_DECIMALS) + f);
}

/** Shorten a Stellar/demo address for display: GABC…XYZ. */
export function shortAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/** Show a unix timestamp (seconds) as a short local date/time. */
export function formatDate(secs: number): string {
  if (!secs) return "—";
  return new Date(secs * 1000).toLocaleString();
}

/** Human countdown like "2h 14m" or "expired". */
export function formatCountdown(deadlineSecs: number, nowSecs: number): string {
  const diff = deadlineSecs - nowSecs;
  if (diff <= 0) return "expired";
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${diff % 60}s`;
}

/** Human duration like "1 hour", "3 days" or "60 seconds". */
export function formatDuration(secs: number): string {
  const units: [number, string][] = [
    [86400, "day"],
    [3600, "hour"],
    [60, "minute"],
  ];
  for (const [size, name] of units) {
    if (secs >= size && secs % size === 0) {
      const n = secs / size;
      return `${n} ${name}${n === 1 ? "" : "s"}`;
    }
  }
  return `${secs} seconds`;
}
