"use client";

// /app sends each person to their area: client or arbiter if that is their demo role, otherwise freelancer.
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getConnectedWallet } from "@/lib/wallet";

export default function AppHome() {
  const router = useRouter();
  useEffect(() => {
    const w = getConnectedWallet();
    router.replace(w?.role === "client" ? "/app/cliente" : w?.role === "arbiter" ? "/app/arbitro" : "/app/freelancer");
  }, [router]);
  return null;
}
