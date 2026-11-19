"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT, type MsgKey } from "@/lib/i18n";
import { useWallet } from "@/lib/useWallet";

// Main navigation. The Disputes link is only shown to the arbiter.
export default function NavLinks() {
  const { t } = useT();
  const pathname = usePathname();
  const { wallet } = useWallet();
  const links: { href: string; label: MsgKey }[] = [
    { href: "/dashboard", label: "nav.agreements" },
    { href: "/agreements/new", label: "nav.new" },
    ...(wallet?.role === "arbiter" ? [{ href: "/arbiter", label: "nav.disputes" as MsgKey }] : []),
  ];
  return (
    <nav className="flex items-center gap-1 overflow-x-auto text-sm">
      {links.map((l) => {
        const active = pathname === l.href;
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 ${
              active ? "bg-brand-50 font-medium text-brand-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            {t(l.label)}
          </Link>
        );
      })}
    </nav>
  );
}
