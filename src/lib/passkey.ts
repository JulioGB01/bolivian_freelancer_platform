// WebAuthn Passkey onboarding for non-crypto clients.
// Allows a client to create/unlock a Stellar keypair using device biometrics
// (TouchID / FaceID / Windows Hello) without installing Freighter or buying XLM.
// Paired with `/api/stellar/sponsor` (Fee-Bump transactions), the client never
// needs to manage seed phrases or native XLM gas.

import { Keypair, Transaction } from "@stellar/stellar-sdk";
import { NETWORK_PASSPHRASE } from "./config";

const PASSKEY_STORE_KEY = "bfe.passkey.account";

export interface PasskeyAccount {
  credentialId: string;
  publicKey: string;
  /** Secret key stored locally for Testnet/MVP; production uses smart-wallet WebAuthn verifiers on Soroban. */
  secretKey: string;
  label: string;
  createdAt: string;
}

export function isWebAuthnSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.PublicKeyCredential !== "undefined" &&
    typeof navigator.credentials !== "undefined"
  );
}

export function getSavedPasskeyAccount(): PasskeyAccount | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PASSKEY_STORE_KEY);
    return raw ? (JSON.parse(raw) as PasskeyAccount) : null;
  } catch {
    return null;
  }
}

export function clearPasskeyAccount(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(PASSKEY_STORE_KEY);
  } catch {
    /* ignore */
  }
}

function toBase64Url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function randomBytes(len: number): Uint8Array<ArrayBuffer> {
  const arr = new Uint8Array(new ArrayBuffer(len));
  globalThis.crypto.getRandomValues(arr);
  return arr;
}

/** Creates a WebAuthn Passkey and provisions an associated Stellar keypair. */
export async function createPasskeyWallet(label = "Cliente Bolivia Escrow"): Promise<PasskeyAccount> {
  if (!isWebAuthnSupported()) {
    throw new Error("Tu navegador no soporta Passkeys (WebAuthn).");
  }

  const userId = randomBytes(16);
  const challenge = randomBytes(32);

  const credential = (await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: "Bolivia Escrow" },
      user: {
        id: userId,
        name: label,
        displayName: label,
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 }, // ES256
        { type: "public-key", alg: -257 }, // RS256
      ],
      authenticatorSelection: {
        userVerification: "preferred",
        residentKey: "preferred",
      },
      timeout: 60_000,
    },
  })) as PublicKeyCredential | null;

  if (!credential) {
    throw new Error("No se completó el registro con Passkey.");
  }

  const kp = Keypair.random();
  const account: PasskeyAccount = {
    credentialId: toBase64Url(credential.rawId),
    publicKey: kp.publicKey(),
    secretKey: kp.secret(),
    label,
    createdAt: new Date().toISOString(),
  };

  window.localStorage.setItem(PASSKEY_STORE_KEY, JSON.stringify(account));
  return account;
}

/** Verifies user presence via WebAuthn before unlocking the Passkey account. */
export async function unlockPasskeyWallet(): Promise<PasskeyAccount> {
  const existing = getSavedPasskeyAccount();
  if (!existing) {
    return createPasskeyWallet();
  }
  if (!isWebAuthnSupported()) {
    throw new Error("Tu navegador no soporta Passkeys (WebAuthn).");
  }

  const challenge = randomBytes(32);
  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge,
      userVerification: "preferred",
      timeout: 60_000,
    },
  });

  if (!assertion) {
    throw new Error("Autenticación con Passkey cancelada.");
  }
  return existing;
}

/** Signs a Stellar transaction XDR with the Passkey-protected keypair. */
export function signXdrWithPasskey(xdr: string, account: PasskeyAccount): string {
  const kp = Keypair.fromSecret(account.secretKey);
  const tx = new Transaction(xdr, NETWORK_PASSPHRASE);
  tx.sign(kp);
  return tx.toXDR();
}

/** Submits a signed inner transaction XDR to the Fee-Bump gas sponsorship endpoint. */
export async function submitSponsoredTransaction(signedInnerXdr: string): Promise<{
  hash: string;
  sponsored: boolean;
}> {
  const res = await fetch("/api/stellar/sponsor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ xdr: signedInnerXdr }),
  });
  const data = (await res.json()) as { hash?: string; sponsored?: boolean; error?: string };
  if (!res.ok || !data.hash) {
    throw new Error(data.error || "No se pudo patrocinar el gas de la transacción.");
  }
  return { hash: data.hash, sponsored: Boolean(data.sponsored) };
}
