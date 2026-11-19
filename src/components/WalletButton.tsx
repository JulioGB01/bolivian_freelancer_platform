"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useWallet } from "@/lib/useWallet";
import { ESCROW_CHANGED, getEscrow } from "@/lib/escrow";
import { errorMessage } from "@/lib/errors";
import { formatAmount, shortAddress } from "@/lib/format";
import { useT, type MsgKey } from "@/lib/i18n";
import { useMode } from "@/lib/mode";
import {
  addUsdcTrustline,
  fundWithFriendbot,
  getAccountBalances,
  requestTestUsdc,
  type AccountBalances,
} from "@/lib/stellarAccount";
import { DEMO_IDENTITIES } from "@/lib/wallet";

export default function WalletButton() {
  const { t } = useT();
  const mode = useMode();
  const { wallet, connectAs, connectReal, connectPasskey, disconnectWallet } = useWallet();
  const [open, setOpen] = useState(false);
  const [balance, setBalance] = useState(0);
  const [acct, setAcct] = useState<AccountBalances | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!wallet) return;
    if (wallet.kind === "testnet") {
      try {
        const b = await getAccountBalances(wallet.address);
        setAcct(b);
        setBalance(b.usdc ?? 0);
      } catch {
        /* Horizon unreachable: keep last values */
      }
    } else {
      setBalance(await getEscrow().balanceOf(wallet.address));
    }
  }, [wallet]);

  // Keep balances current after every escrow action.
  useEffect(() => {
    const first = window.setTimeout(load, 0);
    window.addEventListener(ESCROW_CHANGED, load);
    return () => {
      window.clearTimeout(first);
      window.removeEventListener(ESCROW_CHANGED, load);
    };
  }, [load]);

  // Close the menu on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

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

  async function onConnectReal() {
    setBusy("connect");
    setErr("");
    try {
      await connectReal();
      setOpen(true);
    } catch (e) {
      // Closing the wallet picker is not an error.
      const m = e && typeof e === "object" && "message" in e ? String((e as { message: unknown }).message) : "";
      if (!/closed the modal/i.test(m)) {
        setErr(errorMessage(e, t));
        setOpen(true);
      }
    } finally {
      setBusy(null);
    }
  }

  async function onConnectPasskey() {
    setBusy("passkey");
    setErr("");
    try {
      await connectPasskey();
      setOpen(true);
    } catch (e) {
      setErr(errorMessage(e, t));
      setOpen(true);
    } finally {
      setBusy(null);
    }
  }

  const roleKey: MsgKey = wallet
    ? wallet.kind === "testnet" && wallet.role !== "arbiter"
      ? "role.wallet"
      : (`role.${wallet.role}` as MsgKey)
    : "role.viewer";

  // Testnet mode, not connected: offer wallet picker or zero-extension Passkey onboarding.
  if (!wallet && mode === "testnet") {
    return (
      <div className="relative flex flex-wrap items-center gap-2" ref={ref}>
        <button
          type="button"
          onClick={onConnectReal}
          disabled={busy !== null}
          className=" bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-black disabled:opacity-60"
        >
          {busy === "connect" ? t("wallet.connecting") : t("wallet.connect")}
        </button>
        <button
          type="button"
          onClick={onConnectPasskey}
          disabled={busy !== null}
          title="Crear o abrir cuenta Stellar con huella / FaceID sin instalar Freighter"
          className="border border-ink bg-white px-3.5 py-2.5 text-xs font-semibold text-ink hover:bg-paper disabled:opacity-60"
        >
          {busy === "passkey" ? "..." : "Passkey"}
        </button>
        {open && err && (
          <div className="absolute right-0 z-20 mt-2 w-72 border border-red-200 bg-white p-3 text-xs text-red-700 shadow-lg">
            {err}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      {wallet ? (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex items-center gap-2 border border-slate-200 bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
        >
          <span className="h-2 w-2 bg-brand-500" aria-hidden />
          <span className="font-medium text-slate-800">
            {wallet.kind === "testnet" ? shortAddress(wallet.address) : t(roleKey)}
          </span>
          <span className="hidden text-xs text-slate-500 sm:inline">{formatAmount(balance)} USDC</span>
          <span aria-hidden className="text-slate-400">▾</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className=" bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-black"
        >
          {t("wallet.connect")}
        </button>
      )}

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-72 border border-line bg-white p-1 shadow-lg">
          {wallet && (
            <div className="border-b border-slate-100 px-3 py-2 text-xs text-slate-500">
              <div className="flex items-center justify-between gap-2">
                <p className="font-mono text-slate-700" title={wallet.address}>{shortAddress(wallet.address)}</p>
                {wallet.kind === "testnet" && (
                  <button
                    type="button"
                    className="text-brand-700 hover:underline"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(wallet.address);
                        setCopied(true);
                        window.setTimeout(() => setCopied(false), 1500);
                      } catch {
                        /* clipboard blocked */
                      }
                    }}
                  >
                    {copied ? t("wallet.copied") : t("wallet.copy")}
                  </button>
                )}
              </div>
              <p className="mt-0.5">
                {t("wallet.balance")}: {formatAmount(balance)} USDC · {t(roleKey)}
              </p>
            </div>
          )}

          {wallet?.kind === "testnet" && acct && (
            <div className="space-y-2 border-b border-slate-100 px-3 py-3 text-xs">
              <p className="font-semibold text-slate-700">{t("setup.title")}</p>
              <SetupRow
                ok={acct.exists && acct.xlm > 0}
                label={`${t("setup.xlm")}: ${acct.xlm.toFixed(2)} XLM`}
                action={t("setup.getXlm")}
                busy={busy === "xlm"}
                onClick={() => step("xlm", () => fundWithFriendbot(wallet.address))}
                readyText={t("setup.ready")}
              />
              <SetupRow
                ok={acct.usdc !== null}
                label={t("setup.trustHint")}
                action={t("setup.trust")}
                busy={busy === "trust"}
                disabled={!acct.exists}
                onClick={() => step("trust", () => addUsdcTrustline(wallet.address))}
                readyText={t("setup.ready")}
              />
              <SetupRow
                ok={false}
                label={`${t("setup.usdc")}: ${formatAmount(acct.usdc ?? 0)} USDC`}
                action={t("setup.getUsdc")}
                busy={busy === "usdc"}
                disabled={acct.usdc === null}
                onClick={() => step("usdc", () => requestTestUsdc(wallet.address))}
                readyText=""
              />
            </div>
          )}

          {err && <p className="px-3 py-2 text-xs text-red-600">{err}</p>}

          {mode === "demo" && (
            <>
              <p className="px-3 pt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {wallet ? t("wallet.switchRole") : t("wallet.connectAs")}
              </p>
              {DEMO_IDENTITIES.map((id) => (
                <button
                  type="button"
                  key={id.address}
                  onClick={() => {
                    connectAs(id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-100 ${
                    wallet?.address === id.address ? "font-semibold text-brand-700" : "text-slate-700"
                  }`}
                >
                  {t(`demo.${id.role}` as MsgKey)}
                  {wallet?.address === id.address && <span aria-hidden>✓</span>}
                </button>
              ))}
            </>
          )}
          {wallet && (
            <button
              type="button"
              onClick={() => {
                disconnectWallet();
                setOpen(false);
              }}
              className="mt-1 block w-full border-t border-slate-100 px-3 py-2 text-left text-sm text-slate-500 hover:bg-slate-100"
            >
              {t("wallet.disconnect")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function SetupRow({
  ok,
  label,
  action,
  busy,
  disabled,
  onClick,
  readyText,
}: {
  ok: boolean;
  label: string;
  action: string;
  busy: boolean;
  disabled?: boolean;
  onClick: () => void;
  readyText: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-slate-600">{label}</span>
      {ok ? (
        <span className="whitespace-nowrap font-semibold text-brand-700">✓ {readyText}</span>
      ) : (
        <button
          type="button"
          onClick={onClick}
          disabled={busy || disabled}
          className="whitespace-nowrap border border-brand-600 px-2.5 py-1 font-semibold text-brand-700 hover:bg-brand-50 disabled:opacity-40"
        >
          {busy ? "…" : action}
        </button>
      )}
    </div>
  );
}
