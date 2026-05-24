import Link from "next/link";

const fields = ["Owner name", "Email", "Phone", "Brokerage name", "City"];
const setup = [
  "Create your brokerage workspace",
  "Start with demo real-estate CRM data",
  "Connect WhatsApp/wacrm when ready",
  "Connect voice/Dograh when ready",
  "Sync everything into Twenty CRM as the source of truth",
];

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-[#f7f4ee] px-5 py-6 text-[#111827] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <nav className="flex items-center justify-between">
          <Link href="/" className="text-sm font-semibold text-slate-700">← Back</Link>
          <Link href="/dashboard" className="rounded-full bg-white px-4 py-2 text-sm font-semibold ring-1 ring-slate-200">Skip to demo</Link>
        </nav>

        <section className="mt-10 grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#b88a2d]">Create workspace</p>
            <h1 className="mt-4 text-5xl font-semibold leading-[0.98] tracking-[-0.06em]">Start with one simple AI CRM profile.</h1>
            <p className="mt-5 text-lg leading-8 text-slate-600">The user should not configure three dashboards first. They create one workspace, then the backend syncs WhatsApp, voice, and Twenty CRM around that workspace.</p>
            <div className="mt-6 space-y-3">
              {setup.map((item, index) => (
                <div key={item} className="flex gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#111827] text-xs font-semibold text-white">{index + 1}</span>
                  <span className="text-sm font-medium text-slate-700">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <form className="rounded-[2rem] bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.1)] ring-1 ring-white">
            <h2 className="text-2xl font-semibold tracking-[-0.04em]">Brokerage profile</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Demo signup UI. Production will create tenant, owner role, Twenty real-estate template, and sync credentials vault.</p>
            <div className="mt-6 grid gap-3">
              {fields.map((field) => (
                <label key={field} className="grid gap-2 text-sm font-semibold text-slate-700">
                  {field}
                  <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-normal outline-none focus:border-[#c9a961]" placeholder={field} />
                </label>
              ))}
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Main lead source
                <select className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-normal outline-none focus:border-[#c9a961]">
                  <option>WhatsApp</option>
                  <option>Meta / Google ads</option>
                  <option>99acres / MagicBricks</option>
                  <option>Website forms</option>
                  <option>Walk-ins and referrals</option>
                </select>
              </label>
              <Link href="/dashboard" className="mt-3 rounded-2xl bg-[#111827] px-5 py-3 text-center text-sm font-semibold text-white">Create demo workspace</Link>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
