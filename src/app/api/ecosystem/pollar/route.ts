import { NextResponse } from "next/server";

const FALLBACK_BOB_RATE = 11.2;

export async function GET() {
  const apiUrl = process.env.POLLAR_API_URL?.trim();
  const apiKey = process.env.POLLAR_API_KEY?.trim();

  if (!apiUrl || !apiKey) {
    return NextResponse.json({
      configured: false,
      live: false,
      rateBobPerUsdc: FALLBACK_BOB_RATE,
      source: "reference",
    });
  }

  try {
    const res = await fetch(`${apiUrl.replace(/\/$/, "")}/rates/usdc-bob`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json({
        configured: true,
        live: false,
        rateBobPerUsdc: FALLBACK_BOB_RATE,
        source: "fallback",
      });
    }
    const data = (await res.json()) as { rate?: number; bobPerUsdc?: number };
    const rate = Number(data.rate ?? data.bobPerUsdc ?? FALLBACK_BOB_RATE);
    return NextResponse.json({
      configured: true,
      live: true,
      rateBobPerUsdc: Number.isFinite(rate) && rate > 0 ? rate : FALLBACK_BOB_RATE,
      source: "pollar-api",
    });
  } catch {
    return NextResponse.json({
      configured: true,
      live: false,
      rateBobPerUsdc: FALLBACK_BOB_RATE,
      source: "fallback",
    });
  }
}

export async function POST(req: Request) {
  const apiUrl = process.env.POLLAR_API_URL?.trim();
  const apiKey = process.env.POLLAR_API_KEY?.trim();

  if (!apiUrl || !apiKey) {
    return NextResponse.json(
      {
        configured: false,
        error: "La API de Pollar no está configurada (falta POLLAR_API_URL / POLLAR_API_KEY).",
      },
      { status: 503 },
    );
  }

  let body: {
    agreementId?: number;
    freelancerAddress?: string;
    amountUsdc?: number;
    bankAccountOrQr?: string;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON inválido." }, { status: 400 });
  }

  if (!body.freelancerAddress || !body.amountUsdc || body.amountUsdc <= 0) {
    return NextResponse.json({ error: "Se requiere 'freelancerAddress' y 'amountUsdc' > 0." }, { status: 400 });
  }

  try {
    const res = await fetch(`${apiUrl.replace(/\/$/, "")}/payouts/qr-simple`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error al iniciar retiro en Pollar." },
      { status: 502 },
    );
  }
}
