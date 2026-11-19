import AgreementDetail from "@/components/AgreementDetail";

// Reads a runtime id and client-side wallet state, so it is rendered on demand.
export const instant = false;

export default async function AgreementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AgreementDetail id={Number(id)} />;
}
