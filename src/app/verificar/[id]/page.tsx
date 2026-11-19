import VerifyView from "@/components/VerifyView";

// Reads a runtime id, so it is rendered on demand.
export const instant = false;

export default async function VerifyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <VerifyView id={Number(id)} />;
}
