"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StrKey } from "@stellar/stellar-sdk";
import { getEscrow, MAX_REVIEW_WINDOW_SECS, MIN_REVIEW_WINDOW_SECS, notifyEscrowChanged } from "@/lib/escrow";
import { errorMessage } from "@/lib/errors";
import { BPS_DENOMINATOR, formatAmount, parseAmount } from "@/lib/format";
import { useT, type MsgKey } from "@/lib/i18n";
import { useMode } from "@/lib/mode";
import { useWallet } from "@/lib/useWallet";
import { DEMO_IDENTITIES } from "@/lib/wallet";

// Review window choices bounded to contract rules (1 hour – 30 days).
const REVIEW_WINDOWS: number[] = [3600, 86400, 3 * 86400, 7 * 86400, 30 * 86400];
const DEFAULT_WINDOW = 86400;
const MAX_MILESTONES = 10;
const AMOUNT_RE = /^\d+(\.\d{1,7})?$/;
const VALID_DEMO_ADDRS = new Set(DEMO_IDENTITIES.map((d) => d.address));

export default function NewAgreement() {
  const { t } = useT();
  const mode = useMode();
  const { wallet, connectReal, connectAs } = useWallet();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [client, setClient] = useState("");
  const [reviewWindowSecs, setReviewWindowSecs] = useState(DEFAULT_WINDOW);
  const [milestones, setMilestones] = useState([{ title: "", amount: "" }]);
  const [feeBps, setFeeBps] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    getEscrow()
      .getConfig()
      .then((c) => setFeeBps(c.feeBps))
      .catch(() => setFeeBps(null));
  }, []);

  if (!wallet) {
    return (
      <div className="border border-line bg-white p-8 text-center text-slate-600">
        <p>{t("new.connect")}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          {mode === "testnet" ? (
            <button
              type="button"
              onClick={() => void connectReal().catch(() => undefined)}
              className="bg-ink px-6 py-2.5 text-sm font-semibold text-white hover:bg-black"
            >
              {t("wallet.connect")}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => connectAs(DEMO_IDENTITIES[0])}
              className="bg-ink px-6 py-2.5 text-sm font-semibold text-white hover:bg-black"
            >
              {t("wallet.connectAs")} {t("demo.freelancer")}
            </button>
          )}
        </div>
      </div>
    );
  }

  function updateMilestone(i: number, patch: Partial<{ title: string; amount: string }>) {
    setMilestones((prev) => prev.map((m, idx) => (idx === i ? { ...m, ...patch } : m)));
  }

  const amountValid = (s: string) => AMOUNT_RE.test(s.trim()) && parseAmount(s) > 0;
  const clientAddr = client.trim();
  const problems: MsgKey[] = [];
  if (!title.trim()) problems.push("new.errTitle");
  if (!clientAddr) problems.push("new.errClient");
  else if (mode === "testnet" && !StrKey.isValidEd25519PublicKey(clientAddr)) problems.push("new.errClientG");
  else if (mode === "demo" && !VALID_DEMO_ADDRS.has(clientAddr)) problems.push("new.errClientDemo");
  else if (clientAddr === wallet.address) problems.push("new.errSame");
  if (reviewWindowSecs < MIN_REVIEW_WINDOW_SECS || reviewWindowSecs > MAX_REVIEW_WINDOW_SECS) {
    problems.push("new.errWindow");
  }
  if (milestones.some((m) => !m.title.trim())) problems.push("new.errMsTitle");
  if (milestones.some((m) => !amountValid(m.amount))) problems.push("new.errAmount");

  const total = milestones.reduce((sum, m) => sum + (amountValid(m.amount) ? parseAmount(m.amount) : 0), 0);
  const fee =
    feeBps === null
      ? 0
      : milestones.reduce((sum, m) => {
          const a = amountValid(m.amount) ? parseAmount(m.amount) : 0;
          return sum + Math.floor((a * feeBps) / BPS_DENOMINATOR);
        }, 0);

  async function submit() {
    setTouched(true);
    if (problems.length > 0) return;
    setError("");
    setBusy(true);
    try {
      const id = await getEscrow().createAgreement({
        freelancer: wallet!.address,
        client: clientAddr,
        title: title.trim(),
        milestones: milestones.map((m) => ({ title: m.title.trim(), amount: parseAmount(m.amount) })),
        reviewWindowSecs,
      });
      notifyEscrowChanged();
      router.push(`/app/acuerdo/${id}`);
    } catch (e) {
      setError(errorMessage(e, t));
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">{t("new.title")}</h1>
        <p className="mt-3 max-w-2xl text-ink/60">{t("new.lead")}</p>
      </div>
      <div className=" border border-line bg-white p-6 shadow-sm sm:p-8">
        <div className="grid gap-6">
          <Field label={t("new.job")}>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("new.jobPh")} maxLength={120} className={inputCls} />
          </Field>
          <Field label={t("new.client")} hint={mode === "demo" ? t("new.clientHintDemo") : t("new.clientHint")}>
            <input
              value={client}
              onChange={(e) => setClient(e.target.value)}
              placeholder={mode === "demo" ? "demo-client" : "G…"}
              className={`${inputCls} font-mono`}
              autoComplete="off"
              spellCheck={false}
            />
          </Field>
          <Field label={t("new.window")} hint={t("new.windowHint")}>
            <select value={reviewWindowSecs} onChange={(e) => setReviewWindowSecs(Number(e.target.value))} className={inputCls}>
              {REVIEW_WINDOWS.map((s) => (
                <option key={s} value={s}>
                  {t(`new.w${s}` as MsgKey)}
                </option>
              ))}
            </select>
          </Field>

          <fieldset className="space-y-2">
            <legend className="mb-1 text-sm font-medium text-slate-700">
              {t("new.milestones")} <span className="font-normal text-slate-400">{t("new.range")}</span>
            </legend>
            {milestones.map((m, i) => {
              const badAmount = touched && !amountValid(m.amount);
              return (
                <div key={i} className="flex flex-col gap-2 sm:flex-row">
                  <input
                    value={m.title}
                    onChange={(e) => updateMilestone(i, { title: e.target.value })}
                    placeholder={t("new.msPh", { n: i + 1 })}
                    aria-label={t("new.msPh", { n: i + 1 })}
                    maxLength={120}
                    className={`${inputCls} flex-1 ${touched && !m.title.trim() ? "border-red-400" : ""}`}
                  />
                  <div className="flex gap-2">
                    <div className="relative flex-1 sm:w-44 sm:flex-none">
                      <input
                        value={m.amount}
                        onChange={(e) => updateMilestone(i, { amount: e.target.value.replace(",", ".") })}
                        placeholder="0.00"
                        inputMode="decimal"
                        aria-label={`${t("new.milestones")} ${i + 1} USDC`}
                        className={`${inputCls} w-full pr-14 text-right ${badAmount ? "border-red-400" : ""}`}
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">USDC</span>
                    </div>
                    {milestones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setMilestones((prev) => prev.filter((_, idx) => idx !== i))}
                        aria-label={`× ${i + 1}`}
                        className=" border border-slate-300 px-3 text-slate-500 hover:bg-slate-50"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {milestones.length < MAX_MILESTONES && (
              <button
                type="button"
                onClick={() => setMilestones((prev) => [...prev, { title: "", amount: "" }])}
                className="text-sm font-medium text-brand-700 hover:text-brand-600"
              >
                {t("new.add")}
              </button>
            )}
          </fieldset>

          <div className=" bg-paper p-5 text-sm">
            <Row label={t("new.total")} value={`${formatAmount(total)} USDC`} />
            <Row
              label={t("new.fee", { pct: feeBps === null ? "…" : (feeBps / 100).toFixed(2) })}
              value={`− ${formatAmount(fee)} USDC`}
            />
            <div className="my-2 border-t border-slate-200" />
            <Row label={t("new.receive")} value={`${formatAmount(total - fee)} USDC`} strong />
          </div>

          {touched && problems.length > 0 && (
            <ul className="list-disc space-y-1 bg-red-50 py-2 pl-8 pr-3 text-sm text-red-700" role="alert">
              {problems.map((p) => (
                <li key={p}>{t(p)}</li>
              ))}
            </ul>
          )}
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={submit}
              disabled={busy}
              className="w-full bg-ink px-7 py-3 text-sm font-semibold text-white hover:bg-black disabled:opacity-40 sm:w-auto"
            >
              {busy ? t("new.creating") : t("new.create")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "w-full border border-line bg-white px-3.5 py-2.5 text-sm focus:border-ink focus:outline-none focus:ring-4 focus:ring-ink/5";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 py-0.5 ${strong ? "font-semibold text-slate-900" : "text-slate-600"}`}>
      <span>{label}</span>
      <span className="whitespace-nowrap">{value}</span>
    </div>
  );
}
