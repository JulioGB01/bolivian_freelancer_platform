"use client";

import { useCallback, useEffect, useState } from "react";
import { ESCROW_CHANGED } from "@/lib/escrow";
import { errorMessage } from "@/lib/errors";
import { formatAmount } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { setMode, useMode } from "@/lib/mode";
import { addUsdcTrustline, fundWithFriendbot, getAccountBalances, requestTestUsdc, type AccountBalances } from "@/lib/stellarAccount";
import { useWallet } from "@/lib/useWallet";

export default function WalletPage() {
  const { t } = useT();
  const mode = useMode();
  const { wallet, connectReal } = useWallet();
  const [acct, setAcct] = useState<AccountBalances | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    if (!wallet || wallet.kind !== "testnet") return;
    setAcct(await getAccountBalances(wallet.address).catch(() => null));
  }, [wallet]);

  useEffect(() => {
    const first = window.setTimeout(load, 0);
    window.addEventListener(ESCROW_CHANGED, load);
    return () => {
      window.clearTimeout(first);
      window.removeEventListener(ESCROW_CHANGED, load);
    };
  }, [load]);

  async function step(name: string, fn: () => Promise<unknown>) {
    setBusy(name);
    setErr("");
    try {
      await fn();
      await load();
    } catch (e) {
      setErr(errorMessage(e, t));
    } finally {
      setBusy(null);
    }
  }

  const steps = acct
    ? [
        { key: "xlm", done: acct.exists && acct.xlm > 0, title: t("setup.xlm"), info: `${acct.xlm.toFixed(2)} XLM`, action: t("setup.getXlm"), run: () => fundWithFriendbot(wallet!.address), disabled: false },
        { key: "trust", done: acct.usdc !== null, title: t("setup.trust"), info: t("setup.trustHint"), action: t("setup.trust"), run: () => addUsdcTrustline(wallet!.address), disabled: !acct.exists },
        { key: "usdc", done: (acct.usdc ?? 0) > 0, title: t("setup.usdc"), info: `${formatAmount(acct.usdc ?? 0)} USDC`, action: t("setup.getUsdc"), run: () => requestTestUsdc(wallet!.address), disabled: acct.usdc === null },
      ]
    : [];

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">{t("wal.title")}</h1>
        <p className="mt-2 text-ink/60">{t("wal.lead")}</p>
      </div>

      {mode === "demo" ? (
        <div className=" border border-line bg-white p-8">
          <p className="text-ink/70">{t("wal.demo")}</p>
          <button type="button" onClick={() => setMode("testnet")} className="mt-5 bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-black">
            {t("wal.useTestnet")} ↗
          </button>
        </div>
      ) : !wallet ? (
        <div className=" border border-line bg-white p-8 text-center">
          <button type="button" onClick={() => void connectReal().catch(() => undefined)} className=" bg-ink px-6 py-3 text-sm font-semibold text-white hover:bg-black">
            {t("wallet.connect")}
          </button>
        </div>
      ) : (
        <>
          <div className="hero-grid bg-ink p-8 text-white">
            <p className="text-xs uppercase tracking-wider text-white/50">{t("wallet.balance")}</p>
            <p className="mt-2 text-5xl font-semibold tracking-tight">
              {formatAmount(acct?.usdc ?? 0)} <span className="text-lg text-lime">USDC</span>
            </p>
            <p className="mt-3 break-all font-mono text-xs text-white/50">{wallet.address}</p>
          </div>
          <ol className="space-y-3">
            {steps.map((s, i) => (
              <li key={s.key} className="flex flex-wrap items-center justify-between gap-4 border border-line bg-white p-5">
                <div className="flex items-center gap-4">
                  <span className={`grid h-9 w-9 place-items-center text-sm font-bold ${s.done ? "bg-lime text-ink" : "bg-paper text-ink/60"}`}>
                    {s.done ? "✓" : i + 1}
                  </span>
                  <div>
                    <p className="font-semibold">{s.title}</p>
                    <p className="text-xs text-ink/50">{s.info}</p>
                  </div>
                </div>
                {(!s.done || s.key === "usdc") && (
                  <button
                    type="button"
                    onClick={() => step(s.key, s.run)}
                    disabled={busy !== null || s.disabled}
                    className=" bg-ink px-5 py-2 text-sm font-semibold text-white hover:bg-black disabled:opacity-40"
                  >
                    {busy === s.key ? "…" : s.action}
                  </button>
                )}
              </li>
            ))}
          </ol>
          {err && <p className=" bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
        </>
      )}
    </div>
  );
}
