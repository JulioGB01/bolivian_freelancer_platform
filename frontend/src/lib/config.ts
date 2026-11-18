// Environment configuration. In demo mode the app runs a fully client-side
// mock of the Soroban contract; in real mode it reads the testnet values below.
// Values must come from deployments/testnet.json and official Stellar docs,
// never typed from memory (AGENTS.md rule 1).

export const DEMO_MODE = (process.env.NEXT_PUBLIC_DEMO_MODE ?? "true") === "true";

export const STELLAR_NETWORK = process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? "testnet";
export const STELLAR_RPC_URL = process.env.NEXT_PUBLIC_STELLAR_RPC_URL ?? "";
export const NETWORK_PASSPHRASE = process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE ?? "";
export const ESCROW_CONTRACT_ID = process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ID ?? "";
export const USDC_CONTRACT_ID = process.env.NEXT_PUBLIC_USDC_CONTRACT_ID ?? "";
export const EXPLORER_URL =
  process.env.NEXT_PUBLIC_EXPLORER_URL ?? "https://stellar.expert/explorer/testnet";
