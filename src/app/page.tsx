import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-[#f7f4ee] text-[#111827]">
      <nav className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-[#111827] text-xs font-semibold text-white">P</div>
          <span className="text-sm font-semibold tracking-tight">Pratap AI</span>
        </div>
        <Link
          href="/dashboard"
          className="text-sm font-medium text-slate-600 transition hover:text-[#111827]"
        >
          Sign in →
        </Link>
      </nav>

      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 pb-24 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#b88a2d]">
          For real estate teams
        </p>
        <h1 className="mt-5 text-5xl font-semibold leading-[1.02] tracking-[-0.05em] sm:text-6xl">
          Real estate,
          <br />
          run by AI.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-7 text-slate-600">
          One workspace for leads, WhatsApp, calls, and CRM. Ask in plain language — your AI handles the rest.
        </p>
        <Link
          href="/onboarding"
          className="mt-9 inline-flex items-center gap-2 rounded-full bg-[#111827] px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_38px_rgba(17,24,39,0.18)] transition hover:bg-black"
        >
          Start free
          <span aria-hidden>→</span>
        </Link>
        <Link
          href="/dashboard"
          className="mt-4 text-sm font-medium text-slate-500 transition hover:text-[#111827]"
        >
          or see a live demo
        </Link>
      </section>
    </main>
  );
}
