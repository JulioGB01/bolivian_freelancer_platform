"use client";

import { useSyncExternalStore } from "react";

// One shared 1-second clock. Returns 0 while prerendering on the server, then the real time.
function subscribe(onTick: () => void): () => void {
  const t = window.setInterval(onTick, 1000);
  return () => window.clearInterval(t);
}
const nowSecs = () => Math.floor(Date.now() / 1000);

/** Current unix time in seconds, updated every second so countdowns stay live. */
export function useNow(): number {
  return useSyncExternalStore(subscribe, nowSecs, () => 0);
}
