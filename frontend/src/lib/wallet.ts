// Wallet connection. In demo mode this simulates a Stellar wallet by selecting
// one of three demo identities; in real mode this file is replaced by the
// Stellar Wallets Kit wrapper (docs/04_FRONTEND_SPEC.md, `lib/wallet.ts`).
import { DEMO_MODE } from "./config";

export type Role = "freelancer" | "client" | "arbiter" | "viewer";

export interface ConnectedWallet {
  address: string;
  role: Role;
  label: string;
}

export const DEMO_IDENTITIES: ConnectedWallet[] = [
  { address: "demo-freelancer", role: "freelancer", label: "Freelancer (demo)" },
  { address: "demo-client", role: "client", label: "Client (demo)" },
  { address: "demo-arbiter", role: "arbiter", label: "Arbiter (demo)" },
];

const KEY = "bfe.connected";

export function getConnectedWallet(): ConnectedWallet | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ConnectedWallet;
  } catch {
    return null;
  }
}

export function connect(identity: ConnectedWallet): ConnectedWallet {
  window.localStorage.setItem(KEY, JSON.stringify(identity));
  return identity;
}

export function disconnect(): void {
  window.localStorage.removeItem(KEY);
}

/** Whether a wallet connection is required for the current mode. */
export function walletRequired(): boolean {
  return !DEMO_MODE;
}
