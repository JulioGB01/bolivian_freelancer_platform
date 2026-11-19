"use client";

// Small client-side pieces of the page frame: language toggle, mode banner, footer text.
import { useEffect } from "react";
import { setLang, useT } from "@/lib/i18n";
import { setMode, useMode } from "@/lib/mode";

export function LangToggle() {
  const { lang } = useT();
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  return (
    <div className="flex overflow-hidden rounded-full border border-slate-200 text-xs font-semibold" role="group" aria-label="Language">
      {(["es", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`px-2.5 py-1.5 uppercase ${lang === l ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50"}`}
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
  const demo = mode === "demo";
  return (
    <div className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-center text-xs text-slate-600">
      <span
        className={`mr-1.5 rounded-full px-2 py-0.5 font-semibold ${demo ? "bg-amber-100 text-amber-800" : "bg-brand-100 text-brand-800"}`}
      >
        {demo ? t("banner.demo") : t("banner.testnet")}
      </span>
      {demo ? t("banner.demoText") : t("banner.testnetText")}{" "}
      <button
        type="button"
        onClick={() => setMode(demo ? "testnet" : "demo")}
        className="ml-1 font-semibold text-brand-700 underline-offset-2 hover:underline"
      >
        {demo ? `→ ${t("mode.testnet")}` : `→ ${t("mode.demo")}`}
      </button>
    </div>
  );
}

export function FooterText() {
  const { t } = useT();
  return (
    <>
      <span className="flex items-center gap-2">
        <span className="bo-stripe inline-block h-2.5 w-6 rounded-sm" aria-hidden />
        {t("footer.made")}
      </span>
      <span>{t("footer.built")}</span>
    </>
  );
}
