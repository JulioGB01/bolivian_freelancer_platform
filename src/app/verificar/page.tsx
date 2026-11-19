"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useT } from "@/lib/i18n";

export default function VerifySearch() {
  const { t } = useT();
  const router = useRouter();
  const [id, setId] = useState("");
  const valid = /^\d+$/.test(id.trim());

  return (
    <div className="mx-auto max-w-2xl px-5 py-16 sm:py-24">
      <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-ink/50">{t("ver.kicker")}</p>
      <h1 className="mt-3 text-5xl font-semibold tracking-[-0.03em] sm:text-6xl">{t("ver.title")}</h1>
      <p className="mt-4 text-lg text-ink/60">{t("ver.lead")}</p>
      <form
        className="mt-8 flex gap-2 bg-white p-2 shadow-sm"
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) router.push(`/verificar/${id.trim()}`);
        }}
      >
        <input
          value={id}
          onChange={(e) => setId(e.target.value)}
          inputMode="numeric"
          placeholder={t("ver.placeholder")}
          aria-label={t("ver.placeholder")}
          className="min-w-0 flex-1 px-4 text-lg focus:outline-none"
        />
        <button type="submit" disabled={!valid} className=" bg-ink px-6 py-3 text-sm font-semibold text-white hover:bg-black disabled:opacity-40">
          {t("ver.go")}
        </button>
      </form>
    </div>
  );
}
