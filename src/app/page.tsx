import Link from "next/link";

const values = [
  {
    title: "All leads in one CRM",
    text: "WhatsApp, calls, website, ads, portals, and walk-ins sync into one real-estate lead timeline.",
  },
  {
    title: "One AI command box",
    text: "Ask what needs attention, draft follow-ups, assign leads, and update CRM records in plain language.",
  },
  {
    title: "Simple frontend, synced backend",
    text: "Users see one calm workspace while Twenty, wacrm, Dograh, voice, and AI adapters stay in sync behind the scenes.",
  },
];

const flows = ["Capture", "Dedupe", "Sync", "Ask AI", "Approve", "Follow up"];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f4ee] text-[#111827]">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-6 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between rounded-full bg-white/80 px-4 py-3 shadow-sm ring-1 ring-white">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-[#111827] text-sm font-semibold text-white">P</div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#b88a2d]">Pratap AI</p>
              <p className="text-sm font-semibold">Real Estate AI CRM</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="hidden rounded-full px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 sm:inline-flex">Demo</Link>
            <Link href="/signup" className="rounded-full bg-[#111827] px-4 py-2 text-sm font-semibold text-white">Start free</Link>
          </div>
        </nav>

        <div className="grid flex-1 items-center gap-10 py-14 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="inline-flex rounded-full bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#9a6b19] ring-1 ring-[#eadfca]">Built for real estate teams</p>
            <h1 className="mt-6 max-w-4xl text-5xl font-semibold leading-[0.95] tracking-[-0.07em] sm:text-7xl">
              One AI workspace for leads, WhatsApp, calls, and CRM.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              A broker signs up, connects channels, and manages every buyer, seller, task, message, call, and property match from one simple AI command center.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/signup" className="rounded-full bg-[#111827] px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_38px_rgba(17,24,39,0.18)]">Create workspace</Link>
              <Link href="/dashboard" className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#111827] ring-1 ring-slate-200">View live demo</Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-2">
              {flows.map((flow) => (
                <span key={flow} className="rounded-full bg-white/75 px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-white">{flow}</span>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-5 shadow-[0_28px_90px_rgba(15,23,42,0.12)] ring-1 ring-white">
            <div className="rounded-[1.5rem] bg-[#111827] p-5 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#e8c871]">AI command center</p>
              <div className="mt-5 rounded-2xl bg-white/10 p-4 text-sm leading-6 text-white/80">
                What should my team focus on today?
              </div>
              <div className="mt-4 rounded-2xl bg-white p-4 text-[#111827]">
                <p className="text-sm font-semibold">3 priorities found</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">Amit needs a site visit, Priyanka needs a WhatsApp shortlist, and Rahul needs a voice retry. I can draft actions and update CRM after approval.</p>
              </div>
            </div>
            <div className="mt-4 grid gap-3">
              {values.map((item) => (
                <div key={item.title} className="rounded-2xl bg-[#f8fafc] p-4 ring-1 ring-slate-200">
                  <p className="font-semibold tracking-[-0.02em]">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
