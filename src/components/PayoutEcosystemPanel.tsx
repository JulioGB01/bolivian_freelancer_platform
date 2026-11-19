"use client";

// Pillar 2 Bolivian Ecosystem Off-Ramp & Receipt Panel:
// Shown when an agreement has Released or Resolved milestones so freelancers can:
// 1. Estimate & cash out USDC -> BOB via Pollar (QR Simple) at the parallel rate
// 2. Save USDC with yield via Vaquita
// 3. Download a verifiable Payment Proof / SIAT receipt (printable HTML or JSON)
import { useEffect, useState } from "react";
import { ESCROW_CONTRACT_ID, USDC_CONTRACT_ID } from "@/lib/config";
import { BPS_DENOMINATOR, formatAmount, USDC_DECIMALS } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { useMode } from "@/lib/mode";
import type { Agreement, Milestone } from "@/lib/types";

const DEFAULT_BOB_RATE = "11.20";

function netFreelancerUnits(m: Milestone, feeBps: number): number {
  if (m.status === "Released") {
    const fee = Math.floor((m.amount * feeBps) / BPS_DENOMINATOR);
    return m.amount - fee;
  }
  if (m.status === "Resolved") {
    const bps = m.resolvedFreelancerBps ?? 5000;
    const part = Math.floor((m.amount * bps) / BPS_DENOMINATOR);
    const fee = Math.floor((part * feeBps) / BPS_DENOMINATOR);
    return part - fee;
  }
  return 0;
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export default function PayoutEcosystemPanel({
  agreement,
  arbiter,
}: {
  agreement: Agreement;
  arbiter: string;
}) {
  const { t, lang } = useT();
  const mode = useMode();
  const [rateInput, setRateInput] = useState(DEFAULT_BOB_RATE);
  const [rateLive, setRateLive] = useState(false);
  const [vaquitaApy, setVaquitaApy] = useState<number | null>(null);
  const [taxId, setTaxId] = useState("");
  const [ecoStatus, setEcoStatus] = useState<string>("");
  const [ecoBusy, setEcoBusy] = useState<"pollar" | "vaquita" | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/ecosystem/pollar")
      .then((r) => r.json())
      .then((d: { live?: boolean; rateBobPerUsdc?: number }) => {
        if (!active) return;
        if (d.rateBobPerUsdc && Number.isFinite(d.rateBobPerUsdc)) {
          setRateInput(d.rateBobPerUsdc.toFixed(2));
        }
        setRateLive(Boolean(d.live));
      })
      .catch(() => {});

    fetch("/api/ecosystem/vaquita")
      .then((r) => r.json())
      .then((d: { live?: boolean; apyPct?: number | null }) => {
        if (!active) return;
        if (d.live && typeof d.apyPct === "number") setVaquitaApy(d.apyPct);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  const settledMilestones = agreement.milestones
    .map((m, idx) => ({ milestone: m, index: idx, netUnits: netFreelancerUnits(m, agreement.feeBps) }))
    .filter((x) => x.milestone.status === "Released" || x.milestone.status === "Resolved");

  const totalNetUnits = settledMilestones.reduce((sum, x) => sum + x.netUnits, 0);
  if (settledMilestones.length === 0 || totalNetUnits <= 0) return null;

  const parsedRate = Number(rateInput.replace(",", "."));
  const validRate = Number.isFinite(parsedRate) && parsedRate > 0 ? parsedRate : 0;
  const netUsdcFloat = totalNetUnits / 10 ** USDC_DECIMALS;
  const estimatedBob = netUsdcFloat * validRate;
  const formattedUsdc = formatAmount(totalNetUnits);
  const formattedBob = estimatedBob.toLocaleString(lang === "es" ? "es-BO" : "en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  function buildReceiptData() {
    return {
      documentType: "Bolivia Escrow — Comprobante de Pago / Respaldo SIAT",
      generatedAt: new Date().toISOString(),
      network: mode === "testnet" ? "Stellar Testnet (Soroban)" : "Browser Demo Mode",
      contractId: mode === "testnet" ? ESCROW_CONTRACT_ID : "demo-contract",
      tokenContractId: mode === "testnet" ? USDC_CONTRACT_ID : "demo-usdc",
      agreement: {
        id: agreement.id,
        title: agreement.title,
        freelancer: agreement.freelancer,
        client: agreement.client,
        pinnedArbiter: arbiter,
        pinnedFeeBps: agreement.feeBps,
        pinnedFeePct: `${(agreement.feeBps / 100).toFixed(2)}%`,
        createdAt: new Date(agreement.createdAt * 1000).toISOString(),
        verifyUrl:
          typeof window !== "undefined"
            ? `${window.location.origin}/verificar/${agreement.id}${mode === "demo" ? "?demo=1" : ""}`
            : `/verificar/${agreement.id}`,
      },
      settledMilestones: settledMilestones.map(({ milestone, index, netUnits }) => ({
        index: index + 1,
        title: milestone.title,
        status: milestone.status,
        grossUsdc: formatAmount(milestone.amount),
        netFreelancerUsdc: formatAmount(netUnits),
        evidence: milestone.evidence || null,
        resolvedFreelancerBps: milestone.resolvedFreelancerBps ?? null,
      })),
      totals: {
        netFreelancerUsdc: formattedUsdc,
        referenceRateBobPerUsdc: validRate || null,
        estimatedBob: validRate ? formattedBob : null,
        freelancerTaxId: taxId.trim() || null,
        siatClassification: "Exportación de servicios / Servicios digitales (IVA 0% sujeto a respaldo)",
      },
    };
  }

  function downloadJson() {
    const data = buildReceiptData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `comprobante-acuerdo-${agreement.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function printReceipt() {
    const data = buildReceiptData();
    const rowsHtml = data.settledMilestones
      .map(
        (m) => `<tr>
          <td>#${m.index} — ${escapeHtml(m.title)}</td>
          <td>${escapeHtml(m.status)}</td>
          <td style="text-align:right">${escapeHtml(m.grossUsdc)} USDC</td>
          <td style="text-align:right"><strong>${escapeHtml(m.netFreelancerUsdc)} USDC</strong></td>
        </tr>`,
      )
      .join("");

    const html = `<!doctype html>
<html lang="${lang}">
<head>
  <meta charset="utf-8" />
  <title>Comprobante #${agreement.id} — Bolivia Escrow</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; color: #111; max-width: 760px; margin: 32px auto; padding: 0 20px; }
    h1 { font-size: 22px; margin: 0 0 4px; }
    .meta { color: #555; font-size: 12px; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
    th, td { border-bottom: 1px solid #ddd; padding: 8px 6px; text-align: left; }
    th { font-size: 11px; text-transform: uppercase; color: #555; }
    .box { background: #f7f7f5; padding: 14px; font-size: 12px; margin: 16px 0; }
    .mono { font-family: ui-monospace, monospace; word-break: break-all; }
    .total { font-size: 16px; font-weight: 700; margin-top: 12px; }
  </style>
</head>
<body>
  <h1>Comprobante de Pago de Servicios — Bolivia Escrow</h1>
  <p class="meta">Acuerdo #${agreement.id} · ${escapeHtml(data.network)} · Generado: ${escapeHtml(data.generatedAt)}</p>
  <div class="box">
    <div><strong>Proyecto:</strong> ${escapeHtml(agreement.title)}</div>
    <div><strong>Freelancer:</strong> <span class="mono">${escapeHtml(agreement.freelancer)}</span></div>
    <div><strong>Cliente:</strong> <span class="mono">${escapeHtml(agreement.client)}</span></div>
    <div><strong>Árbitro fijado:</strong> <span class="mono">${escapeHtml(arbiter)}</span></div>
    <div><strong>Comisión fijada:</strong> ${escapeHtml(data.agreement.pinnedFeePct)}</div>
    <div><strong>Contrato Soroban:</strong> <span class="mono">${escapeHtml(data.contractId)}</span></div>
    <div><strong>Verificación pública:</strong> <span class="mono">${escapeHtml(data.agreement.verifyUrl)}</span></div>
  </div>
  <table>
    <thead><tr><th>Hito</th><th>Estado</th><th style="text-align:right">Bruto</th><th style="text-align:right">Neto Freelancer</th></tr></thead>
    <tbody>${rowsHtml}</tbody>
  </table>
  <p class="total">Total neto liberado: ${escapeHtml(formattedUsdc)} USDC${
    validRate ? ` (≈ Bs ${escapeHtml(formattedBob)} a ${validRate.toFixed(2)} BOB/USDC)` : ""
  }</p>
  <p class="meta">Documento informativo para respaldo contable, declaración SIAT (exportación de servicios) y justificación bancaria UIF. Verificable en la blockchain de Stellar.</p>
  <script>window.print();</script>
</body>
</html>`;

    const popup = window.open("", "_blank", "noopener,noreferrer");
    if (popup) {
      popup.document.write(html);
      popup.document.close();
    } else {
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `comprobante-acuerdo-${agreement.id}.html`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  return (
    <section className="border border-line bg-white p-6 shadow-sm sm:p-7">
      <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-brand-700">
        {t("eco.kicker")}
      </p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight">{t("eco.title")}</h2>
      <p className="mt-1 text-sm text-ink/60">{t("eco.lead", { usdc: formattedUsdc })}</p>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        {/* Pollar BOB QR Simple Off-Ramp */}
        <div className="hero-grid bg-ink p-5 text-white">
          <p className="text-base font-semibold">{t("eco.pollarTitle")}</p>
          <p className="mt-1 text-xs leading-relaxed text-white/70">{t("eco.pollarSub")}</p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="border border-white/15 bg-white/5 p-3">
              <p className="text-[11px] uppercase tracking-wider text-white/50">{t("eco.netUsdc")}</p>
              <p className="mt-1 text-xl font-semibold">
                {formattedUsdc} <span className="text-xs text-lime">USDC</span>
              </p>
            </div>
            <label className="block border border-white/15 bg-white/5 p-3">
              <span className="block text-[11px] uppercase tracking-wider text-white/50">{t("eco.rateLabel")}</span>
              <input
                type="text"
                inputMode="decimal"
                value={rateInput}
                onChange={(e) => setRateInput(e.target.value)}
                aria-label={t("eco.rateLabel")}
                className="mt-1 w-full border-b border-white/30 bg-transparent text-xl font-semibold text-white focus:border-lime focus:outline-none"
              />
            </label>
          </div>

          <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2 border-t border-white/15 pt-3">
            <span className="text-xs text-white/60">
              {t("eco.estBob")} · {rateLive ? "API Pollar en vivo" : "Tasa ref."}
            </span>
            <span className="text-2xl font-semibold text-lime">
              Bs {validRate ? formattedBob : "—"}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={ecoBusy !== null}
              onClick={async () => {
                setEcoBusy("pollar");
                setEcoStatus("");
                try {
                  const res = await fetch("/api/ecosystem/pollar", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      agreementId: agreement.id,
                      freelancerAddress: agreement.freelancer,
                      amountUsdc: Number(netUsdcFloat.toFixed(2)),
                    }),
                  });
                  const data = (await res.json()) as { error?: string; payoutId?: string };
                  setEcoStatus(
                    res.ok
                      ? `Retiro Pollar iniciado${data.payoutId ? ` (${data.payoutId})` : ""}.`
                      : data.error || "Pollar requiere configuración de API en el servidor.",
                  );
                } catch {
                  setEcoStatus("No se pudo conectar con /api/ecosystem/pollar.");
                } finally {
                  setEcoBusy(null);
                }
              }}
              className="flex-1 bg-lime px-4 py-2.5 text-center text-sm font-semibold text-ink hover:opacity-90 disabled:opacity-60"
            >
              {ecoBusy === "pollar" ? "Conectando..." : t("eco.pollarCta")}
            </button>
            <a
              href={`https://pollar.app/?asset=USDC&network=stellar&amount=${encodeURIComponent(netUsdcFloat.toFixed(2))}`}
              target="_blank"
              rel="noreferrer noopener"
              className="border border-white/30 px-3 py-2.5 text-xs font-semibold text-white hover:border-lime"
            >
              Abrir web ↗
            </a>
          </div>
          {ecoStatus && <p className="mt-2 text-xs text-amber-300">{ecoStatus}</p>}
          <p className="mt-2 text-[11px] leading-relaxed text-white/50">{t("eco.pollarNote")}</p>
        </div>

        {/* Right column: Vaquita Savings + SIAT / Proof Receipt */}
        <div className="flex flex-col gap-4">
          <div className="flex-1 border border-line bg-paper p-5">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-base font-semibold text-ink">{t("eco.vaquitaTitle")}</p>
              {vaquitaApy !== null && (
                <span className="bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
                  {vaquitaApy.toFixed(2)}% APY
                </span>
              )}
            </div>
            <p className="mt-1 text-xs leading-relaxed text-ink/60">{t("eco.vaquitaSub")}</p>
            <a
              href="https://vaquita.fi/"
              target="_blank"
              rel="noreferrer noopener"
              className="mt-3 inline-block border border-ink bg-white px-4 py-2 text-xs font-semibold text-ink hover:bg-ink hover:text-white"
            >
              {t("eco.vaquitaCta")}
            </a>
          </div>

          <div className="flex-1 border border-line bg-white p-5">
            <p className="text-base font-semibold text-ink">{t("eco.receiptTitle")}</p>
            <p className="mt-1 text-xs leading-relaxed text-ink/60">{t("eco.receiptSub")}</p>
            <input
              type="text"
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
              placeholder="NIT o CI (opcional para respaldo SIAT)"
              className="mt-2 w-full border border-line px-2.5 py-1.5 text-xs text-ink focus:border-ink focus:outline-none"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={printReceipt}
                className="bg-ink px-4 py-2 text-xs font-semibold text-white hover:bg-black"
              >
                {t("eco.receiptPrint")}
              </button>
              <button
                type="button"
                onClick={downloadJson}
                className="border border-line bg-white px-4 py-2 text-xs font-semibold text-ink hover:border-ink"
              >
                {t("eco.receiptJson")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
