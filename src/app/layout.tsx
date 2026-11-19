import type { Metadata } from "next";
import { Instrument_Serif, Inter_Tight, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import BrandMark from "@/components/BrandMark";
import { FooterText, ModeBanner } from "@/components/Chrome";
import NavLinks, { HeaderRight } from "@/components/NavLinks";
import CommandMenu from "@/components/CommandMenu";
import { Toaster } from "@/components/ui/sonner";

const interTight = Inter_Tight({ subsets: ["latin"], variable: "--font-inter-tight", display: "swap" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono", display: "swap" });
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bolivia Escrow · Pagos seguros para freelancers",
  description:
    "Escrow por hitos en Stellar para freelancers bolivianos: mira el dinero de tu cliente bloqueado en la blockchain antes de empezar a trabajar.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${interTight.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable}`}>
      <body className="flex min-h-screen flex-col bg-paper font-sans text-ink antialiased">
        <div className="bo-stripe h-1 w-full" aria-hidden />
        <header className="sticky top-0 z-30 border-b border-ink/10 bg-paper/90 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-3">
            <Link href="/" className="flex items-center gap-2.5 pl-1">
              <BrandMark size={30} />
              <span className="text-[17px] font-semibold tracking-tight">
                Bolivia<span className="font-serif text-[19px] font-normal italic text-brand-600">Escrow</span>
              </span>
            </Link>
            <div className="order-3 w-full sm:order-2 sm:w-auto">
              <NavLinks />
            </div>
            <div className="order-2 sm:order-3">
              <HeaderRight />
            </div>
          </div>
        </header>
        <ModeBanner />
        <main className="flex-1">{children}</main>
        <footer className="mt-20 bg-ink text-white/60">
          <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-6 px-5 py-12">
            <div>
              <p className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Bolivia<span className="font-serif font-normal italic text-lime">Escrow</span>
              </p>
              <div className="bo-stripe mt-4 h-1 w-24" aria-hidden />
            </div>
            <div className="flex flex-col gap-1 text-right text-xs">
              <FooterText />
            </div>
          </div>
        </footer>
        <CommandMenu />
        <Toaster />
      </body>
    </html>
  );
}
