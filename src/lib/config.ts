// Environment configuration.
//
// The app has two modes, chosen by the user at runtime (see lib/mode.ts):
//   - "demo":    an in-browser simulation of the contract, no wallet needed.
//   - "testnet": the real Soroban contract on Stellar testnet, signed with the user's wallet.
//
// Testnet values default to the deployment in deployments/testnet.json (created by
// scripts/deploy-testnet.sh). Env vars can override them, e.g. for a redeploy.

export const DEPLOYMENT = {
  network: "testnet",
  rpcUrl: "https://soroban-testnet.stellar.org/",
  horizonUrl: "https://horizon-testnet.stellar.org",
  networkPassphrase: "Test SDF Network ; September 2015",
  escrowContractId: "CAF4G4ACGMDYLPYPPGMVKTL3FTHVTKOR4OTD7YE5CQWCQ5X327E3DOUO",
  usdcContractId: "CAHWJDBZVQCKB3J5PLBQKJJJLG4BDYANSK4JTAMS2TYEKWRLQZFYDXR2",
  faucetContractId: "CB74EKQ5HJBY7NF277QJIQHI7W4QA6IOAPXW2ALSBV2GTTRE5VOXVO3O",
  usdcCode: "USDC",
  usdcIssuer: "GBAKHIEBPVK2AUODWXKDED4P27WNVTEIZZ647PGCJRFSQVZKU4KB3EGS",
} as const;

const env = (v: string | undefined, fallback: string) => (v && v.trim() ? v.trim() : fallback);

/** Mode used when the visitor has not chosen one yet. */
export const DEFAULT_MODE: "demo" | "testnet" =
  process.env.NEXT_PUBLIC_DEFAULT_MODE === "testnet" ? "testnet" : "demo";

export const STELLAR_RPC_URL = env(process.env.NEXT_PUBLIC_STELLAR_RPC_URL, DEPLOYMENT.rpcUrl);
export const HORIZON_URL = env(process.env.NEXT_PUBLIC_HORIZON_URL, DEPLOYMENT.horizonUrl);
export const NETWORK_PASSPHRASE = env(process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE, DEPLOYMENT.networkPassphrase);
export const ESCROW_CONTRACT_ID = env(process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ID, DEPLOYMENT.escrowContractId);
export const USDC_CONTRACT_ID = env(process.env.NEXT_PUBLIC_USDC_CONTRACT_ID, DEPLOYMENT.usdcContractId);
export const FAUCET_CONTRACT_ID = env(process.env.NEXT_PUBLIC_FAUCET_CONTRACT_ID, DEPLOYMENT.faucetContractId);
export const USDC_CODE = env(process.env.NEXT_PUBLIC_USDC_CODE, DEPLOYMENT.usdcCode);
export const USDC_ISSUER = env(process.env.NEXT_PUBLIC_USDC_ISSUER, DEPLOYMENT.usdcIssuer);
export const EXPLORER_URL = env(process.env.NEXT_PUBLIC_EXPLORER_URL, "https://stellar.expert/explorer/testnet");
