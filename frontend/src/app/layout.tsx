import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import NavLinks from "@/components/NavLinks";
import WalletButton from "@/components/WalletButton";
import { DEMO_MODE } from "@/lib/config";

export const metadata: Metadata = {
  title: "Bolivia Freelance Escrow",
  description:
    "Milestone escrow on Stellar for Bolivian freelancers: see the money locked on-chain before you start work.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-slate-50 text-slate-900 antialiased">
        {DEMO_MODE && (
          <div className="bg-amber-100 px-4 py-1.5 text-center text-xs text-amber-900">
            Demo mode: simulated money, no real wallet or blockchain. Switch roles from the menu at the top right.
          </div>
        )}
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <span
                aria-hidden
                className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-indigo-600 to-emerald-500 text-sm text-white"
              >
                🔒
              </span>
              Bolivia Escrow
            </Link>
            <div className="order-3 w-full sm:order-2 sm:w-auto">
              <NavLinks />
            </div>
            <div className="order-2 sm:order-3">
              <WalletButton />
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">{children}</main>
        <footer className="border-t border-slate-200 py-4 text-center text-xs text-slate-500">
          Built on Stellar · Soroban smart contract escrow · Testnet prototype
        </footer>
      </body>
    </html>
  );
}
