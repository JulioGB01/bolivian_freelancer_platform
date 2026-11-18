"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getEscrow, notifyEscrowChanged } from "@/lib/escrow";
import { errorMessage } from "@/lib/errors";
import { BPS_DENOMINATOR, formatAmount, parseAmount } from "@/lib/format";
import { DEMO_MODE } from "@/lib/config";
import { useWallet } from "@/lib/useWallet";

// Review window choices. The default value is decision D-05 (still open); one hour is the
// value the demo has used so far. The one-minute option exists to test claim/dispute quickly.
const REVIEW_WINDOWS: { secs: number; label: string; demoOnly?: boolean }[] = [
  { secs: 60, label: "1 minute (demo testing)", demoOnly: true },
  { secs: 3600, label: "1 hour" },
  { secs: 86400, label: "1 day" },
  { secs: 3 * 86400, label: "3 days" },
  { secs: 7 * 86400, label: "7 days" },
];
const MAX_MILESTONES = 10;
const AMOUNT_RE = /^\d+(\.\d{1,7})?$/;

export default function NewAgreement() {
  const { wallet } = useWallet();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [client, setClient] = useState("");
  const [reviewWindowSecs, setReviewWindowSecs] = useState(3600);
  const [milestones, setMilestones] = useState([{ title: "", amount: "" }]);
  const [feeBps, setFeeBps] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    getEscrow().getConfig().then((c) => setFeeBps(c.feeBps));
  }, []);

  if (!wallet) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-600">
        Connect your wallet (top right) to create an agreement.
      </div>
    );
  }

  function updateMilestone(i: number, patch: Partial<{ title: string; amount: string }>) {
    setMilestones((prev) => prev.map((m, idx) => (idx === i ? { ...m, ...patch } : m)));
  }

  const amountValid = (s: string) => AMOUNT_RE.test(s.trim()) && parseAmount(s) > 0;
  const problems: string[] = [];
  if (!title.trim()) problems.push("Give the agreement a title.");
  if (!client.trim()) problems.push("Enter your client's wallet address.");
  else if (client.trim() === wallet.address) problems.push("The client must be a different address from yours.");
  if (milestones.some((m) => !m.title.trim())) problems.push("Give every milestone a title.");
  if (milestones.some((m) => !amountValid(m.amount)))
    problems.push("Every milestone needs an amount greater than 0 (for example 150 or 150.50).");

  const total = milestones.reduce((sum, m) => sum + (amountValid(m.amount) ? parseAmount(m.amount) : 0), 0);
  const fee = feeBps === null ? 0 : milestones.reduce((sum, m) => {
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
        client: client.trim(),
        title: title.trim(),
        milestones: milestones.map((m) => ({ title: m.title.trim(), amount: parseAmount(m.amount) })),
        reviewWindowSecs,
      });
      notifyEscrowChanged();
      router.push(`/agreements/${id}`);
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  }

  const windows = REVIEW_WINDOWS.filter((w) => DEMO_MODE || !w.demoOnly);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">New agreement</h1>
        <p className="mt-1 text-sm text-slate-600">
          Split the job into milestones. Your client locks the money for each milestone before you
          start it, and you can check it at any time.
        </p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-5">
          <Field label="What is the job?">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Website redesign"
              className={inputCls}
            />
          </Field>
          <Field
            label="Client's wallet address"
            hint={DEMO_MODE ? "Demo: use demo-client." : "The Stellar address (G…) your client will pay from."}
          >
            <input
              value={client}
              onChange={(e) => setClient(e.target.value)}
              placeholder={DEMO_MODE ? "demo-client" : "G…"}
              className={`${inputCls} font-mono`}
              autoComplete="off"
              spellCheck={false}
            />
          </Field>
          <Field
            label="Review window"
            hint="After you submit a milestone, the client has this long to approve or dispute. If they don't answer, you can claim the payment."
          >
            <select
              value={reviewWindowSecs}
              onChange={(e) => setReviewWindowSecs(Number(e.target.value))}
              className={inputCls}
            >
              {windows.map((w) => (
                <option key={w.secs} value={w.secs}>
                  {w.label}
                </option>
              ))}
            </select>
          </Field>

          <fieldset className="space-y-2">
            <legend className="mb-1 text-sm font-medium text-slate-700">
              Milestones <span className="font-normal text-slate-400">(1 to {MAX_MILESTONES})</span>
            </legend>
            {milestones.map((m, i) => {
              const badAmount = touched && !amountValid(m.amount);
              return (
                <div key={i} className="flex flex-col gap-2 sm:flex-row">
                  <input
                    value={m.title}
                    onChange={(e) => updateMilestone(i, { title: e.target.value })}
                    placeholder={`Milestone ${i + 1}, e.g. First draft`}
                    aria-label={`Milestone ${i + 1} title`}
                    className={`${inputCls} flex-1 ${touched && !m.title.trim() ? "border-red-400" : ""}`}
                  />
                  <div className="flex gap-2">
                    <div className="relative flex-1 sm:w-44 sm:flex-none">
                      <input
                        value={m.amount}
                        onChange={(e) => updateMilestone(i, { amount: e.target.value.replace(",", ".") })}
                        placeholder="0.00"
                        inputMode="decimal"
                        aria-label={`Milestone ${i + 1} amount in USDC`}
                        className={`${inputCls} w-full pr-14 text-right ${badAmount ? "border-red-400" : ""}`}
                      />
                      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                        USDC
                      </span>
                    </div>
                    {milestones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setMilestones((prev) => prev.filter((_, idx) => idx !== i))}
                        aria-label={`Remove milestone ${i + 1}`}
                        className="rounded-md border border-slate-300 px-3 text-slate-500 hover:bg-slate-50"
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
                className="text-sm font-medium text-brand-600 hover:text-brand-500"
              >
                + Add milestone
              </button>
            )}
          </fieldset>

          <div className="rounded-lg bg-slate-50 p-4 text-sm">
            <Row label="Total the client locks" value={`${formatAmount(total)} USDC`} />
            <Row
              label={`Platform fee${feeBps === null ? "" : ` (${(feeBps / 100).toFixed(2)}%, fixed for this agreement)`}`}
              value={`− ${formatAmount(fee)} USDC`}
            />
            <div className="my-2 border-t border-slate-200" />
            <Row label="You receive if every milestone is approved" value={`${formatAmount(total - fee)} USDC`} strong />
          </div>

          {touched && problems.length > 0 && (
            <ul className="list-disc space-y-1 rounded-md bg-red-50 py-2 pl-8 pr-3 text-sm text-red-700" role="alert">
              {problems.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          )}
          {error && <p className="text-sm text-red-600" role="alert">{error}</p>}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={submit}
              disabled={busy}
              className="w-full rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-40 sm:w-auto"
            >
              {busy ? "Creating…" : "Create agreement"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100";

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
