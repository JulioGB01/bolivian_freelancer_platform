"use client";

// Home of one role's area: totals at the top, then that role's agreements.
import { useEffect, useState } from "react";
import Link from "next/link";
import NumberFlow from "@number-flow/react";
import AgreementCard from "./AgreementCard";
import { ESCROW_CHANGED, getEscrow, lockedAmountOf } from "@/lib/escrow";
import { errorMessage } from "@/lib/errors";
import { BPS_DENOMINATOR, USDC_DECIMALS, formatAmount } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { actionsNeeded } from "@/lib/status";
import { useNow } from "@/lib/useNow";
import { useMode } from "@/lib/mode";
import { useWallet } from "@/lib/useWallet";
import type { Agreement } from "@/lib/types";

export default function AreaHome({ area }: { area: "freelancer" | "client" }) {
  const { t } = useT();
  const { wallet } = useWallet();
  const now = useNow();
  const [all, setAll] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!wallet) return;
    const load = () =>
      getEscrow()
        .agreementsOf(wallet.address)
        .then((a) => {
          setAll(a);
          setError("");
        })
        .catch((e: unknown) => setError(errorMessage(e, t)))
        .finally(() => setLoading(false));
    void load();
    window.addEventListener(ESCROW_CHANGED, load);
    return () => window.removeEventListener(ESCROW_CHANGED, load);
  }, [wallet, t]);

  const isFreelancer = area === "freelancer";

  if (!wallet) {
    return (
      <Header area={area}>
        <div className=" border border-line bg-white p-10 text-center text-ink/60">{t("dash.connect")}</div>
      </Header>
    );
  }
  if (loading) return <Header area={area}><p className="text-ink/50">{t("ag.loading")}</p></Header>;

  const mine = all.filter((a) => (isFreelancer ? a.freelancer : a.client) === wallet.address);
  const role = isFreelancer ? "freelancer" : "client";
  const locked = mine.reduce((s, a) => s + lockedAmountOf(a), 0);
  const todo = mine.reduce((s, a) => s + actionsNeeded(a, role, now), 0);
  const settledNet = mine.reduce(
    (s, a) =>
      s +
      a.milestones
        .filter((m) => m.status === "Released")
        .reduce((x, m) => x + m.amount - Math.floor((m.amount * a.feeBps) / BPS_DENOMINATOR), 0),
    0,
  );
  const proposals = mine.filter((a) => a.milestones.every((m) => m.status === "Pending"));
  const active = isFreelancer ? mine : mine.filter((a) => !proposals.includes(a));

  return (
    <Header area={area}>
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label={isFreelancer ? t("dash.lockedForMe") : t("dash.lockedByMe")} value={locked / 10 ** USDC_DECIMALS} money accent />
        {isFreelancer ? (
          <Stat label={t("fl.paid")} value={settledNet / 10 ** USDC_DECIMALS} money />
        ) : (
          <Stat label={t("cl.proposals")} value={proposals.length} />
        )}
        <Stat label={t("dash.waiting")} value={todo} suffix={t("dash.actions", { n: todo }).replace(String(todo), "").trim()} />
      </div>

      {error && <p className=" bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {!isFreelancer && proposals.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-ink/50">{t("cl.proposals")}</h2>
          {proposals.map((a) => (
            <Link
              key={a.id}
              href={`/app/acuerdo/${a.id}`}
              className="flex flex-wrap items-center justify-between gap-3 bg-ink p-5 text-white transition hover:bg-black"
            >
              <div>
                <p className="font-semibold">{a.title}</p>
                <p className="text-sm text-white/60">
                  {a.milestones.length} {t("new.milestones").toLowerCase()} · {formatAmount(a.milestones.reduce((s, m) => s + m.amount, 0))} USDC
                </p>
              </div>
              <span className=" bg-lime px-4 py-2 text-sm font-semibold text-ink">{t("cl.review")} ↗</span>
            </Link>
          ))}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-ink/50">{isFreelancer ? t("fl.list") : t("cl.active")}</h2>
        {active.length === 0 ? (
          <div className=" border border-dashed border-ink/20 bg-white p-10 text-center">
            <p className="text-sm text-ink/60">{isFreelancer ? t("fl.empty") : proposals.length > 0 ? t("cl.emptyActive") : t("cl.empty")}</p>
            {isFreelancer && (
              <Link href="/app/nuevo" className="mt-4 inline-block bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-black">
                {t("dash.emptyCta")}
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-3">
            {active.map((a) => (
              <AgreementCard key={a.id} agreement={a} viewer={wallet.address} now={now} />
            ))}
          </div>
        )}
      </section>
    </Header>
  );
}

function Header({ area, children }: { area: "freelancer" | "client"; children: React.ReactNode }) {
  const { t } = useT();
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-ink/50">{area === "freelancer" ? t("area.freelancer") : t("area.client")}</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">{area === "freelancer" ? t("fl.title") : t("cl.title")}</h1>
          <p className="mt-2 text-ink/60">{area === "freelancer" ? t("fl.lead") : t("cl.lead")}</p>
        </div>
        {area === "freelancer" && (
          <div className="flex flex-wrap gap-2">
          <ProfileLink />
          <Link href="/app/nuevo" className=" bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-black">
            {t("dash.new")}
          </Link>
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

function Stat({ label, value, money, suffix, accent }: { label: string; value: number; money?: boolean; suffix?: string; accent?: boolean }) {
  return (
    <div className={` border p-6 ${accent ? "border-ink bg-ink text-white" : "border-line bg-white"}`}>
      <p className={`text-xs font-medium uppercase tracking-wider ${accent ? "text-white/60" : "text-ink/50"}`}>{label}</p>
      <p className={`mt-3 text-3xl font-semibold tracking-tight tabular-nums ${accent ? "text-lime" : "text-ink"}`}>
        <NumberFlow value={value} locales="en-US" format={money ? { minimumFractionDigits: 2, maximumFractionDigits: 2 } : undefined} />
        {(money || suffix) && <span className={`ml-2 font-mono text-sm font-normal ${accent ? "text-white/50" : "text-ink/40"}`}>{money ? "USDC" : suffix}</span>}
      </p>
    </div>
  );
}

function ProfileLink() {
  const { t } = useT();
  const { wallet } = useWallet();
  const mode = useMode();
  if (!wallet) return null;
  return (
    <Link
      href={`/perfil/${wallet.address}${mode === "demo" ? "?demo=1" : ""}`}
      className="border border-ink px-5 py-2.5 text-sm font-semibold hover:bg-ink hover:text-white"
    >
      {t("prof.mine")} ↗
    </Link>
  );
}
