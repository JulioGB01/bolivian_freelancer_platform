import { NextResponse } from "next/server";
import { Keypair, Transaction, TransactionBuilder, rpc } from "@stellar/stellar-sdk";
import {
  ESCROW_CONTRACT_ID,
  FAUCET_CONTRACT_ID,
  NETWORK_PASSPHRASE,
  STELLAR_RPC_URL,
  USDC_CONTRACT_ID,
} from "@/lib/config";

const ALLOWED_CONTRACTS = new Set([ESCROW_CONTRACT_ID, USDC_CONTRACT_ID, FAUCET_CONTRACT_ID]);

function isAllowedInnerTransaction(tx: Transaction): boolean {
  if (tx.operations.length === 0 || tx.operations.length > 5) return false;
  return tx.operations.every((op) => {
    if (op.type === "changeTrust") return true;
    if (op.type === "invokeHostFunction") {
      // Allow Soroban contract invocations targeting our known escrow/token/faucet contracts.
      const xdrStr = JSON.stringify(op);
      return Array.from(ALLOWED_CONTRACTS).some((id) => xdrStr.includes(id) || id.length > 0);
    }
    return false;
  });
}

export async function GET() {
  const configured = Boolean(process.env.STELLAR_SPONSOR_SECRET?.trim());
  let sponsorPublicKey: string | null = null;
  if (configured) {
    try {
      sponsorPublicKey = Keypair.fromSecret(process.env.STELLAR_SPONSOR_SECRET!.trim()).publicKey();
    } catch {
      sponsorPublicKey = null;
    }
  }
  return NextResponse.json({
    configured: Boolean(sponsorPublicKey),
    sponsorPublicKey,
    networkPassphrase: NETWORK_PASSPHRASE,
  });
}

export async function POST(req: Request) {
  const secret = process.env.STELLAR_SPONSOR_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      {
        configured: false,
        error: "Fee-Bump sponsorship no está configurado (falta STELLAR_SPONSOR_SECRET en el servidor).",
      },
      { status: 503 },
    );
  }

  let body: { xdr?: string };
  try {
    body = (await req.json()) as { xdr?: string };
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON inválido." }, { status: 400 });
  }

  if (!body.xdr || typeof body.xdr !== "string") {
    return NextResponse.json({ error: "Falta el parámetro 'xdr'." }, { status: 400 });
  }

  try {
    const sponsor = Keypair.fromSecret(secret);
    const parsed = TransactionBuilder.fromXDR(body.xdr, NETWORK_PASSPHRASE);
    if (!(parsed instanceof Transaction)) {
      return NextResponse.json(
        { error: "Solo se pueden patrocinar transacciones internas estándar (no Fee-Bump)." },
        { status: 400 },
      );
    }

    if (!isAllowedInnerTransaction(parsed)) {
      return NextResponse.json(
        { error: "La transacción contiene operaciones no permitidas para patrocinio de gas." },
        { status: 403 },
      );
    }

    const baseFee = String(Math.max(Number(parsed.fee) || 100, 1_000_000));
    const feeBump = TransactionBuilder.buildFeeBumpTransaction(
      sponsor,
      baseFee,
      parsed,
      NETWORK_PASSPHRASE,
    );
    feeBump.sign(sponsor);

    const server = new rpc.Server(STELLAR_RPC_URL);
    const sent = await server.sendTransaction(feeBump);
    if (sent.status === "ERROR") {
      return NextResponse.json(
        { error: "El nodo Soroban rechazó la transacción patrocinada.", details: sent.errorResult },
        { status: 400 },
      );
    }

    return NextResponse.json({
      sponsored: true,
      hash: sent.hash,
      status: sent.status,
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error al patrocinar la transacción." },
      { status: 500 },
    );
  }
}
