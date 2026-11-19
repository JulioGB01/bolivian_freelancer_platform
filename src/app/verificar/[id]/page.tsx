import Link from "next/link";
import VerifyView from "@/components/VerifyView";

// Reads a runtime id, so it is rendered on demand.
export const instant = false;

const NON_NEG_INT_RE = /^\d+$/;

export default async function VerifyPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ demo?: string }>;
}) {
  const { id } = await params;
  const { demo } = await searchParams;
  const parsed = NON_NEG_INT_RE.test(id) ? Number(id) : NaN;
  if (!Number.isSafeInteger(parsed)) {
    return (
      <div className="mx-auto max-w-4xl px-5 py-14">
        <div className="border border-line bg-white p-8 text-center">
          <p className="font-semibold text-ink">Acuerdo no encontrado</p>
          <p className="mt-1 text-sm text-ink/60">El identificador “{id}” no es un número de acuerdo válido.</p>
          <Link href="/verificar" className="mt-4 inline-block text-sm text-brand-700 underline">
            ← Verificar otro acuerdo
          </Link>
        </div>
      </div>
    );
  }
  return <VerifyView id={parsed} source={demo === "1" ? "demo" : "testnet"} />;
}
