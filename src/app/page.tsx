import { automationModules, leads, pipelineStages, properties } from "@/lib/crm-data";

const metrics = [
  { label: "Captured leads", value: "1,248", detail: "+18% this month" },
  { label: "AI calls logged", value: "842", detail: "Hindi + English" },
  { label: "Hot opportunities", value: "96", detail: "₹42.6Cr pipeline" },
  { label: "Avg. speed-to-lead", value: "38s", detail: "from source capture" },
];

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">{children}</span>;
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f6f2e8] text-[#14141a]">
      <section className="border-b border-[#d8ceb6] bg-[#0a0a0b] text-[#f4f1e8]">
        <div className="mx-auto flex max-w-7xl flex-col gap-10 px-6 py-10 lg:px-8">
          <nav className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-[#c9a961]">Pratap AI</p>
              <h1 className="text-xl font-semibold">Real Estate CRM SaaS</h1>
            </div>
            <Badge>Twenty-style open CRM foundation</Badge>
          </nav>

          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-[#c9a961]">AI sales operating system</p>
              <h2 className="max-w-4xl text-4xl font-semibold tracking-tight sm:text-6xl">
                Capture every real estate lead, qualify by AI voice, and close from one pipeline.
              </h2>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#eae5d6]">
                A vertical SaaS CRM for brokerages and developers: lead capture, Hindi/English AI calling, WhatsApp follow-ups,
                agent workspaces, management analytics, and property-to-buyer matching.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a className="rounded-full bg-[#c9a961] px-5 py-3 text-sm font-bold text-black" href="#dashboard">
                  View CRM prototype
                </a>
                <a className="rounded-full border border-[#c9a961]/60 px-5 py-3 text-sm font-bold text-[#f4f1e8]" href="/blueprint.md">
                  Blueprint in repo
                </a>
              </div>
            </div>

            <div className="rounded-3xl border border-[#c9a961]/30 bg-white/10 p-5 shadow-2xl backdrop-blur">
              <p className="mb-4 text-sm font-medium text-[#e2c97f]">Today’s automation queue</p>
              <div className="space-y-3">
                {leads.slice(0, 3).map((lead) => (
                  <div key={lead.id} className="rounded-2xl bg-black/25 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">{lead.name}</p>
                        <p className="text-sm text-[#eae5d6]">{lead.requirement}</p>
                      </div>
                      <span className="rounded-full bg-[#b5413b] px-3 py-1 text-xs font-semibold text-white">{lead.aiOutcome}</span>
                    </div>
                    <p className="mt-3 text-xs text-[#c9c0a8]">Next: {lead.nextAction}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="dashboard" className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="grid gap-4 md:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-3xl border border-[#d8ceb6] bg-white p-5 shadow-sm">
              <p className="text-sm text-[#6f685a]">{metric.label}</p>
              <p className="mt-2 text-3xl font-bold">{metric.value}</p>
              <p className="mt-1 text-xs font-semibold text-[#b5413b]">{metric.detail}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_0.6fr]">
          <div className="rounded-3xl border border-[#d8ceb6] bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#b5413b]">Pipeline</p>
                <h3 className="text-2xl font-bold">Lead lifecycle CRM</h3>
              </div>
              <Badge>New → Closed Won</Badge>
            </div>
            <div className="grid gap-3 lg:grid-cols-7">
              {pipelineStages.map((stage) => {
                const stageLeads = leads.filter((lead) => lead.stage === stage);
                return (
                  <div key={stage} className="min-h-36 rounded-2xl bg-[#f6f2e8] p-3">
                    <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#6f685a]">{stage}</p>
                    {stageLeads.map((lead) => (
                      <div key={lead.id} className="mb-3 rounded-xl bg-white p-3 shadow-sm">
                        <p className="text-sm font-bold">{lead.name}</p>
                        <p className="mt-1 text-xs text-[#6f685a]">{lead.location}</p>
                        <p className="mt-2 text-xs font-semibold text-[#b5413b]">Score {lead.score}</p>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-[#d8ceb6] bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#b5413b]">Modules</p>
            <h3 className="mb-5 text-2xl font-bold">SaaS product scope</h3>
            <div className="space-y-4">
              {automationModules.map((module) => (
                <div key={module.name} className="rounded-2xl border border-[#eadfca] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-bold">{module.name}</p>
                    <span className="text-xs font-semibold text-[#b5413b]">{module.status}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#6f685a]">{module.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border border-[#d8ceb6] bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#b5413b]">Agent workspace</p>
            <h3 className="mb-5 text-2xl font-bold">Priority leads</h3>
            <div className="space-y-3">
              {leads.map((lead) => (
                <div key={lead.id} className="rounded-2xl bg-[#f6f2e8] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-bold">{lead.name} <span className="text-xs text-[#6f685a]">{lead.id}</span></p>
                      <p className="text-sm text-[#6f685a]">{lead.requirement} · {lead.budget}</p>
                    </div>
                    <span className="rounded-full bg-[#14141a] px-3 py-1 text-xs font-semibold text-white">{lead.stage}</span>
                  </div>
                  <p className="mt-3 text-sm"><strong>Next action:</strong> {lead.nextAction}</p>
                  <p className="mt-1 text-xs text-[#6f685a]">{lead.lastActivity}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-[#d8ceb6] bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#b5413b]">Inventory matching</p>
            <h3 className="mb-5 text-2xl font-bold">Best property matches</h3>
            <div className="space-y-4">
              {properties.map((property) => (
                <div key={property.id} className="rounded-2xl border border-[#eadfca] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold">{property.title}</p>
                      <p className="text-sm text-[#6f685a]">{property.type} · {property.location} · {property.size}</p>
                    </div>
                    <span className="rounded-full bg-[#c9a961] px-3 py-1 text-xs font-bold text-black">{property.fit}% fit</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="font-bold">{property.price}</span>
                    <span className="text-[#6f685a]">{property.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
