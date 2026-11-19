// Shared container for the app screens (dashboard, agreements, disputes).
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-5xl px-5 py-10 sm:py-14">{children}</div>;
}
