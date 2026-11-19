// Map contract errors (contracts/escrow/src/errors.rs) and wallet errors to plain messages.
import type { MsgKey, TFn } from "./i18n";

const CONTRACT_ERRORS: Record<number, MsgKey> = {
  1: "err.AlreadyInitialized",
  2: "err.NotInitialized",
  3: "err.AgreementNotFound",
  4: "err.MilestoneNotFound",
  5: "err.InvalidStatus",
  6: "err.InvalidAmount",
  7: "err.InvalidBps",
  8: "err.InvalidMilestoneCount",
  9: "err.SameParty",
  10: "err.ReviewWindowOpen",
  11: "err.ReviewWindowClosed",
};

const NAMED: Record<string, MsgKey> = {
  AlreadyInitialized: "err.AlreadyInitialized",
  NotInitialized: "err.NotInitialized",
  AgreementNotFound: "err.AgreementNotFound",
  MilestoneNotFound: "err.MilestoneNotFound",
  InvalidStatus: "err.InvalidStatus",
  InvalidAmount: "err.InvalidAmount",
  InvalidBps: "err.InvalidBps",
  InvalidMilestoneCount: "err.InvalidMilestoneCount",
  SameParty: "err.SameParty",
  ReviewWindowOpen: "err.ReviewWindowOpen",
  ReviewWindowClosed: "err.ReviewWindowClosed",
  InsufficientBalance: "err.InsufficientBalance",
  NoTrustline: "err.NoTrustline",
  NoAccount: "err.NoAccount",
  NoWallet: "err.NoWallet",
};

function messageOf(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  if (err && typeof err === "object" && "message" in err) return String((err as { message: unknown }).message);
  return "";
}

/** Plain, translated message for any error thrown by the escrow API or the wallet. */
export function errorMessage(err: unknown, t: TFn): string {
  const msg = messageOf(err);
  if (NAMED[msg]) return t(NAMED[msg]);
  // Soroban contract error, e.g. "HostError: Error(Contract, #5)".
  const m = msg.match(/Error\(Contract, #(\d+)\)/);
  if (m && CONTRACT_ERRORS[Number(m[1])]) return t(CONTRACT_ERRORS[Number(m[1])]);
  // Token errors seen when the payer has no trustline or not enough balance.
  if (/trustline entry is missing/i.test(msg)) return t("err.NoTrustline");
  if (/balance is not sufficient|resulting balance is not within/i.test(msg)) return t("err.InsufficientBalance");
  if (/Account not found|account.*does not exist/i.test(msg)) return t("err.NoAccount");
  if (/reject|declin|denied|cancel/i.test(msg)) return t("err.Rejected");
  return msg ? msg.slice(0, 220) : t("err.generic");
}
