import { NextResponse } from "next/server";

export async function GET() {
  const apiUrl = process.env.VAQUITA_API_URL?.trim();
  const apiKey = process.env.VAQUITA_API_KEY?.trim();

  if (!apiUrl || !apiKey) {
    return NextResponse.json({
      configured: false,
      live: false,
      asset: "USDC",
      apyPct: null,
    });
  }

  try {
    const res = await fetch(`${apiUrl.replace(/\/$/, "")}/pools/usdc`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json({ configured: true, live: false, asset: "USDC", apyPct: null });
    }
    const data = (await res.json()) as { apyPct?: number; apy?: number };
    return NextResponse.json({
      configured: true,
      live: true,
      asset: "USDC",
      apyPct: data.apyPct ?? data.apy ?? null,
    });
  } catch {
    return NextResponse.json({ configured: true, live: false, asset: "USDC", apyPct: null });
  }
}

export async function POST(req: Request) {
  const apiUrl = process.env.VAQUITA_API_URL?.trim();
  const apiKey = process.env.VAQUITA_API_KEY?.trim();

  if (!apiUrl || !apiKey) {
    return NextResponse.json(
      {
        configured: false,
        error: "La API de Vaquita no está configurada (falta VAQUITA_API_URL / VAQUITA_API_KEY).",
      },
      { status: 503 },
    );
  }

  let body: { freelancerAddress?: string; amountUsdc?: number };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON inválido." }, { status: 400 });
  }

  if (!body.freelancerAddress || !body.amountUsdc || body.amountUsdc <= 0) {
    return NextResponse.json({ error: "Se requiere 'freelancerAddress' y 'amountUsdc' > 0." }, { status: 400 });
  }

  try {
    const res = await fetch(`${apiUrl.replace(/\/$/, "")}/deposits`, {
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
      { error: e instanceof Error ? e.message : "Error al conectar con Vaquita." },
      { status: 502 },
    );
  }
}
