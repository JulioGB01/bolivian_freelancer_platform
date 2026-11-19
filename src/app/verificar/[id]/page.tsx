import VerifyView from "@/components/VerifyView";

// Reads a runtime id, so it is rendered on demand.
export const instant = false;

export default async function VerifyPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ demo?: string }>;
}) {
  const { id } = await params;
  const { demo } = await searchParams;
  return <VerifyView id={Number(id)} source={demo === "1" ? "demo" : "testnet"} />;
}
