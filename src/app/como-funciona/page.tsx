"use client";

import { ArrowLink } from "@/components/Chrome";
import { useT, type MsgKey } from "@/lib/i18n";

const ROLES: { title: MsgKey; steps: MsgKey[]; cls: string }[] = [
  { title: "how.flT", steps: ["how.fl1", "how.fl2", "how.fl3", "how.fl4"], cls: "bg-ink text-white" },
  { title: "how.clT", steps: ["how.cl1", "how.cl2", "how.cl3", "how.cl4"], cls: "bg-white text-ink border border-line" },
];
const FAQ: [MsgKey, MsgKey][] = [
  ["how.q1", "how.a1"],
  ["how.q2", "how.a2"],
  ["how.q3", "how.a3"],
  ["how.q4", "how.a4"],
  ["how.q5", "how.a5"],
];

export default function HowItWorks() {
  const { t } = useT();
  return (
    <div className="mx-auto max-w-6xl space-y-20 px-5 py-14 sm:py-20">
      <header className="max-w-3xl">
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-ink/50">{t("how.kicker")}</p>
        <h1 className="mt-3 text-5xl font-semibold tracking-[-0.035em] sm:text-7xl">
          {t("how.title")}
          <span className="font-serif font-normal italic text-brand-600">.</span>
        </h1>
        <p className="mt-5 text-lg text-ink/60">{t("how.lead")}</p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        {ROLES.map((r) => (
          <div key={r.title} className={` p-8 ${r.cls}`}>
            <h2 className="text-2xl font-semibold tracking-tight">{t(r.title)}</h2>
            <ol className="mt-6 space-y-4">
              {r.steps.map((s, i) => (
                <li key={s} className="grid grid-cols-[2.5rem_1fr] items-baseline">
                  <span className="font-serif text-2xl italic opacity-50">0{i + 1}</span>
                  <span className="leading-relaxed opacity-90">{t(s)}</span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className=" bg-bo-yellow p-8 text-ink">
          <h2 className="text-2xl font-semibold tracking-tight">{t("how.arbT")}</h2>
          <p className="mt-3 leading-relaxed">{t("how.arbB")}</p>
        </div>
        <div className=" bg-brand-600 p-8 text-white">
          <p className="text-6xl font-semibold tracking-[-0.04em]">5%</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">{t("how.feeT")}</h2>
          <p className="mt-3 leading-relaxed text-white/80">{t("how.feeB")}</p>
        </div>
      </section>

      <section className="grid gap-10 lg:grid-cols-[1fr_1.6fr]">
        <h2 className="text-4xl font-semibold tracking-[-0.03em]">{t("how.faqT")}</h2>
        <div className="border-t border-ink">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group border-b border-line py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold">
                {t(q)}
                <span className="grid h-8 w-8 shrink-0 place-items-center bg-white transition group-open:rotate-45" aria-hidden>
                  +
                </span>
              </summary>
              <p className="mt-3 max-w-2xl leading-relaxed text-ink/60">{t(a)}</p>
            </details>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <ArrowLink href="/app">{t("nav.openApp")}</ArrowLink>
        <ArrowLink href="/verificar" variant="light">
          {t("nav.verify")}
        </ArrowLink>
      </div>
    </div>
  );
}
