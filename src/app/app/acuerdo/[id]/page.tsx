import Link from "next/link";
import AgreementDetail from "@/components/AgreementDetail";

// Reads a runtime id and client-side wallet state, so it is rendered on demand.
export const instant = false;

const NON_NEG_INT_RE = /^\d+$/;

export default async function AgreementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = NON_NEG_INT_RE.test(id) ? Number(id) : NaN;
  if (!Number.isSafeInteger(parsed)) {
    return (
      <div className="border border-line bg-white p-8 text-center">
        <p className="font-semibold text-ink">Acuerdo no encontrado</p>
        <p className="mt-1 text-sm text-ink/60">El identificador “{id}” no es un número de acuerdo válido.</p>
        <Link href="/app" className="mt-4 inline-block text-sm text-brand-700 underline">
          ← Mis acuerdos
        </Link>
      </div>
    );
  }
  return <AgreementDetail id={parsed} />;
}
