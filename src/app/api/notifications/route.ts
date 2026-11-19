import { NextResponse } from "next/server";

export interface NotificationSubscription {
  agreementId: number;
  email?: string;
  whatsapp?: string;
  updatedAt: string;
}

const globalSubs = globalThis as unknown as {
  __bfeNotificationSubs?: Map<number, NotificationSubscription>;
};
const subs = globalSubs.__bfeNotificationSubs ?? new Map<number, NotificationSubscription>();
globalSubs.__bfeNotificationSubs = subs;

export function getSubscription(agreementId: number): NotificationSubscription | null {
  return subs.get(agreementId) ?? null;
}

export async function dispatchAlert(params: {
  agreementId: number;
  subject: string;
  message: string;
}): Promise<{ emailSent: boolean; whatsappSent: boolean }> {
  const sub = subs.get(params.agreementId);
  if (!sub) return { emailSent: false, whatsappSent: false };

  let emailSent = false;
  let whatsappSent = false;

  const resendKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail = process.env.NOTIFICATION_FROM_EMAIL?.trim() || "Bolivia Escrow <alerts@boliviaescrow.bo>";
  if (sub.email && resendKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [sub.email],
          subject: params.subject,
          text: params.message,
        }),
      });
      emailSent = res.ok;
    } catch {
      emailSent = false;
    }
  }

  const twSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const twToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const twFrom = process.env.TWILIO_WHATSAPP_FROM?.trim();
  if (sub.whatsapp && twSid && twToken && twFrom) {
    try {
      const to = sub.whatsapp.startsWith("whatsapp:") ? sub.whatsapp : `whatsapp:${sub.whatsapp}`;
      const form = new URLSearchParams({ From: twFrom, To: to, Body: `${params.subject}\n\n${params.message}` });
      const auth = Buffer.from(`${twSid}:${twToken}`).toString("base64");
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twSid}/Messages.json`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${auth}`,
        },
        body: form.toString(),
      });
      whatsappSent = res.ok;
    } catch {
      whatsappSent = false;
    }
  }

  return { emailSent, whatsappSent };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const agreementId = Number(searchParams.get("agreementId"));
  const channels = {
    emailConfigured: Boolean(process.env.RESEND_API_KEY?.trim()),
    whatsappConfigured: Boolean(
      process.env.TWILIO_ACCOUNT_SID?.trim() &&
        process.env.TWILIO_AUTH_TOKEN?.trim() &&
        process.env.TWILIO_WHATSAPP_FROM?.trim(),
    ),
  };

  if (!Number.isInteger(agreementId)) {
    return NextResponse.json({ channels, subscription: null });
  }
  return NextResponse.json({ channels, subscription: subs.get(agreementId) ?? null });
}

export async function POST(req: Request) {
  let body: { agreementId?: number; email?: string; whatsapp?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON inválido." }, { status: 400 });
  }

  if (!Number.isInteger(body.agreementId)) {
    return NextResponse.json({ error: "Se requiere 'agreementId' entero." }, { status: 400 });
  }

  const email = body.email?.trim() || undefined;
  const whatsapp = body.whatsapp?.trim() || undefined;
  if (!email && !whatsapp) {
    return NextResponse.json({ error: "Ingresa al menos un correo o número de WhatsApp." }, { status: 400 });
  }

  const record: NotificationSubscription = {
    agreementId: body.agreementId!,
    email,
    whatsapp,
    updatedAt: new Date().toISOString(),
  };
  subs.set(record.agreementId, record);

  return NextResponse.json({ subscription: record }, { status: 201 });
}
