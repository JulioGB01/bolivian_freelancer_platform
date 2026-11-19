// Shared container for the app (freelancer, client and arbiter areas).
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-5xl px-5 py-10 sm:py-12">{children}</div>;
}
