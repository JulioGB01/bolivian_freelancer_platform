import AgreementDetail from "@/components/AgreementDetail";

// This route reads a runtime `id` and client-side wallet state, so it must be
// rendered on demand rather than statically prerendered.
export const instant = false;

export default async function AgreementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AgreementDetail id={Number(id)} />;
}
