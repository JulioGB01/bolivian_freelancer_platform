import ProfileView from "@/components/ProfileView";

// Reads a runtime address, so it is rendered on demand.
export const instant = false;

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ address: string }>;
  searchParams: Promise<{ demo?: string }>;
}) {
  const { address } = await params;
  const { demo } = await searchParams;
  return <ProfileView address={decodeURIComponent(address)} source={demo === "1" ? "demo" : "testnet"} />;
}
