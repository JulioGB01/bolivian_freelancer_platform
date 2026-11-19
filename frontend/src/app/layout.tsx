import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import BrandMark from "@/components/BrandMark";
import { FooterText, LangToggle, ModeBanner } from "@/components/Chrome";
import NavLinks from "@/components/NavLinks";
import WalletButton from "@/components/WalletButton";

export const metadata: Metadata = {
  title: "Bolivia Escrow · Pagos seguros para freelancers",
  description:
    "Escrow por hitos en Stellar para freelancers bolivianos: mira el dinero de tu cliente bloqueado en la blockchain antes de empezar a trabajar.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
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
            <div className="order-2 flex items-center gap-2 sm:order-3">
              <LangToggle />
              <WalletButton />
            </div>
          </div>
        </header>
        <ModeBanner />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">{children}</main>
        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-6 text-xs text-slate-500">
            <FooterText />
          </div>
        </footer>
      </body>
    </html>
  );
}
