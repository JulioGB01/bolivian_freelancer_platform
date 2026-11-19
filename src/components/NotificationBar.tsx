"use client";

import { useEffect, useState } from "react";

interface ChannelStatus {
  emailConfigured: boolean;
  whatsappConfigured: boolean;
}

export default function NotificationBar({ agreementId }: { agreementId: number }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [saved, setSaved] = useState<{ email?: string; whatsapp?: string } | null>(null);
  const [channels, setChannels] = useState<ChannelStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch(`/api/notifications?agreementId=${agreementId}`)
      .then((r) => r.json())
      .then((d: { channels?: ChannelStatus; subscription?: { email?: string; whatsapp?: string } | null }) => {
        if (d.channels) setChannels(d.channels);
        if (d.subscription) {
          setSaved(d.subscription);
          setEmail(d.subscription.email ?? "");
          setWhatsapp(d.subscription.whatsapp ?? "");
        }
      })
      .catch(() => {});
  }, [agreementId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agreementId,
          email: email.trim() || undefined,
          whatsapp: whatsapp.trim() || undefined,
        }),
      });
      const data = (await res.json()) as { subscription?: { email?: string; whatsapp?: string }; error?: string };
      if (!res.ok) {
        setMsg(data.error || "No se pudo guardar la suscripción.");
      } else if (data.subscription) {
        setSaved(data.subscription);
        setMsg("Alertas activadas para entregas, vencimientos y disputas.");
        setOpen(false);
      }
    } catch {
      setMsg("Error de red al guardar alertas.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border border-line bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="inline-block h-2.5 w-2.5 bg-brand-600" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-ink">
              Alertas automáticas (Email / WhatsApp)
            </p>
            <p className="text-xs text-ink/55">
              {saved
                ? `Activo: ${[saved.email, saved.whatsapp].filter(Boolean).join(" · ")}`
                : "Recibe aviso cuando el freelancer entregue un hito o inicie la ventana de revisión."}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="border border-ink bg-white px-3.5 py-1.5 text-xs font-semibold text-ink hover:bg-ink hover:text-white"
        >
          {open ? "Cerrar" : saved ? "Editar alertas" : "Activar alertas"}
        </button>
      </div>

      {msg && !open && <p className="mt-2 text-xs font-medium text-brand-700">{msg}</p>}

      {open && (
        <form onSubmit={onSubmit} className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-[1fr_1fr_auto]">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="correo@ejemplo.com"
            aria-label="Correo electrónico para alertas"
            className="border border-line bg-paper px-3 py-2 text-xs text-ink focus:border-ink focus:outline-none"
          />
          <input
            type="tel"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="+591 7XXXXXXX (WhatsApp)"
            aria-label="WhatsApp para alertas"
            className="border border-line bg-paper px-3 py-2 text-xs text-ink focus:border-ink focus:outline-none"
          />
          <button
            type="submit"
            disabled={busy || (!email.trim() && !whatsapp.trim())}
            className="bg-ink px-4 py-2 text-xs font-semibold text-white hover:bg-black disabled:opacity-50"
          >
            {busy ? "Guardando..." : "Guardar"}
          </button>
          {channels && (!channels.emailConfigured || !channels.whatsappConfigured) && (
            <p className="text-[11px] text-ink/50 sm:col-span-3">
              Estado del servidor: Email {channels.emailConfigured ? "✓" : "(pendiente RESEND_API_KEY)"} · WhatsApp{" "}
              {channels.whatsappConfigured ? "✓" : "(pendiente TWILIO_*)"}.
            </p>
          )}
          {msg && <p className="text-xs text-red-600 sm:col-span-3">{msg}</p>}
        </form>
      )}
    </div>
  );
}
