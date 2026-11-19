"use client";

// Small client-side pieces of the page frame: language toggle, mode banner, footer text,
// and shared building blocks (page container, arrow pill button).
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { setLang, useT } from "@/lib/i18n";
import { setMode, useMode } from "@/lib/mode";

export function LangToggle() {
  const { lang } = useT();
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  return (
    <div className="flex bg-paper p-0.5 text-xs font-semibold" role="group" aria-label="Language">
      {(["es", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={` px-2.5 py-1.5 uppercase transition ${lang === l ? "bg-ink text-white" : "text-ink/50 hover:text-ink"}`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

export function ModeBanner() {
  const { t } = useT();
  const mode = useMode();
  const pathname = usePathname();
  // Only inside the app; public pages show their own data source.
  if (!pathname.startsWith("/app")) return null;
  const demo = mode === "demo";
  return (
    <div className="mx-auto mt-3 flex max-w-6xl flex-wrap items-center justify-center gap-x-2 gap-y-1 px-5 text-center text-xs text-ink/60">
      <span
        className={` px-2 py-0.5 font-semibold uppercase tracking-wide ${demo ? "bg-bo-yellow text-ink" : "bg-ink text-lime"}`}
      >
        {demo ? t("banner.demo") : t("banner.testnet")}
      </span>
      <span>{demo ? t("banner.demoText") : t("banner.testnetText")}</span>
      <button
        type="button"
        onClick={() => setMode(demo ? "testnet" : "demo")}
        className="font-semibold text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink"
      >
        {demo ? `${t("mode.testnet")} ↗` : `${t("mode.demo")} ↗`}
      </button>
    </div>
  );
}

export function FooterText() {
  const { t } = useT();
  return (
    <>
      <span>{t("footer.made")} 🇧🇴</span>
      <span>{t("footer.built")}</span>
    </>
  );
}

/** Standard page container for the app screens. */
export function Page({ children, narrow }: { children: React.ReactNode; narrow?: boolean }) {
  return <div className={`mx-auto px-5 py-10 sm:py-14 ${narrow ? "max-w-3xl" : "max-w-5xl"}`}>{children}</div>;
}

/** Pill button with a round arrow, as a link. */
export function ArrowLink({
  href,
  children,
  variant = "dark",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "dark" | "light" | "lime" | "outline";
}) {
  const styles = {
    dark: "bg-ink text-white hover:bg-black",
    light: "bg-white text-ink hover:bg-paper",
    lime: "bg-lime text-ink hover:brightness-95",
    outline: "border border-current text-current hover:bg-white/10",
  }[variant];
  const dot = {
    dark: "bg-lime text-ink",
    light: "bg-ink text-white",
    lime: "bg-ink text-lime",
    outline: "bg-current/10",
  }[variant];
  return (
    <Link
      href={href}
      className={`group inline-flex items-center gap-3 py-2 pl-5 pr-2 text-sm font-semibold transition ${styles}`}
    >
      {children}
      <span className={`grid h-8 w-8 place-items-center transition group-hover:translate-x-0.5 ${dot}`} aria-hidden>
        ↗
      </span>
    </Link>
  );
}
