"use client";

import { useEffect, useRef, useState } from "react";
import { useWallet } from "@/lib/useWallet";
import { ESCROW_CHANGED, getEscrow } from "@/lib/escrow";
import { formatAmount, shortAddress } from "@/lib/format";
import { DEMO_IDENTITIES } from "@/lib/wallet";

export default function WalletButton() {
  const { wallet, connectAs, disconnectWallet } = useWallet();
  const [open, setOpen] = useState(false);
  const [balance, setBalance] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  // Keep the balance pill current after every escrow action.
  useEffect(() => {
    if (!wallet) return;
    let cancelled = false;
    const load = () =>
      getEscrow()
        .balanceOf(wallet.address)
        .then((b) => {
          if (!cancelled) setBalance(b);
        });
    load();
    window.addEventListener(ESCROW_CHANGED, load);
    return () => {
      cancelled = true;
      window.removeEventListener(ESCROW_CHANGED, load);
    };
  }, [wallet]);

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

  return (
    <div className="relative" ref={ref}>
      {wallet ? (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm hover:bg-slate-50"
        >
          <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
          <span className="font-medium capitalize text-slate-800">{wallet.role}</span>
          <span className="hidden text-xs text-slate-500 sm:inline">{formatAmount(balance)} USDC</span>
          <span aria-hidden className="text-slate-400">▾</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          Connect wallet
        </button>
      )}

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-64 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
          {wallet && (
            <div className="border-b border-slate-100 px-3 py-2 text-xs text-slate-500">
              <p className="font-mono" title={wallet.address}>{shortAddress(wallet.address)}</p>
              <p className="mt-0.5">Balance: {formatAmount(balance)} USDC</p>
            </div>
          )}
          <p className="px-3 pt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {wallet ? "Switch demo role" : "Demo: connect as"}
          </p>
          {DEMO_IDENTITIES.map((id) => (
            <button
              type="button"
              key={id.address}
              onClick={() => {
                connectAs(id);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-slate-100 ${
                wallet?.address === id.address ? "font-semibold text-indigo-700" : "text-slate-700"
              }`}
            >
              {id.label}
              {wallet?.address === id.address && <span aria-hidden>✓</span>}
            </button>
          ))}
          {wallet && (
            <button
              type="button"
              onClick={() => {
                disconnectWallet();
                setOpen(false);
              }}
              className="mt-1 block w-full rounded-md border-t border-slate-100 px-3 py-2 text-left text-sm text-slate-500 hover:bg-slate-100"
            >
              Disconnect
            </button>
          )}
        </div>
      )}
    </div>
  );
}
