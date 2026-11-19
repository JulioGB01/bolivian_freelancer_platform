"use client";

import { useEffect, useState } from "react";
import MilestoneRow from "@/components/MilestoneRow";
import { ESCROW_CHANGED, getEscrow } from "@/lib/escrow";
import { useT } from "@/lib/i18n";
import { useWallet } from "@/lib/useWallet";
import type { Agreement, Config } from "@/lib/types";

export default function ArbiterPage() {
  const { t } = useT();
  const { wallet } = useWallet();
  const [config, setConfig] = useState<Config | null>(null);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    getEscrow().getConfig().then(setConfig).catch(() => undefined);
    getEscrow().listAll().then(setAgreements).catch(() => undefined);
  }, [tick, wallet]);

  useEffect(() => {
    const bump = () => setTick((x) => x + 1);
    window.addEventListener(ESCROW_CHANGED, bump);
    return () => window.removeEventListener(ESCROW_CHANGED, bump);
  }, []);

  if (!wallet) {
    return <Box>{t("arb.connect")}</Box>;
  }

  if (!config) return <p className="text-slate-500">{t("ag.loading")}</p>;

  if (wallet.address !== config.arbiter) {
    return <Box>{t("arb.notArbiter")}</Box>;
  }

  const disputed = agreements.flatMap((a) =>
    a.milestones
      .map((milestone, index) => ({ agreement: a, milestone, index }))
      .filter(({ milestone }) => milestone.status === "Disputed"),
  );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">{t("arb.title")}</h1>
      {disputed.length === 0 ? (
        <Box>{t("arb.none")}</Box>
      ) : (
        disputed.map(({ agreement, milestone, index }) => (
          <div key={`${agreement.id}-${index}`} className="space-y-2">
            <p className="text-sm text-slate-500">{t("arb.row", { id: agreement.id, title: agreement.title, n: index + 1 })}</p>
            <MilestoneRow
              agreement={agreement}
              milestone={milestone}
              index={index}
              role="arbiter"
              onChanged={() => setTick((x) => x + 1)}
            />
          </div>
        ))
      )}
    </div>
  );
}

function Box({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-600">{children}</div>;
}
