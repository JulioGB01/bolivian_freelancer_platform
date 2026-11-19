// Test-USDC faucet (TESTNET ONLY).
// Sends 1,000 test USDC from the asset's issuer to an account that already has the trustline.
// The issuer secret is read from the server-side env var FAUCET_SECRET (set in Vercel, never
// committed). Without it the route answers 503 and the rest of the app still works.
import { Asset, BASE_FEE, Horizon, Keypair, Operation, StrKey, TransactionBuilder } from "@stellar/stellar-sdk";
import { HORIZON_URL, NETWORK_PASSPHRASE, USDC_CODE, USDC_ISSUER } from "@/lib/config";

const AMOUNT = "1000";

export async function POST(req: Request) {
  const secret = process.env.FAUCET_SECRET?.trim();
  if (!secret) return Response.json({ error: "FaucetNotConfigured" }, { status: 503 });
  if (NETWORK_PASSPHRASE !== "Test SDF Network ; September 2015") {
    return Response.json({ error: "TestnetOnly" }, { status: 403 });
  }

  const { address } = (await req.json().catch(() => ({}))) as { address?: string };
  if (!address || !StrKey.isValidEd25519PublicKey(address)) {
    return Response.json({ error: "InvalidAddress" }, { status: 400 });
  }

  try {
    const issuer = Keypair.fromSecret(secret);
    if (issuer.publicKey() !== USDC_ISSUER) {
      return Response.json({ error: "FaucetMisconfigured" }, { status: 500 });
    }
    const horizon = new Horizon.Server(HORIZON_URL);
    const account = await horizon.loadAccount(issuer.publicKey());
    const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: NETWORK_PASSPHRASE })
      .addOperation(Operation.payment({ destination: address, asset: new Asset(USDC_CODE, USDC_ISSUER), amount: AMOUNT }))
      .setTimeout(60)
      .build();
    tx.sign(issuer);
    const res = await horizon.submitTransaction(tx);
    return Response.json({ ok: true, hash: res.hash });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const noTrust = /op_no_trust/i.test(JSON.stringify((e as { response?: { data?: unknown } })?.response?.data ?? ""));
    return Response.json({ error: noTrust ? "NoTrustline" : msg.slice(0, 200) }, { status: 400 });
  }
}
