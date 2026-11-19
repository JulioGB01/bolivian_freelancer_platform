// Wallet connection.
//   Demo mode:    pick one of three demo identities (no real keys).
//   Testnet mode: Stellar Wallets Kit (Freighter / Varial, xBull, Lobstr, Albedo, …).
//                 API verified against the local Creit-Tech__Stellar-Wallets-Kit repo (v2.8):
//                 StellarWalletsKit.init, authModal, signTransaction, disconnect.
import { NETWORK_PASSPHRASE } from "./config";
import { getMode } from "./mode";

export type Role = "freelancer" | "client" | "arbiter" | "viewer";

export interface ConnectedWallet {
  address: string;
  /** Demo: the identity's fixed role. Testnet: "arbiter" if it is the contract's arbiter, else "viewer". */
  role: Role;
  /** "demo" or "testnet". */
  kind: "demo" | "testnet";
}

export const DEMO_IDENTITIES: ConnectedWallet[] = [
  { address: "demo-freelancer", role: "freelancer", kind: "demo" },
  { address: "demo-client", role: "client", kind: "demo" },
  { address: "demo-arbiter", role: "arbiter", kind: "demo" },
];

const KEY = "bfe.connected";

export function getConnectedWallet(): ConnectedWallet | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const w = JSON.parse(raw) as ConnectedWallet;
    // Ignore a wallet saved under the other mode.
    return w.kind === getMode() ? w : null;
  } catch {
    return null;
  }
}

export function saveWallet(w: ConnectedWallet): ConnectedWallet {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(w));
  } catch {
    /* storage blocked: connection lasts for this page only */
  }
  return w;
}

export function forgetWallet(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

// ---------------------------------------------------------------------------
// Stellar Wallets Kit (testnet mode). Loaded lazily: it touches `window`.
// ---------------------------------------------------------------------------

type Kit = typeof import("@creit-tech/stellar-wallets-kit/sdk").StellarWalletsKit;
let kitPromise: Promise<Kit> | null = null;

async function getKit(): Promise<Kit> {
  if (!kitPromise) {
    kitPromise = (async () => {
      // Wallet modules are listed one by one: defaultModules() also pulls the MetaMask
      // adapter, which imports a package name that does not resolve in this build.
      const [{ StellarWalletsKit }, types, varial, xbull, albedo, lobstr, hana, rabet] = await Promise.all([
        import("@creit-tech/stellar-wallets-kit/sdk"),
        import("@creit-tech/stellar-wallets-kit/types"),
        import("@creit-tech/stellar-wallets-kit/modules/varial"),
        import("@creit-tech/stellar-wallets-kit/modules/xbull"),
        import("@creit-tech/stellar-wallets-kit/modules/albedo"),
        import("@creit-tech/stellar-wallets-kit/modules/lobstr"),
        import("@creit-tech/stellar-wallets-kit/modules/hana"),
        import("@creit-tech/stellar-wallets-kit/modules/rabet"),
      ]);
      const matchedNetwork =
        (Object.values(types.Networks) as string[]).includes(NETWORK_PASSPHRASE)
          ? (NETWORK_PASSPHRASE as typeof types.Networks.TESTNET)
          : types.Networks.TESTNET;
      StellarWalletsKit.init({
        modules: [
          new varial.VarialModule(),
          new xbull.xBullModule(),
          new albedo.AlbedoModule(),
          new lobstr.LobstrModule(),
          new hana.HanaModule(),
          new rabet.RabetModule(),
        ],
        network: matchedNetwork,
        theme: types.SwkAppLightTheme,
      });
      return StellarWalletsKit;
    })();
  }
  return kitPromise;
}

/** Opens the wallet picker and returns the chosen account's address. */
export async function connectRealWallet(): Promise<string> {
  const kit = await getKit();
  const { address } = await kit.authModal();
  return address;
}

export async function disconnectRealWallet(): Promise<void> {
  try {
    const kit = await getKit();
    await kit.disconnect();
  } catch {
    /* already disconnected */
  }
}

/** Signs a transaction XDR with the connected wallet (shape expected by the Stellar SDK contract client). */
export async function signWithWallet(
  xdr: string,
  opts?: { networkPassphrase?: string; address?: string },
): Promise<{ signedTxXdr: string; signerAddress?: string }> {
  const kit = await getKit();
  return kit.signTransaction(xdr, {
    networkPassphrase: opts?.networkPassphrase ?? NETWORK_PASSPHRASE,
    address: opts?.address,
  });
}
