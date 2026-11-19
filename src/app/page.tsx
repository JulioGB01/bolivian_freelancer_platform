"use client";

// Landing. Structure taken from the references and the DeFi landings studied:
//   split hero with an agreement "sheet" (hairline data rows) → the three entrances →
//   live contract totals (the page's one animated moment) → four steps → security → modes → FAQ → close.
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import ProtocolStats from "@/components/ProtocolStats";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { EXPLORER_URL, ESCROW_CONTRACT_ID } from "@/lib/config";
import { ENTRANCES, SWATCH } from "@/lib/entrance";
import { useT, type MsgKey } from "@/lib/i18n";
import { setMode, useMode, type Mode } from "@/lib/mode";
import { cn } from "@/lib/utils";

const STEPS: [MsgKey, MsgKey][] = [
  ["home.s1t", "home.s1b"],
  ["home.s2t", "home.s2b"],
  ["home.s3t", "home.s3b"],
  ["home.s4t", "home.s4b"],
];
const SECURITY: [MsgKey, MsgKey][] = [
  ["land.sec1t", "land.sec1b"],
  ["land.sec2t", "land.sec2b"],
  ["land.sec3t", "land.sec3b"],
  ["land.sec4t", "land.sec4b"],
];
const FAQ: [MsgKey, MsgKey][] = [
  ["land.q1", "land.a1"],
  ["land.q2", "land.a2"],
  ["land.q3", "how.arbB"],
  ["land.q4", "land.a4"],
  ["land.q5", "land.a5"],
  ["land.q6", "land.a6"],
];

function Kicker({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("font-mono text-[11px] font-medium tracking-[0.18em] text-ink/50 uppercase", className)}>{children}</p>;
}

export default function Home() {
  const { t } = useT();
  const mode = useMode();

  return (
    <div className="space-y-24 pb-8 sm:space-y-32">
      {/* Hero: headline left, agreement sheet right */}
      <section className="mx-auto max-w-6xl px-5 pt-10 sm:pt-16">
        <div className="grid gap-12 lg:grid-cols-[1.35fr_1fr] lg:gap-16">
          <div className="flex flex-col justify-between">
            <div>
              <Kicker className="flex items-center gap-3 text-ink/60">
                <span className="bo-stripe inline-block h-1.5 w-8" aria-hidden />
                {t("land.kicker")}
              </Kicker>
              <h1 className="mt-7 text-[2.9rem] leading-[0.95] font-semibold tracking-[-0.045em] sm:text-7xl lg:text-[5.6rem]">
                {t("home.title1")}
                <span className="font-serif font-normal tracking-[-0.02em] text-bo-green italic">{t("home.titleLocked")}</span>
                {t("home.title2")}
              </h1>
            </div>
            <div className="mt-10 grid gap-8 border-t border-ink pt-6 sm:grid-cols-[1fr_auto] sm:items-end">
              <p className="max-w-md text-base leading-relaxed text-ink/65">{t("home.lead")}</p>
              <div className="flex flex-wrap gap-2">
                <Button asChild size="lg">
                  <Link href="/freelancer">
                    {t("ent.freelancer.cta")} <ArrowUpRight />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/como-funciona">{t("nav.how")}</Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Agreement sheet with hairline rows (example values, labelled as such) */}
          <div className="relative self-end" aria-hidden>
            <div className="border border-ink bg-white">
              <div className="flex items-center justify-between border-b border-ink px-5 py-3">
                <Kicker>{t("land.fichaK")}</Kicker>
                <span className="flex gap-1">
                  <span className="size-2 bg-bo-red" />
                  <span className="size-2 bg-bo-yellow" />
                  <span className="size-2 bg-bo-green" />
                </span>
              </div>
              <dl className="divide-y divide-line px-5 text-sm">
                <Row k={t("land.fRow1")} v={t("home.exampleTitle")} />
                <Row k={t("land.fRow3")} v={t("land.fRow3v")} mono />
              </dl>
              <div className="mx-5 my-4 bg-ink p-5 text-white">
                <p className="font-mono text-[11px] tracking-[0.18em] text-white/50 uppercase">{t("land.fRow2")}</p>
                <p className="mt-2 text-5xl font-semibold tracking-[-0.04em] tabular-nums">
                  400<span className="text-white/35">.00</span>
                  <span className="ml-2 font-mono text-sm font-normal tracking-normal text-lime">USDC</span>
                </p>
                <div className="mt-4 grid grid-cols-3 gap-1">
                  <span className="h-1.5 bg-white/60" />
                  <span className="h-1.5 bg-lime" />
                  <span className="h-1.5 bg-white/15" />
                </div>
              </div>
              <div className="px-5 pb-2">
                <Kicker className="pb-1">{t("land.fRow4")}</Kicker>
                <ul className="divide-y divide-line text-sm">
                  {(
                    [
                      ["home.ex1", "st.paid", "bg-ink text-white"],
                      ["home.ex2", "st.locked", "bg-bo-green text-white"],
                      ["home.ex3", "st.notFunded", "border border-line text-ink/60"],
                    ] as [MsgKey, MsgKey, string][]
                  ).map(([title, status, cls], i) => (
                    <li key={title} className="flex items-center justify-between py-3">
                      <span className="flex items-baseline gap-3">
                        <span className="font-serif text-ink/40 italic">0{i + 1}</span>
                        {t(title)}
                      </span>
                      <span className={cn("px-2 py-0.5 text-[11px] font-semibold", cls)}>{t(status)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="absolute -bottom-4 -left-4 -z-10 h-full w-full border border-ink/20" />
          </div>
        </div>
      </section>

      {/* Three entrances */}
      <section className="mx-auto max-w-6xl px-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Kicker>{t("ent.kicker")}</Kicker>
            <h2 className="mt-3 text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">{t("ent.title")}</h2>
          </div>
        </div>
        <div className="mt-8 grid border border-ink md:grid-cols-3">
          {ENTRANCES.map((e, i) => (
            <Link
              key={e.id}
              href={e.href}
              className={cn(
                "group relative flex min-h-72 flex-col justify-between bg-white p-7 transition-colors hover:bg-paper",
                i > 0 && "border-t border-ink md:border-t-0 md:border-l",
              )}
            >
              <span className={cn("absolute inset-x-0 top-0 h-1.5", SWATCH[e.color].bar)} aria-hidden />
              <div className="flex items-start justify-between pt-2">
                <span className="font-mono text-[11px] tracking-[0.18em] text-ink/50">{e.n}</span>
                <span className="grid size-9 place-items-center border border-ink transition-colors group-hover:bg-ink group-hover:text-white">
                  <ArrowUpRight className="size-4" />
                </span>
              </div>
              <div>
                <h3 className="text-3xl font-semibold tracking-[-0.03em]">{t(e.name)}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink/60">{t(e.blurb)}</p>
                <p className="mt-6 text-sm font-semibold underline decoration-ink/25 underline-offset-4 group-hover:decoration-ink">{t(e.cta)}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Live contract totals: the page's one animated moment */}
      <ProtocolStats />

      {/* Four steps */}
      <section className="mx-auto max-w-6xl px-5">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Kicker>{t("land.howK")}</Kicker>
            <h2 className="mt-3 max-w-xl text-4xl leading-[1.02] font-semibold tracking-[-0.03em] sm:text-5xl">{t("land.howT")}</h2>
          </div>
          <Button asChild variant="outline">
            <Link href="/como-funciona">
              {t("nav.how")} <ArrowUpRight />
            </Link>
          </Button>
        </div>
        <ol className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(([title, body], i) => (
            <li
              key={title}
              className={cn("flex min-h-60 flex-col justify-between p-6", i === 0 ? "bg-ink text-white" : "border border-line bg-white")}
            >
              <span className={cn("font-serif text-4xl italic", i === 0 ? "text-lime" : "text-ink/30")}>0{i + 1}</span>
              <div>
                <p className="text-lg font-semibold">{t(title)}</p>
                <p className={cn("mt-2 text-sm leading-relaxed", i === 0 ? "text-white/65" : "text-ink/60")}>{t(body)}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Security */}
      <section className="bg-ink py-20 text-white sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 lg:grid-cols-[1fr_1.5fr]">
          <div className="flex flex-col justify-between gap-8">
            <div>
              <Kicker className="text-white/50">{t("land.secK")}</Kicker>
              <h2 className="mt-3 text-4xl leading-[1.02] font-semibold tracking-[-0.03em] sm:text-5xl">
                {t("land.secT")}
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="lime">
                <Link href="/verificar">
                  {t("land.verifyCta")} <ArrowUpRight />
                </Link>
              </Button>
              <Button asChild variant="outline-light">
                <a href={`${EXPLORER_URL}/contract/${ESCROW_CONTRACT_ID}`} target="_blank" rel="noreferrer noopener">
                  Stellar Expert <ArrowUpRight />
                </a>
              </Button>
            </div>
          </div>
          <dl className="grid border-t border-white/20 sm:grid-cols-2">
            {SECURITY.map(([title, body], i) => (
              <div key={title} className={cn("border-b border-white/20 py-7 sm:pr-8", i % 2 === 1 && "sm:border-l sm:pl-8")}>
                <dt className="flex items-center gap-3 text-lg font-semibold">
                  <span className={cn("size-2", ["bg-bo-red", "bg-bo-yellow", "bg-bo-green", "bg-lime"][i])} aria-hidden />
                  {t(title)}
                </dt>
                <dd className="mt-3 text-sm leading-relaxed text-white/60">{t(body)}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Two ways to try it */}
      <section className="mx-auto max-w-6xl px-5">
        <Kicker>{t("home.tryKicker")}</Kicker>
        <h2 className="mt-3 text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">{t("home.modesTitle")}</h2>
        <div className="mt-8 grid border border-ink md:grid-cols-2">
          {(
            [
              ["demo", "home.modeDemoT", "home.modeDemoB"],
              ["testnet", "home.modeTestT", "home.modeTestB"],
            ] as [Mode, MsgKey, MsgKey][]
          ).map(([m, title, body], i) => {
            const active = mode === m;
            return (
              <div key={m} className={cn("flex flex-col p-7", active ? "bg-white" : "bg-paper", i > 0 && "border-t border-ink md:border-t-0 md:border-l")}>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-xl font-semibold">{t(title)}</h3>
                  {active && <span className="bg-ink px-2.5 py-1 font-mono text-[10px] tracking-wider text-lime uppercase">{t("home.current")}</span>}
                </div>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-ink/60">{t(body)}</p>
                {!active && (
                  <Button className="mt-6 self-start" size="sm" onClick={() => setMode(m)}>
                    {t("home.useThis")} <ArrowUpRight />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto grid max-w-6xl gap-10 px-5 lg:grid-cols-[1fr_1.6fr]">
        <div>
          <Kicker>{t("land.faqK")}</Kicker>
          <h2 className="mt-3 text-4xl leading-[1.02] font-semibold tracking-[-0.03em] sm:text-5xl">
            {t("land.faqT")}
            <span className="font-serif font-normal text-bo-green italic">.</span>
          </h2>
        </div>
        <Accordion type="single" collapsible className="border-t border-ink">
          {FAQ.map(([q, a]) => (
            <AccordionItem key={q} value={q} className="border-line">
              <AccordionTrigger className="py-5 text-base font-semibold hover:no-underline">{t(q)}</AccordionTrigger>
              <AccordionContent className="max-w-2xl pb-5 text-sm leading-relaxed text-ink/65">{t(a)}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* Closing call to action */}
      <section className="px-3 sm:px-5">
        <div className="relative mx-auto max-w-6xl overflow-hidden bg-bo-green px-6 py-14 text-white sm:px-12 sm:py-20">
          <h2 className="max-w-3xl text-4xl leading-[1.02] font-semibold tracking-[-0.03em] sm:text-6xl">
            {t("home.ctaBandT")}
            <span className="font-serif font-normal text-bo-yellow italic">{t("home.ctaBandAccent")}</span>.
          </h2>
          <p className="mt-5 max-w-xl text-white/75">{t("home.ctaBandB")}</p>
          <div className="mt-9 flex flex-wrap gap-2">
            {ENTRANCES.map((e) => (
              <Button key={e.id} asChild variant={e.id === "freelancer" ? "light" : "outline-light"}>
                <Link href={e.href}>
                  {t(e.cta)} <ArrowUpRight />
                </Link>
              </Button>
            ))}
          </div>
          <div className="bo-stripe absolute inset-x-0 bottom-0 h-1.5" aria-hidden />
        </div>
      </section>
    </div>
  );
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="grid grid-cols-[6.5rem_1fr] py-3">
      <dt className="text-ink/50">{k}</dt>
      <dd className={cn("text-right font-medium", mono && "font-mono text-xs leading-5")}>{v}</dd>
    </div>
  );
}
