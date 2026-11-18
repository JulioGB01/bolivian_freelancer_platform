"use client";

import { useCallback, useEffect, useState } from "react";
import { connect, disconnect, getConnectedWallet, type ConnectedWallet } from "./wallet";
import { resetEscrow } from "./escrow";

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

  const connectAs = useCallback((identity: ConnectedWallet) => {
    resetEscrow();
    setWallet(connect(identity));
    window.dispatchEvent(new Event(EVENT));
  }, []);

  const disconnectWallet = useCallback(() => {
    disconnect();
    resetEscrow();
    setWallet(null);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return { wallet, connectAs, disconnectWallet };
}
