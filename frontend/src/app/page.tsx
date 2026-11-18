import Link from "next/link";

const STEPS = [
  { n: 1, title: "Create the agreement", body: "Split the job into milestones with an amount for each one." },
  { n: 2, title: "Your client locks the money", body: "They lock USDC for a milestone in a smart contract on Stellar." },
  { n: 3, title: "See it, then start", body: "Check the locked funds yourself before you write a single line." },
  { n: 4, title: "Deliver and get paid", body: "Paid when the client approves, or claim it if they stay silent." },
];

const FEATURES = [
  {
    title: "See the money first",
    body: "Every funded milestone is visible on-chain. You never start work wondering whether the client can pay.",
  },
  {
    title: "Rules nobody can change",
    body: "The terms live in a public contract. After the agreement is created, not even the platform can change them.",
  },
  {
    title: "A small fee, fixed up front",
    body: "You see the fee before you create the agreement. You bring your own client, so you don't pay to be found.",
  },
];

export default function Home() {
  return (
    <div className="space-y-20">
      <section className="grid items-center gap-10 pt-4 md:grid-cols-[1.15fr_1fr]">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600">
            <span className="bo-stripe inline-block h-2 w-5 rounded-sm" aria-hidden />
            For Bolivian freelancers
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl">
            See your client&apos;s money <span className="text-brand-600">locked</span> before you start working.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
            Your client locks USDC for each milestone in a smart contract on Stellar. You can check
            it at any time. It is released when they approve, when the review window ends without a
            dispute, or by an arbiter if there is one.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/agreements/new"
              className="rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Create an agreement
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-800 hover:border-brand-600 hover:text-brand-700"
            >
              View my agreements
            </Link>
          </div>
        </div>

        {/* Illustration of the product's core screen, with example values. */}
        <div className="relative" aria-hidden>
          <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-brand-50" />
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Example agreement</p>
            <p className="mt-1 font-semibold text-slate-900">Website redesign</p>
            <div className="mt-5 rounded-xl bg-brand-50 p-4">
              <p className="text-xs font-medium text-brand-800">🔒 Locked in escrow</p>
              <p className="mt-1 text-3xl font-semibold text-brand-800">
                400.00 <span className="text-sm font-medium">USDC</span>
              </p>
              <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-white">
                <div className="w-1/3 bg-slate-400" />
                <div className="w-1/3 bg-brand-600" />
              </div>
            </div>
            <ul className="mt-4 space-y-2 text-sm">
              {[
                ["Design mockups", "Paid", "bg-slate-100 text-slate-700"],
                ["Build pages", "Funds locked", "bg-brand-100 text-brand-800"],
                ["Launch", "Not funded", "bg-amber-50 text-amber-800"],
              ].map(([t, s, c]) => (
                <li key={t} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
                  <span className="text-slate-700">{t}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${c}`}>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">How it works</h2>
        <ol className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <li key={s.n}>
              <span className="grid h-9 w-9 place-items-center rounded-full border-2 border-brand-600 text-sm font-bold text-brand-700">
                {s.n}
              </span>
              <p className="mt-3 font-semibold text-slate-900">{s.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {FEATURES.map((f, i) => (
          <div key={f.title} className="rounded-2xl border border-slate-200 bg-white p-6">
            <span
              className={`block h-1 w-8 rounded-full ${["bg-bo-red", "bg-bo-yellow", "bg-bo-green"][i]}`}
              aria-hidden
            />
            <h3 className="mt-4 font-semibold text-slate-900">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
