// Testnet account helpers: balances, test XLM (Friendbot), the USDC trustline and the on-chain test-USDC faucet.
import { Asset, BASE_FEE, Horizon, Operation, TransactionBuilder, rpc } from "@stellar/stellar-sdk";
import { Client as FaucetClient } from "@/contracts/faucet";
import { FAUCET_CONTRACT_ID, HORIZON_URL, NETWORK_PASSPHRASE, STELLAR_RPC_URL, USDC_CODE, USDC_ISSUER } from "./config";
import { parseAmount } from "./format";
import { signWithWallet } from "./wallet";

export interface AccountBalances {
  /** False when the account has never been funded on testnet. */
  exists: boolean;
  /** XLM in whole units (for network fees). */
  xlm: number;
  /** Test USDC in the 7-decimal integer unit, or null when the trustline is missing. */
  usdc: number | null;
}

/** Reads XLM and test-USDC balances from Horizon. */
export async function getAccountBalances(address: string): Promise<AccountBalances> {
  const res = await fetch(`${HORIZON_URL}/accounts/${address}`);
  if (res.status === 404) return { exists: false, xlm: 0, usdc: null };
  if (!res.ok) throw new Error(`Horizon ${res.status}`);
  const data = (await res.json()) as {
    balances: { asset_type: string; asset_code?: string; asset_issuer?: string; balance: string }[];
  };
  let xlm = 0;
  let usdc: number | null = null;
  for (const b of data.balances) {
    if (b.asset_type === "native") xlm = Number(b.balance);
    else if (b.asset_code === USDC_CODE && b.asset_issuer === USDC_ISSUER) usdc = parseAmount(b.balance);
  }
  return { exists: true, xlm, usdc };
}

/** Funds a new testnet account with test XLM through Friendbot. */
export async function fundWithFriendbot(address: string): Promise<void> {
  const server = new rpc.Server(STELLAR_RPC_URL);
  await server.fundAddress(address);
}

/** Adds the test-USDC trustline to the connected account (one wallet signature). */
export async function addUsdcTrustline(address: string): Promise<string> {
  const horizon = new Horizon.Server(HORIZON_URL);
  const account = await horizon.loadAccount(address);
  const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(Operation.changeTrust({ asset: new Asset(USDC_CODE, USDC_ISSUER) }))
    .setTimeout(120)
    .build();
  const { signedTxXdr } = await signWithWallet(tx.toXDR(), { networkPassphrase: NETWORK_PASSPHRASE, address });
  const signed = TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE);
  const result = await horizon.submitTransaction(signed);
  return result.hash;
}

/** Gets 1,000 test USDC from the on-chain faucet contract (contracts/faucet). The user signs. */
export async function requestTestUsdc(address: string): Promise<void> {
  const faucet = new FaucetClient({
    contractId: FAUCET_CONTRACT_ID,
    networkPassphrase: NETWORK_PASSPHRASE,
    rpcUrl: STELLAR_RPC_URL,
    publicKey: address,
    signTransaction: (xdr, opts) => signWithWallet(xdr, { ...opts, address }),
  });
  try {
    const sent = await (await faucet.drip({ to: address })).signAndSend();
    sent.result.unwrap();
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    // The faucet's only error (#1) means this account already got test USDC in the last 24 hours.
    if (/Error\(Contract, #1\)|TooSoon/.test(m)) throw new Error("FaucetTooSoon");
    throw e;
  }
}
