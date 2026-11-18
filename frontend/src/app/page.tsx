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
    <div className="space-y-10">
      <section className="rounded-2xl bg-gradient-to-br from-indigo-700 via-indigo-600 to-emerald-600 p-8 text-white shadow-lg sm:p-10">
        <p className="text-sm font-medium uppercase tracking-wide text-indigo-100">For Bolivian freelancers</p>
        <h1 className="mt-2 max-w-2xl text-3xl font-bold leading-tight sm:text-4xl">
          See your client&apos;s money locked before you start working.
        </h1>
        <p className="mt-4 max-w-2xl text-indigo-50">
          Your client locks USDC for each milestone in a Soroban smart contract on Stellar. You can
          check it at any time, and it is released when they approve, when the review window ends
          without a dispute, or by an arbiter if there is one.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/agreements/new"
            className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-indigo-700 shadow hover:bg-indigo-50"
          >
            Create an agreement
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg border border-white/50 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
          >
            View my agreements
          </Link>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">How it works</h2>
        <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <li key={s.n} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-indigo-600 text-sm font-bold text-white">
                {s.n}
              </span>
              <p className="mt-3 font-medium text-slate-900">{s.title}</p>
              <p className="mt-1 text-sm text-slate-600">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-semibold text-slate-900">{f.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{f.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
