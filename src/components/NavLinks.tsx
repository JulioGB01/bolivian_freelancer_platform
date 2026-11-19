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
import { ArrowUpRight, ChevronDown, Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ENTRANCES, SWATCH } from "@/lib/entrance";
import { LangToggle } from "./Chrome";
import { openCommandMenu } from "./CommandMenu";
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
    `whitespace-nowrap px-3 py-1.5 transition ${active ? "bg-ink font-medium text-white" : "text-ink/60 hover:bg-paper hover:text-ink"}`;

  if (!inApp) {
    const links: { href: string; label: MsgKey }[] = [
      { href: "/como-funciona", label: "nav.how" },
      { href: "/verificar", label: "nav.verify" },
    ];
    return (
      <nav className="hidden items-center gap-1 overflow-x-auto text-sm sm:flex">
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
      <div className="flex bg-paper p-0.5">
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

/** Right side of the header: search (⌘K), language, then the entrance menu on the website or the wallet in the app. */
export function HeaderRight() {
  const { t } = useT();
  const inApp = useInApp();
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={openCommandMenu}
        className="hidden h-8 items-center gap-2 border border-ink/15 px-2.5 text-xs text-ink/60 hover:border-ink hover:text-ink md:inline-flex"
        aria-label={t("nav.search")}
      >
        <Search className="size-3.5" />
        {t("nav.search")}
        <kbd className="font-mono text-[10px] text-ink/40">⌘K</kbd>
      </button>
      <LangToggle />
      {inApp ? <WalletButton /> : <EnterMenu />}
      {!inApp && <MobileMenu />}
    </div>
  );
}

/** "Entrar" dropdown with the three entrances (Radix dropdown, brand styled). */
function EnterMenu() {
  const { t } = useT();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" className="h-9 gap-2 pr-1.5 pl-4">
          {t("nav.enter")}
          <span className="grid size-6 place-items-center bg-lime text-ink" aria-hidden>
            <ChevronDown className="size-3.5" />
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-72 border-ink p-0 shadow-[4px_4px_0_0_var(--color-ink)]">
        {ENTRANCES.map((e) => (
          <DropdownMenuItem key={e.id} asChild className="items-start gap-3 border-b border-line px-4 py-3 last:border-b-0">
            <Link href={e.href}>
              <span className={`mt-1 size-2.5 shrink-0 ${SWATCH[e.color].dot}`} aria-hidden />
              <span className="flex-1">
                <span className="flex items-center justify-between font-semibold text-ink">
                  {t(e.name)} <span className="font-mono text-[10px] text-ink/40">{e.n}</span>
                </span>
                <span className="mt-0.5 block text-xs leading-snug text-ink/60">{t(e.blurb)}</span>
              </span>
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Phone menu: a Vaul drawer (drag down to close) with the pages and the three entrances. */
function MobileMenu() {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const links: { href: string; label: MsgKey }[] = [
    { href: "/", label: "nav.home" },
    { href: "/como-funciona", label: "nav.how" },
    { href: "/verificar", label: "nav.verify" },
  ];
  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline" size="icon" className="size-9 sm:hidden" aria-label={t("nav.menu")}>
          <Menu className="size-4" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="border-ink bg-paper">
        <DrawerHeader className="text-left">
          <DrawerTitle className="font-mono text-[11px] font-medium tracking-[0.18em] uppercase text-ink/50">{t("nav.menu")}</DrawerTitle>
        </DrawerHeader>
        <nav className="px-4 pb-2">
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="flex items-center justify-between border-b border-line py-3 text-lg font-semibold">
              {t(l.label)} <ArrowUpRight className="size-4 text-ink/40" />
            </Link>
          ))}
        </nav>
        <div className="grid gap-px bg-ink/10 p-4">
          {ENTRANCES.map((e) => (
            <Link key={e.id} href={e.href} onClick={() => setOpen(false)} className={`flex items-center justify-between px-4 py-4 font-semibold ${SWATCH[e.color].panel}`}>
              {t(e.cta)} <ArrowUpRight className="size-4" />
            </Link>
          ))}
        </div>
        <div className="px-4 pb-6">
          <button type="button" onClick={() => { setOpen(false); openCommandMenu(); }} className="flex w-full items-center gap-2 border border-ink/20 px-3 py-2.5 text-sm text-ink/60">
            <Search className="size-4" /> {t("nav.search")}
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
