"use client";

import Link from "next/link";
import { EXPLORER_URL, ESCROW_CONTRACT_ID } from "@/lib/config";
import { useT, type MsgKey } from "@/lib/i18n";
import { setMode, useMode, type Mode } from "@/lib/mode";

const STEPS: [MsgKey, MsgKey][] = [
  ["home.s1t", "home.s1b"],
  ["home.s2t", "home.s2b"],
  ["home.s3t", "home.s3b"],
  ["home.s4t", "home.s4b"],
];
const FEATURES: [MsgKey, MsgKey][] = [
  ["home.f1t", "home.f1b"],
  ["home.f2t", "home.f2b"],
  ["home.f3t", "home.f3b"],
];

export default function Home() {
  const { t } = useT();
  const mode = useMode();

  return (
    <div className="space-y-20">
      <section className="grid items-center gap-10 pt-4 md:grid-cols-[1.15fr_1fr]">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600">
            <span className="bo-stripe inline-block h-2 w-5 rounded-sm" aria-hidden />
            {t("home.badge")}
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl">
            {t("home.title1")}
            <span className="text-brand-600">{t("home.titleLocked")}</span>
            {t("home.title2")}
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600">{t("home.lead")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/agreements/new"
              className="rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
            >
              {t("home.cta")}
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-800 hover:border-brand-600 hover:text-brand-700"
            >
              {t("home.cta2")}
            </Link>
          </div>
        </div>

        {/* Illustration of the product's core screen, with example values. */}
        <div className="relative" aria-hidden>
          <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-brand-50" />
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{t("home.example")}</p>
            <p className="mt-1 font-semibold text-slate-900">{t("home.exampleTitle")}</p>
            <div className="mt-5 rounded-xl bg-brand-50 p-4">
              <p className="text-xs font-medium text-brand-800">🔒 {t("home.exampleLocked")}</p>
              <p className="mt-1 text-3xl font-semibold text-brand-800">
                400.00 <span className="text-sm font-medium">USDC</span>
              </p>
              <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-white">
                <div className="w-1/3 bg-slate-400" />
                <div className="w-1/3 bg-brand-600" />
              </div>
            </div>
            <ul className="mt-4 space-y-2 text-sm">
              {(
                [
                  ["home.ex1", "st.paid", "bg-slate-800 text-white"],
                  ["home.ex2", "st.locked", "bg-brand-600 text-white"],
                  ["home.ex3", "st.notFunded", "bg-slate-100 text-slate-700"],
                ] as [MsgKey, MsgKey, string][]
              ).map(([title, status, cls]) => (
                <li key={title} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
                  <span className="text-slate-700">{t(title)}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}>{t(status)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{t("home.how")}</h2>
        <ol className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(([title, body], i) => (
            <li key={title}>
              <span className="grid h-9 w-9 place-items-center rounded-full border-2 border-brand-600 text-sm font-bold text-brand-700">
                {i + 1}
              </span>
              <p className="mt-3 font-semibold text-slate-900">{t(title)}</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{t(body)}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {FEATURES.map(([title, body], i) => (
          <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6">
            <span
              className={`block h-1 w-8 rounded-full ${["bg-bo-red", "bg-bo-yellow", "bg-bo-green"][i]}`}
              aria-hidden
            />
            <h3 className="mt-4 font-semibold text-slate-900">{t(title)}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{t(body)}</p>
          </div>
        ))}
      </section>

      <section>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{t("home.modesTitle")}</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
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
                className={`flex flex-col rounded-2xl border p-6 ${active ? "border-brand-600 ring-1 ring-brand-600" : "border-slate-200"}`}
              >
                <h3 className="font-semibold text-slate-900">{t(title)}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{t(body)}</p>
                {m === "testnet" && (
                  <a
                    href={`${EXPLORER_URL}/contract/${ESCROW_CONTRACT_ID}`}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="mt-3 break-all font-mono text-xs text-brand-700 hover:underline"
                  >
                    {ESCROW_CONTRACT_ID.slice(0, 10)}…{ESCROW_CONTRACT_ID.slice(-6)} ↗
                  </a>
                )}
                <div className="mt-4">
                  {active ? (
                    <span className="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700">
                      ✓ {t("home.current")}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setMode(m)}
                      className="rounded-full border border-slate-300 px-4 py-1.5 text-sm font-semibold text-slate-800 hover:border-brand-600 hover:text-brand-700"
                    >
                      {t("home.useThis")}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
