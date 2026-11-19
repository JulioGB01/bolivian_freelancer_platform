"use client";

import { useSyncExternalStore } from "react";
import { DEFAULT_MODE } from "./config";

// Runtime mode: "demo" (simulated, no wallet) or "testnet" (real contract, real wallet).
export type Mode = "demo" | "testnet";

const KEY = "bfe.mode";
const EVENT = "bfe:mode-changed";

export function getMode(): Mode {
  if (typeof window === "undefined") return DEFAULT_MODE;
  try {
    const v = window.localStorage.getItem(KEY);
    return v === "demo" || v === "testnet" ? v : DEFAULT_MODE;
  } catch {
    return DEFAULT_MODE;
  }
}

export function isDemo(): boolean {
  return getMode() === "demo";
}

/** Switch mode. The page reloads so every component starts clean in the new mode. */
export function setMode(mode: Mode): void {
  try {
    window.localStorage.setItem(KEY, mode);
    window.localStorage.removeItem("bfe.connected");
  } catch {
    /* storage blocked: mode stays default */
  }
  window.dispatchEvent(new Event(EVENT));
  window.location.reload();
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

export function useMode(): Mode {
  return useSyncExternalStore(subscribe, getMode, () => DEFAULT_MODE);
}
