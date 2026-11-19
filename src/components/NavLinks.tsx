"use client";

// Header navigation. The public website and the app have different menus:
//   website: How it works · Verify · [Open app]
//   app:     Freelancer · Client · (Arbiter, only for the arbiter) · New agreement · Wallet
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getEscrow } from "@/lib/escrow";
import { useT, type MsgKey } from "@/lib/i18n";
import { useMode } from "@/lib/mode";
import { useWallet } from "@/lib/useWallet";
import { DEMO_IDENTITIES, type Role } from "@/lib/wallet";
import { LangToggle } from "./Chrome";
import WalletButton from "./WalletButton";

export function useInApp(): boolean {
  const pathname = usePathname();
  return pathname === "/app" || pathname.startsWith("/app/");
}

export default function NavLinks() {
  const { t } = useT();
  const pathname = usePathname();
  const inApp = useInApp();
  const mode = useMode();
  const { wallet, connectAs } = useWallet();
  const [arbiter, setArbiter] = useState<string | null>(null);

  useEffect(() => {
    if (!inApp) return;
    getEscrow()
      .getConfig()
      .then((c) => setArbiter(c.arbiter))
      .catch(() => setArbiter(null));
  }, [inApp, mode]);

  const pill = (active: boolean) =>
    `whitespace-nowrap rounded-full px-3 py-1.5 transition ${active ? "bg-ink font-medium text-white" : "text-ink/60 hover:bg-paper hover:text-ink"}`;

  if (!inApp) {
    const links: { href: string; label: MsgKey }[] = [
      { href: "/como-funciona", label: "nav.how" },
      { href: "/verificar", label: "nav.verify" },
    ];
    return (
      <nav className="flex items-center gap-1 overflow-x-auto text-sm">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className={pill(pathname.startsWith(l.href))}>
            {t(l.label)}
          </Link>
        ))}
      </nav>
    );
  }

  const isArbiter = wallet && arbiter === wallet.address;
  const areas: { href: string; label: MsgKey; role: Role }[] = [
    { href: "/app/freelancer", label: "area.freelancer", role: "freelancer" },
    { href: "/app/cliente", label: "area.client", role: "client" },
    ...(isArbiter || mode === "demo" ? [{ href: "/app/arbitro", label: "area.arbiter" as MsgKey, role: "arbiter" as Role }] : []),
  ];

  return (
    <nav className="flex items-center gap-1 overflow-x-auto text-sm">
      <div className="flex rounded-full bg-paper p-0.5">
        {areas.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            onClick={() => {
              // Demo: the area tabs also switch the demo identity, so each area has data to show.
              if (mode === "demo" && wallet?.role !== a.role) {
                const id = DEMO_IDENTITIES.find((d) => d.role === a.role);
                if (id) connectAs(id);
              }
            }}
            className={pill(pathname.startsWith(a.href))}
          >
            {t(a.label)}
          </Link>
        ))}
      </div>
      <Link href="/app/nuevo" className={pill(pathname === "/app/nuevo")}>
        {t("nav.new")}
      </Link>
      <Link href="/app/billetera" className={pill(pathname === "/app/billetera")}>
        {t("nav.wallet")}
      </Link>
    </nav>
  );
}

/** Right side of the header: language, then "Open app" on the website or the wallet in the app. */
export function HeaderRight() {
  const { t } = useT();
  const inApp = useInApp();
  return (
    <div className="flex items-center gap-2">
      <LangToggle />
      {inApp ? (
        <WalletButton />
      ) : (
        <Link href="/app" className="group inline-flex items-center gap-2 rounded-full bg-ink py-1.5 pl-4 pr-1.5 text-sm font-semibold text-white hover:bg-black">
          {t("nav.openApp")}
          <span className="grid h-7 w-7 place-items-center rounded-full bg-lime text-ink transition group-hover:rotate-45" aria-hidden>
            ↗
          </span>
        </Link>
      )}
    </div>
  );
}
