"use client";

import { useEffect, useState } from "react";
import MilestoneRow from "@/components/MilestoneRow";
import { getEscrow } from "@/lib/escrow";
import { useWallet } from "@/lib/useWallet";
import type { Agreement, Config } from "@/lib/types";

export default function ArbiterPage() {
  const { wallet } = useWallet();
  const [config, setConfig] = useState<Config | null>(null);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    getEscrow().getConfig().then(setConfig);
    getEscrow().listAll().then(setAgreements);
  }, [tick]);

  if (!wallet) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-600">
        Connect as the arbiter to resolve disputes.
      </div>
    );
  }

  if (!config) return <p className="text-slate-500">Loading…</p>;

  if (wallet.address !== config.arbiter) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-600">
        You are not the arbiter for this contract.
      </div>
    );
  }

  const disputed = agreements.flatMap((a) =>
    a.milestones
      .map((milestone, index) => ({ agreement: a, milestone, index }))
      .filter(({ milestone }) => milestone.status === "Disputed"),
  );

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Arbiter panel</h1>
      {disputed.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-600">
          No disputed milestones right now.
        </div>
      ) : (
        disputed.map(({ agreement, milestone, index }) => (
          <div key={`${agreement.id}-${index}`} className="space-y-2">
            <p className="text-sm text-slate-500">
              Agreement #{agreement.id} · {agreement.title} · milestone {index + 1}
            </p>
            <MilestoneRow
              agreement={agreement}
              milestone={milestone}
              index={index}
              role="arbiter"
              onChanged={() => setTick((t) => t + 1)}
            />
          </div>
        ))
      )}
    </div>
  );
}
