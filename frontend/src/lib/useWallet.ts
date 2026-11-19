"use client";

import { useCallback, useEffect, useState } from "react";
import { getEscrow, resetEscrow } from "./escrow";
import { getMode } from "./mode";
import {
  connectRealWallet,
  disconnectRealWallet,
  forgetWallet,
  getConnectedWallet,
  saveWallet,
  type ConnectedWallet,
} from "./wallet";

// Every component calls useWallet() with its own state, so a connect/disconnect in the
// header must be broadcast to the rest of the page (and to other tabs via "storage").
const EVENT = "bfe:wallet-changed";

export function useWallet() {
  const [wallet, setWallet] = useState<ConnectedWallet | null>(null);

  useEffect(() => {
    const sync = () => setWallet(getConnectedWallet());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  /** Demo mode: connect as one of the demo identities. */
  const connectAs = useCallback((identity: ConnectedWallet) => {
    resetEscrow();
    setWallet(saveWallet(identity));
    window.dispatchEvent(new Event(EVENT));
  }, []);

  /** Testnet mode: open the wallet picker (Freighter, xBull, Lobstr, …). */
  const connectReal = useCallback(async () => {
    const address = await connectRealWallet();
    let role: ConnectedWallet["role"] = "viewer";
    try {
      const cfg = await getEscrow().getConfig();
      if (cfg.arbiter === address) role = "arbiter";
    } catch {
      /* config unreachable: keep viewer */
    }
    resetEscrow();
    setWallet(saveWallet({ address, role, kind: "testnet" }));
    window.dispatchEvent(new Event(EVENT));
  }, []);

  const disconnectWallet = useCallback(() => {
    if (getMode() === "testnet") void disconnectRealWallet();
    forgetWallet();
    resetEscrow();
    setWallet(null);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return { wallet, connectAs, connectReal, disconnectWallet };
}
