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

const DECIMAL_RE = /^(?:\d+(?:\.\d*)?|\.\d+)$/;

/** Parse a non-negative decimal string entered by the user into an integer smallest-unit amount. */
export function parseAmount(input: string): number {
  const clean = input.trim();
  if (!DECIMAL_RE.test(clean)) return 0;
  const [wholeRaw = "0", fracRaw = ""] = clean.split(".");
  const w = BigInt(wholeRaw || "0");
  const f = BigInt((fracRaw + "0000000").slice(0, USDC_DECIMALS) || "0");
  const total = w * BigInt(10 ** USDC_DECIMALS) + f;
  if (total > BigInt(Number.MAX_SAFE_INTEGER)) return 0;
  return Number(total);
}

/** Shorten a Stellar/demo address for display: GABC…XYZ. */
export function shortAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/** Show a unix timestamp (seconds) as a short local date/time. */
export function formatDate(secs: number, locale?: string): string {
  if (!secs) return "—";
  return new Date(secs * 1000).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" });
}

/** Human countdown like "2h 14m" or localized "vencido" / "expired". */
export function formatCountdown(deadlineSecs: number, nowSecs: number, lang: "es" | "en" = "es"): string {
  const diff = deadlineSecs - nowSecs;
  if (diff <= 0) return lang === "en" ? "expired" : "vencido";
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${diff % 60}s`;
}

