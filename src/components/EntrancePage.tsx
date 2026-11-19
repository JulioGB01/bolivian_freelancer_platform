"use client";

// One public entrance (freelancer, client or team). Left: what this person does here, in the
// entrance's flag color. Right: the sign-in sheet (demo account or real testnet wallet).
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowUpRight, Fingerprint, Lock, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ENTRANCES, SWATCH, entrance, type EntranceId } from "@/lib/entrance";
import { errorMessage } from "@/lib/errors";
import { shortAddress } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { setMode, useMode, type Mode } from "@/lib/mode";
import { useWallet } from "@/lib/useWallet";
import { DEMO_IDENTITIES, getConnectedWallet } from "@/lib/wallet";
import { cn } from "@/lib/utils";

export default function EntrancePage({ id }: { id: EntranceId }) {
  const { t } = useT();
  const router = useRouter();
  const mode = useMode();
  const e = entrance(id);
  const sw = SWATCH[e.color];
  const { wallet, connectAs, connectReal, connectPasskey, disconnectWallet } = useWallet();
  const [busy, setBusy] = useState<"kit" | "passkey" | null>(null);
  const [denied, setDenied] = useState(false);
  const isTeam = id === "equipo";

  function enter() {
    toast.success(t("ent.welcome", { role: t(e.name) }));
    router.push(e.area);
  }

  // Team entrance: only the contract's arbiter wallet gets through.
  function checkAndEnter() {
    const w = getConnectedWallet();
    if (isTeam && w?.role !== "arbiter") {
      setDenied(true);
      toast.error(t("ent.notArbiter"));
      return;
    }
    setDenied(false);
    enter();
  }

  function onDemo() {
    const identity = DEMO_IDENTITIES.find((d) => d.role === e.role);
    if (identity) connectAs(identity);
    enter();
  }

  async function onTestnet(kind: "kit" | "passkey") {
    setBusy(kind);
    try {
      await (kind === "kit" ? connectReal() : connectPasskey());
      checkAndEnter();
    } catch (err) {
      const m = err && typeof err === "object" && "message" in err ? String((err as { message: unknown }).message) : "";
      if (!/closed the modal/i.test(m)) toast.error(errorMessage(err, t));
    } finally {
      setBusy(null);
    }
  }

  const others = ENTRANCES.filter((x) => x.id !== id);
  const connectedHere = wallet && (mode === "testnet" || wallet.role === e.role);

  return (
    <div className="mx-auto max-w-6xl px-3 pt-4 pb-10 sm:px-5">
      <div className="grid border border-ink lg:grid-cols-[1.15fr_1fr]">
        {/* What you do here */}
        <section className={cn("relative flex flex-col justify-between gap-12 p-7 sm:p-12", sw.panel)}>
          {isTeam && <span className="absolute inset-y-0 left-0 w-1.5 bg-bo-red" aria-hidden />}
          <div>
            <p className="flex items-center gap-3 font-mono text-[11px] font-medium tracking-[0.18em] uppercase opacity-70">
              <span>{e.n} / 03</span>
              {isTeam && (
                <span className="inline-flex items-center gap-1.5 bg-bo-red px-2 py-0.5 text-white opacity-100">
                  <Lock className="size-3" /> {t("ent.restricted")}
                </span>
              )}
            </p>
            <h1 className="mt-6 text-6xl leading-[0.95] font-semibold tracking-[-0.04em] sm:text-7xl">{t(e.name)}</h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed opacity-80">{t(e.blurb)}</p>
          </div>
          <div>
            <p className="font-mono text-[11px] font-medium tracking-[0.18em] uppercase opacity-60">{t("ent.youCan")}</p>
            <ol className="mt-3 border-t border-current/25">
              {e.points.map((p, i) => (
                <li key={p} className="grid grid-cols-[3rem_1fr] border-b border-current/25 py-3.5 text-[15px]">
                  <span className="font-serif text-xl italic opacity-60">0{i + 1}</span>
                  {t(p)}
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Sign-in sheet */}
        <section className="flex flex-col bg-white p-7 sm:p-12">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold tracking-tight">{t("ent.login")}</h2>
            <div className="flex border border-ink text-xs font-semibold" role="group" aria-label={t("mode.label")}>
              {(["demo", "testnet"] as Mode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={mode === m}
                  onClick={() => mode !== m && setMode(m)}
                  className={cn("px-3 py-1.5 uppercase", mode === m ? "bg-ink text-white" : "text-ink/60 hover:text-ink")}
                >
                  {m === "demo" ? t("ent.modeDemo") : t("ent.modeTestnet")}
                </button>
              ))}
            </div>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-ink/60">{mode === "demo" ? t("ent.demoNote") : t("ent.testnetNote")}</p>

          <div className="mt-8 flex-1 space-y-3">
            {connectedHere ? (
              <>
                <div className="flex items-center justify-between border border-line bg-paper px-4 py-3">
                  <span className="text-xs text-ink/60">{t("ent.connected")}</span>
                  <span className="font-mono text-sm">{wallet.kind === "demo" ? t(e.name) + " (demo)" : shortAddress(wallet.address)}</span>
                </div>
                <Button size="lg" className="w-full justify-between" onClick={mode === "demo" ? enter : checkAndEnter}>
                  {t("ent.continue")} <ArrowUpRight />
                </Button>
                <Button variant="link" size="sm" className="px-0" onClick={() => { disconnectWallet(); setDenied(false); }}>
                  {t("ent.switch")}
                </Button>
              </>
            ) : mode === "demo" ? (
              <Button size="lg" className="w-full justify-between" onClick={onDemo}>
                {t("ent.demoBtn")} <ArrowUpRight />
              </Button>
            ) : (
              <>
                <Button size="lg" className="w-full justify-between" disabled={busy !== null} onClick={() => onTestnet("kit")}>
                  <span className="inline-flex items-center gap-2"><Wallet /> {busy === "kit" ? t("wallet.connecting") : t("wallet.connect")}</span>
                  <ArrowUpRight />
                </Button>
                <Button variant="outline" size="lg" className="w-full justify-between" disabled={busy !== null} onClick={() => onTestnet("passkey")}>
                  <span className="inline-flex items-center gap-2"><Fingerprint /> {busy === "passkey" ? t("wallet.connecting") : t("ent.passkey")}</span>
                  <ArrowUpRight />
                </Button>
              </>
            )}
            {denied && <p className="border-l-2 border-bo-red bg-bo-red/5 px-3 py-2 text-sm text-ink">{t("ent.notArbiter")}</p>}
          </div>

          <div className="mt-10 border-t border-line pt-5">
            <p className="font-mono text-[11px] font-medium tracking-[0.18em] text-ink/50 uppercase">{t("ent.other")}</p>
            <div className="mt-3 grid grid-cols-2 gap-px bg-line">
              {others.map((o) => (
                <Link key={o.id} href={o.href} className="group flex items-center justify-between bg-white py-3 pr-1 text-sm font-semibold hover:bg-paper">
                  <span className="flex items-center gap-2">
                    <span className={cn("h-2.5 w-2.5", SWATCH[o.color].dot)} aria-hidden />
                    {t(o.name)}
                  </span>
                  <ArrowUpRight className="size-4 transition group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
