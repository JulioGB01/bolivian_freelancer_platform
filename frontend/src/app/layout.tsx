import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import BrandMark from "@/components/BrandMark";
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
      <body className="flex min-h-screen flex-col bg-white font-sans text-slate-900 antialiased">
        <div className="bo-stripe h-1 w-full" aria-hidden />
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3.5">
            <Link href="/" className="flex items-center gap-2.5">
              <BrandMark />
              <span className="text-[17px] font-semibold tracking-tight text-slate-900">
                Bolivia<span className="text-brand-600">Escrow</span>
              </span>
            </Link>
            <div className="order-3 w-full sm:order-2 sm:mr-auto sm:w-auto">
              <NavLinks />
            </div>
            <div className="order-2 sm:order-3">
              <WalletButton />
            </div>
          </div>
        </header>
        {DEMO_MODE && (
          <div className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-center text-xs text-slate-600">
            <span className="mr-1.5 rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-800">Demo</span>
            Simulated money, no real wallet or blockchain. Switch roles from the menu at the top right.
          </div>
        )}
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">{children}</main>
        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-6 text-xs text-slate-500">
            <span className="flex items-center gap-2">
              <span className="bo-stripe inline-block h-2.5 w-6 rounded-sm" aria-hidden />
              Made for Bolivian freelancers
            </span>
            <span>Built on Stellar · Soroban smart contract escrow · Testnet prototype</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
