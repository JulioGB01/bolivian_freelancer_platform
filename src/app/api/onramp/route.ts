import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const amountUsd = Number(searchParams.get("amountUsd") || "100");
  const providerUrl = process.env.ONRAMP_PROVIDER_URL?.trim();
  const apiKey = process.env.ONRAMP_API_KEY?.trim();

  if (!providerUrl || !apiKey) {
    return NextResponse.json({
      configured: false,
      provider: "SEP-24 / Fiat On-Ramp (No configurado)",
      supportedMethods: ["card", "ach", "qr_simple_bob"],
      quote: {
        amountUsd: Number.isFinite(amountUsd) ? amountUsd : 100,
        estimatedUsdc: Number.isFinite(amountUsd) ? amountUsd : 100,
        feePct: 0,
      },
    });
  }

  try {
    const res = await fetch(`${providerUrl.replace(/\/$/, "")}/quote?amountUsd=${encodeURIComponent(String(amountUsd))}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json({ configured: true, error: `Error del proveedor on-ramp (${res.status}).` }, { status: 502 });
    }
    const quote = await res.json();
    return NextResponse.json({ configured: true, quote });
  } catch (e: unknown) {
    return NextResponse.json(
      { configured: true, error: e instanceof Error ? e.message : "Error al consultar el on-ramp." },
      { status: 502 },
    );
  }
}

export async function POST(req: Request) {
  const providerUrl = process.env.ONRAMP_PROVIDER_URL?.trim();
  const apiKey = process.env.ONRAMP_API_KEY?.trim();

  if (!providerUrl || !apiKey) {
    return NextResponse.json(
      {
        configured: false,
        error: "On-Ramp fiat no configurado (falta ONRAMP_PROVIDER_URL / ONRAMP_API_KEY en el servidor).",
      },
      { status: 503 },
    );
  }

  let body: { destinationAddress?: string; amountUsd?: number; method?: string; agreementId?: number };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON inválido." }, { status: 400 });
  }

  if (!body.destinationAddress || !body.amountUsd || body.amountUsd <= 0) {
    return NextResponse.json({ error: "Se requiere 'destinationAddress' y 'amountUsd' > 0." }, { status: 400 });
  }

  try {
    const res = await fetch(`${providerUrl.replace(/\/$/, "")}/sessions`, {
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
      { error: e instanceof Error ? e.message : "No se pudo crear la sesión de On-Ramp." },
      { status: 502 },
    );
  }
}
