"use client";

import { ArrowLink } from "@/components/Chrome";
import { EXPLORER_URL, ESCROW_CONTRACT_ID } from "@/lib/config";
import { useT, type MsgKey } from "@/lib/i18n";
import { setMode, useMode, type Mode } from "@/lib/mode";

const STEPS: [MsgKey, MsgKey][] = [
  ["home.s1t", "home.s1b"],
  ["home.s2t", "home.s2b"],
  ["home.s3t", "home.s3b"],
  ["home.s4t", "home.s4b"],
];
const STATS: [MsgKey, MsgKey][] = [
  ["home.stat1v", "home.stat1l"],
  ["home.stat2v", "home.stat2l"],
  ["home.stat3v", "home.stat3l"],
];
const FEATURES: { title: MsgKey; body: MsgKey; cls: string; mark: string }[] = [
  { title: "home.f1t", body: "home.f1b", cls: "bg-bo-yellow text-ink", mark: "bg-ink" },
  { title: "home.f2t", body: "home.f2b", cls: "bg-brand-600 text-white", mark: "bg-lime" },
  { title: "home.f3t", body: "home.f3b", cls: "bg-ink text-white", mark: "bg-bo-red" },
];

export default function Home() {
  const { t } = useT();
  const mode = useMode();

  return (
    <div className="space-y-24 pb-8 sm:space-y-32">
      {/* Hero */}
      <section className="px-3 pt-4 sm:px-5">
        <div className="hero-grid relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-ink text-white sm:rounded-[2.5rem]">
          <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-lime/20 blur-3xl" aria-hidden />
          <div className="relative grid items-center gap-12 px-6 py-14 sm:px-12 sm:py-20 lg:grid-cols-[1.25fr_1fr]">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-xs font-medium text-white/70">
                <span className="bo-stripe inline-block h-2 w-5 rounded-sm" aria-hidden />
                {t("home.badge")}
              </p>
              <h1 className="mt-6 text-[2.75rem] font-semibold leading-[0.98] tracking-[-0.035em] sm:text-6xl lg:text-7xl">
                {t("home.title1")}
                <span className="font-serif font-normal italic text-lime">{t("home.titleLocked")}</span>
                {t("home.title2")}
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-white/65 sm:text-lg">{t("home.lead")}</p>
              <div className="mt-9 flex flex-wrap gap-3">
                <ArrowLink href="/app/nuevo" variant="lime">
                  {t("home.cta")}
                </ArrowLink>
                <ArrowLink href="/app" variant="outline">
                  {t("home.cta2")}
                </ArrowLink>
              </div>
            </div>

            {/* Product mockup with example values */}
            <div className="relative mx-auto w-full max-w-sm" aria-hidden>
              <div className="absolute -bottom-6 -left-6 z-10 hidden rotate-[-4deg] rounded-2xl bg-bo-yellow px-4 py-3 text-ink shadow-xl sm:block">
                <p className="text-[10px] font-semibold uppercase tracking-wider">{t("home.verified")}</p>
                <p className="font-serif text-xl italic">✓ on-chain</p>
              </div>
              <div className="rounded-[1.75rem] bg-white p-5 text-ink shadow-2xl">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-ink/40">{t("home.example")}</p>
                  <span className="h-2 w-2 rounded-full bg-lime" />
                </div>
                <p className="mt-1 font-semibold">{t("home.exampleTitle")}</p>
                <div className="mt-4 rounded-2xl bg-ink p-5 text-white">
                  <p className="text-xs text-white/60">🔒 {t("home.exampleLocked")}</p>
                  <p className="mt-1 text-4xl font-semibold tracking-tight">
                    400<span className="text-white/40">.00</span> <span className="text-sm font-medium text-lime">USDC</span>
                  </p>
                  <div className="mt-4 flex h-1.5 overflow-hidden rounded-full bg-white/15">
                    <div className="w-1/3 bg-white/50" />
                    <div className="w-1/3 bg-lime" />
                  </div>
                </div>
                <ul className="mt-3 divide-y divide-line text-sm">
                  {(
                    [
                      ["home.ex1", "st.paid", "bg-ink text-white"],
                      ["home.ex2", "st.locked", "bg-lime text-ink"],
                      ["home.ex3", "st.notFunded", "bg-paper text-ink/60"],
                    ] as [MsgKey, MsgKey, string][]
                  ).map(([title, status, cls]) => (
                    <li key={title} className="flex items-center justify-between py-2.5">
                      <span>{t(title)}</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{t(status)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Big numbers */}
      <section className="mx-auto max-w-6xl px-5">
        <div className="grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-3">
          {STATS.map(([v, l]) => (
            <div key={v} className="bg-paper p-8">
              <p className="text-6xl font-semibold tracking-[-0.04em] sm:text-7xl">{t(v)}</p>
              <p className="mt-3 max-w-[16rem] text-sm text-ink/60">{t(l)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works: editorial list with thin rules */}
      <section className="mx-auto grid max-w-6xl gap-10 px-5 lg:grid-cols-[1fr_1.6fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/50">{t("home.howKicker")}</p>
          <h2 className="mt-3 text-5xl font-semibold leading-none tracking-[-0.03em] sm:text-6xl">
            {t("home.how")}
            <span className="font-serif font-normal italic text-brand-600">.</span>
          </h2>
        </div>
        <ol className="border-t border-ink">
          {STEPS.map(([title, body], i) => (
            <li key={title} className="grid grid-cols-[3.5rem_1fr] gap-4 border-b border-line py-6 sm:grid-cols-[5rem_1fr_1.3fr]">
              <span className="font-serif text-3xl italic text-ink/40">0{i + 1}</span>
              <p className="text-lg font-semibold">{t(title)}</p>
              <p className="col-start-2 text-sm leading-relaxed text-ink/60 sm:col-start-3">{t(body)}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Why trust it: colored blocks */}
      <section className="mx-auto max-w-6xl px-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/50">{t("home.whyKicker")}</p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className={`flex min-h-64 flex-col justify-between rounded-3xl p-7 ${f.cls}`}>
              <span className={`h-3 w-3 rounded-full ${f.mark}`} aria-hidden />
              <div>
                <h3 className="text-2xl font-semibold tracking-tight">{t(f.title)}</h3>
                <p className="mt-3 text-sm leading-relaxed opacity-80">{t(f.body)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Two ways to try it */}
      <section className="mx-auto max-w-6xl px-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/50">{t("home.tryKicker")}</p>
        <h2 className="mt-3 text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">{t("home.modesTitle")}</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {(
            [
              ["demo", "home.modeDemoT", "home.modeDemoB"],
              ["testnet", "home.modeTestT", "home.modeTestB"],
            ] as [Mode, MsgKey, MsgKey][]
          ).map(([m, title, body]) => {
            const active = mode === m;
            return (
              <div
                key={m}
                className={`flex flex-col rounded-3xl border p-7 ${active ? "border-ink bg-white" : "border-line bg-paper"}`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">{t(title)}</h3>
                  {active && (
                    <span className="rounded-full bg-ink px-3 py-1 text-xs font-semibold text-lime">✓ {t("home.current")}</span>
                  )}
                </div>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-ink/60">{t(body)}</p>
                {m === "testnet" && (
                  <a
                    href={`${EXPLORER_URL}/contract/${ESCROW_CONTRACT_ID}`}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="mt-4 font-mono text-xs text-brand-700 underline decoration-brand-200 underline-offset-4"
                  >
                    {ESCROW_CONTRACT_ID.slice(0, 10)}…{ESCROW_CONTRACT_ID.slice(-6)} ↗
                  </a>
                )}
                {!active && (
                  <button
                    type="button"
                    onClick={() => setMode(m)}
                    className="mt-6 self-start rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-black"
                  >
                    {t("home.useThis")} ↗
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Closing call to action */}
      <section className="px-3 sm:px-5">
        <div className="mx-auto max-w-6xl rounded-[2rem] bg-brand-600 px-6 py-14 text-white sm:px-12">
          <h2 className="max-w-3xl text-4xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-5xl">
            {t("home.ctaBandT")}
            <span className="font-serif font-normal italic text-bo-yellow">{t("home.ctaBandAccent")}</span>.
          </h2>
          <p className="mt-4 max-w-xl text-white/75">{t("home.ctaBandB")}</p>
          <div className="mt-8">
            <ArrowLink href="/app/nuevo" variant="light">
              {t("home.cta")}
            </ArrowLink>
          </div>
        </div>
      </section>
    </div>
  );
}
