import type { ReactNode } from "react";
import {
  activities,
  agentCapabilities,
  agentCommands,
  automationModules,
  inboundLeads,
  integrationOptions,
  leads,
  pipelineStages,
  properties,
} from "@/lib/crm-data";

const metrics = [
  { label: "Agent actions", value: "37", detail: "CRM updates + approvals", tone: "from-[#f7efe0] to-white" },
  { label: "Inbound queue", value: inboundLeads.length.toString(), detail: "dedupe + routing active", tone: "from-[#edf7f2] to-white" },
  { label: "Hot pipeline", value: "₹42.6Cr", detail: "96 opportunities", tone: "from-[#eef3ff] to-white" },
  { label: "Speed to lead", value: "38s", detail: "target under 60s", tone: "from-[#f7efff] to-white" },
];

const quickCommands = ["Show hot leads", "Assign owner", "Draft follow-up", "Queue voice call"];

function cn(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function Badge({ children, tone = "gold" }: { children: ReactNode; tone?: "gold" | "dark" | "red" | "green" | "blue" | "soft" }) {
  const toneClass =
    tone === "dark"
      ? "bg-[#111827] text-white shadow-[0_10px_24px_rgba(17,24,39,0.16)]"
      : tone === "red"
        ? "bg-[#fff1ef] text-[#b5413b] ring-1 ring-[#f4cbc4]"
        : tone === "green"
          ? "bg-[#ecfdf3] text-[#087443] ring-1 ring-[#c8f0d8]"
          : tone === "blue"
            ? "bg-[#edf4ff] text-[#1f5fbf] ring-1 ring-[#cfdef8]"
            : tone === "soft"
              ? "bg-white/70 text-[#4f5b6b] ring-1 ring-white/80"
              : "bg-[#fff6dc] text-[#7a5712] ring-1 ring-[#f3dda2]";

  return <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-medium", toneClass)}>{children}</span>;
}

function Panel({ eyebrow, title, children, className }: { eyebrow: string; title: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-[2rem] bg-white/90 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.07)] ring-1 ring-[#e8edf3] backdrop-blur", className)}>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#b88a2d]">{eyebrow}</p>
      <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#111827]">{title}</h3>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function GlassCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-[1.5rem] bg-white/75 p-4 shadow-[0_16px_50px_rgba(15,23,42,0.06)] ring-1 ring-white/80 backdrop-blur", className)}>
      {children}
    </div>
  );
}

function StatusDot({ tone = "green" }: { tone?: "green" | "gold" | "red" | "blue" }) {
  const toneClass = tone === "red" ? "bg-[#e45745]" : tone === "gold" ? "bg-[#c99a2e]" : tone === "blue" ? "bg-[#3b82f6]" : "bg-[#22c55e]";
  return <span className={cn("h-2.5 w-2.5 rounded-full shadow-[0_0_0_4px_rgba(255,255,255,0.9)]", toneClass)} />;
}

export default function Home() {
  const priorityLead = leads.find((lead) => lead.id === "LD-1005") ?? leads[0];

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f4ee] text-[#111827]">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[-12rem] top-[-10rem] h-[28rem] w-[28rem] rounded-full bg-[#ead5a5]/60 blur-3xl" />
        <div className="absolute right-[-10rem] top-[8rem] h-[30rem] w-[30rem] rounded-full bg-[#dbeafe]/70 blur-3xl" />
        <div className="absolute bottom-[-14rem] left-1/3 h-[32rem] w-[32rem] rounded-full bg-[#f4d6cf]/55 blur-3xl" />
      </div>

      <section className="relative border-b border-white/70">
        <div className="mx-auto flex max-w-7xl flex-col px-5 py-5 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-between rounded-full bg-white/75 px-4 py-3 shadow-[0_18px_55px_rgba(15,23,42,0.06)] ring-1 ring-white/80 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-[#111827] text-sm font-semibold text-white shadow-[0_12px_30px_rgba(17,24,39,0.18)]">P</div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#b88a2d]">Pratap AI</p>
                <h1 className="text-sm font-semibold tracking-[-0.02em] text-[#111827] sm:text-base">Real Estate Agent CRM</h1>
              </div>
            </div>
            <div className="hidden items-center gap-2 md:flex">
              <Badge tone="soft">AI-centered</Badge>
              <Badge tone="soft">Premium CRM</Badge>
              <Badge tone="dark">Live demo</Badge>
            </div>
          </nav>

          <div className="grid gap-10 py-16 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:py-20">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/75 px-3 py-2 text-sm font-medium text-[#5b6575] shadow-sm ring-1 ring-white/80">
                <StatusDot tone="green" />
                AI Sales Agent operating layer for real estate teams
              </div>
              <h2 className="max-w-5xl text-5xl font-semibold leading-[0.96] tracking-[-0.07em] text-[#0f172a] sm:text-7xl lg:text-[5.8rem]">
                A beautiful AI command center for every lead.
              </h2>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#5f6b7a] sm:text-xl">
                Your sales team talks to one AI agent. It captures inbound leads, updates CRM memory, routes follow-ups, and queues WhatsApp or voice actions for approval.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a className="rounded-full bg-[#111827] px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_38px_rgba(17,24,39,0.22)] transition hover:-translate-y-0.5 hover:bg-black" href="/dashboard">
                  Open live dashboard
                </a>
                <a className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#111827] shadow-[0_12px_32px_rgba(15,23,42,0.07)] ring-1 ring-[#e4e9f0] transition hover:-translate-y-0.5" href="/dashboard#whatsapp-setup">
                  See setup steps
                </a>
                <a className="rounded-full bg-white/70 px-6 py-3 text-sm font-semibold text-[#111827] shadow-[0_12px_32px_rgba(15,23,42,0.05)] ring-1 ring-white transition hover:-translate-y-0.5" href="#pipeline">
                  Preview pipeline
                </a>
              </div>
              <div className="mt-8 flex flex-wrap gap-2">
                {quickCommands.map((command) => (
                  <span key={command} className="rounded-full bg-white/65 px-3 py-1.5 text-xs font-medium text-[#687386] ring-1 ring-white/80">
                    {command}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-6 rounded-[3rem] bg-gradient-to-br from-[#f2dfad]/60 via-white/50 to-[#dbeafe]/70 blur-2xl" />
              <div className="relative rounded-[2.25rem] bg-white/90 p-4 shadow-[0_30px_100px_rgba(15,23,42,0.14)] ring-1 ring-white/90 backdrop-blur-xl">
                <div className="rounded-[1.7rem] bg-gradient-to-br from-[#111827] via-[#182235] to-[#28344a] p-5 text-white shadow-inner">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#e5c46f]">Live agent brief</p>
                      <p className="mt-2 text-2xl font-semibold tracking-[-0.04em]">{priorityLead.name}</p>
                    </div>
                    <Badge tone="gold">Score {priorityLead.score}</Badge>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-white/72">{priorityLead.requirement} · {priorityLead.location} · {priorityLead.budget}</p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-white/9 p-4 ring-1 ring-white/10">
                      <p className="text-xs text-white/48">Source</p>
                      <p className="mt-1 text-sm font-semibold">{priorityLead.source}</p>
                    </div>
                    <div className="rounded-2xl bg-white/9 p-4 ring-1 ring-white/10">
                      <p className="text-xs text-white/48">Owner</p>
                      <p className="mt-1 text-sm font-semibold">{priorityLead.assignedTo}</p>
                    </div>
                    <div className="rounded-2xl bg-white/9 p-4 ring-1 ring-white/10">
                      <p className="text-xs text-white/48">SLA</p>
                      <p className="mt-1 text-sm font-semibold">{priorityLead.responseSla}</p>
                    </div>
                  </div>
                </div>

                <GlassCard className="-mt-4 ml-4 mr-4">
                  <div className="flex items-start gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#f8efd9] text-sm font-semibold text-[#9d7422]">AI</div>
                    <div>
                      <p className="text-sm font-semibold tracking-[-0.02em] text-[#111827]">Recommended action</p>
                      <p className="mt-1 text-sm leading-6 text-[#667085]">Assign to Aman, update CRM, and queue voice qualification for approval. No external action fires automatically.</p>
                    </div>
                  </div>
                </GlassCard>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.label} className={cn("rounded-[1.65rem] bg-gradient-to-br p-5 shadow-[0_16px_48px_rgba(15,23,42,0.06)] ring-1 ring-white/80", metric.tone)}>
              <p className="text-sm font-medium text-[#667085]">{metric.label}</p>
              <p className="mt-2 text-4xl font-semibold tracking-[-0.06em] text-[#111827]">{metric.value}</p>
              <p className="mt-2 text-xs font-medium text-[#9a6b19]">{metric.detail}</p>
            </div>
          ))}
        </div>

        <div id="agent" className="mt-8 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <Panel eyebrow="AI command center" title="One calm surface for every sales request">
            <div className="rounded-[1.6rem] bg-[#111827] p-5 text-white shadow-[0_24px_60px_rgba(17,24,39,0.18)]">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#e8c871]">Ask the agent</p>
                <Badge tone="soft">audited</Badge>
              </div>
              <div className="mt-5 rounded-2xl bg-white/8 p-4 text-sm leading-6 text-white/78 ring-1 ring-white/10">
                Assign Vikram to Aman, update his requirement as villa/plot, and queue a Hindi qualification call.
              </div>
              <div className="mt-4 rounded-2xl bg-white p-4 text-[#111827] shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#b88a2d]">Agent response</p>
                <p className="mt-2 text-sm leading-6 text-[#5f6b7a]">
                  CRM updated. Activity logged. Voice call queued for approval. I will not contact the lead externally until approved.
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {agentCapabilities.map((capability, index) => (
                <GlassCard key={capability.name}>
                  <div className="mb-4 grid h-9 w-9 place-items-center rounded-full bg-[#f6f2e8] text-sm font-semibold text-[#9a6b19]">0{index + 1}</div>
                  <p className="font-semibold tracking-[-0.02em] text-[#111827]">{capability.name}</p>
                  <p className="mt-2 text-sm leading-6 text-[#667085]">{capability.description}</p>
                </GlassCard>
              ))}
            </div>
          </Panel>

          <Panel eyebrow="Agent action log" title="Requests become clean CRM updates">
            <div className="space-y-3">
              {agentCommands.map((command) => (
                <GlassCard key={command.id}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="max-w-xs text-sm font-semibold leading-5 tracking-[-0.02em] text-[#111827]">{command.userRequest}</p>
                    <Badge tone={command.status === "Updated CRM" ? "green" : command.status === "Needs approval" ? "gold" : "blue"}>{command.status}</Badge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[#667085]">{command.agentResponse}</p>
                  <p className="mt-3 rounded-2xl bg-[#f7f4ee] px-3 py-2 text-xs font-medium text-[#4d5969]">{command.crmUpdate}</p>
                  <p className="mt-3 text-xs font-semibold text-[#b88a2d]">Approval · {command.approvalType}</p>
                </GlassCard>
              ))}
            </div>
          </Panel>
        </div>

        <div id="inbound" className="mt-8 grid gap-8 lg:grid-cols-[1.25fr_0.75fr]">
          <Panel eyebrow="Inbound leads" title="Every source becomes one prioritized queue">
            <div className="space-y-3">
              {inboundLeads.map((lead) => (
                <GlassCard key={lead.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold tracking-[-0.02em] text-[#111827]">
                        {lead.name} <span className="text-xs font-medium text-[#98a2b3]">{lead.id}</span>
                      </p>
                      <p className="mt-1 text-sm text-[#667085]">
                        {lead.requirement} · {lead.location} · {lead.budget}
                      </p>
                    </div>
                    <Badge tone={lead.status === "Ready to create" ? "green" : lead.status === "Duplicate found" ? "red" : "gold"}>{lead.status}</Badge>
                  </div>
                  <div className="mt-4 grid gap-3 text-sm md:grid-cols-4">
                    <div><p className="text-xs uppercase tracking-wide text-[#98a2b3]">Source</p><p className="mt-1 font-medium text-[#111827]">{lead.source}</p></div>
                    <div><p className="text-xs uppercase tracking-wide text-[#98a2b3]">Received</p><p className="mt-1 font-medium text-[#111827]">{lead.receivedAt}</p></div>
                    <div><p className="text-xs uppercase tracking-wide text-[#98a2b3]">Dedupe</p><p className="mt-1 font-medium text-[#111827]">{lead.duplicateRisk} risk</p></div>
                    <div><p className="text-xs uppercase tracking-wide text-[#98a2b3]">Route to</p><p className="mt-1 font-medium text-[#111827]">{lead.ownerSuggestion}</p></div>
                  </div>
                  <p className="mt-3 rounded-2xl bg-[#f7f4ee] px-3 py-2 text-xs text-[#667085]">Rule: {lead.routingRule}</p>
                </GlassCard>
              ))}
            </div>
          </Panel>

          <Panel eyebrow="Product modules" title="AI agent first, CRM spine underneath">
            <div className="space-y-3">
              {automationModules.map((module) => (
                <GlassCard key={module.name} className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold tracking-[-0.02em] text-[#111827]">{module.name}</p>
                    <span className="text-xs font-semibold text-[#b88a2d]">{module.status}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#667085]">{module.description}</p>
                </GlassCard>
              ))}
            </div>
          </Panel>
        </div>

        <div id="pipeline" className="mt-8 rounded-[2rem] bg-white/90 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.07)] ring-1 ring-[#e8edf3] backdrop-blur">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#b88a2d]">Pipeline</p>
              <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#111827]">A visual CRM lifecycle your team can trust</h3>
            </div>
            <Badge tone="blue">New → Closed Lost</Badge>
          </div>
          <div className="grid gap-3 lg:grid-cols-4 xl:grid-cols-8">
            {pipelineStages.map((stage) => {
              const stageLeads = leads.filter((lead) => lead.stage === stage);
              return (
                <div key={stage} className="min-h-48 rounded-[1.35rem] bg-[#f8fafc] p-3 ring-1 ring-[#edf1f5]">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#667085]">{stage}</p>
                    <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-[#111827] ring-1 ring-[#e8edf3]">{stageLeads.length}</span>
                  </div>
                  {stageLeads.length === 0 ? <p className="text-xs text-[#98a2b3]">No leads</p> : null}
                  {stageLeads.map((lead) => (
                    <div key={lead.id} className="mb-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-[#eef2f6]">
                      <p className="text-sm font-semibold tracking-[-0.02em] text-[#111827]">{lead.name}</p>
                      <p className="mt-1 text-xs text-[#667085]">{lead.location}</p>
                      <div className="mt-3 flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#b88a2d]">Score {lead.score}</span>
                        <span className="text-[#667085]">{lead.assignedTo}</span>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <Panel eyebrow="Lead detail" title="Next-best action with full activity trail">
            <div className="rounded-[1.6rem] bg-gradient-to-br from-[#111827] to-[#273348] p-5 text-white shadow-[0_22px_60px_rgba(17,24,39,0.16)]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-2xl font-semibold tracking-[-0.04em]">{priorityLead.name}</p>
                  <p className="mt-1 text-sm text-white/58">{priorityLead.phone} · {priorityLead.source}</p>
                </div>
                <Badge tone="gold">{priorityLead.stage}</Badge>
              </div>
              <p className="mt-4 text-sm leading-6 text-white/72">{priorityLead.requirement} in {priorityLead.location}, budget {priorityLead.budget}.</p>
              <div className="mt-4 rounded-2xl bg-white/9 p-4 ring-1 ring-white/10">
                <p className="text-xs uppercase tracking-wide text-[#e8c871]">Next action</p>
                <p className="mt-1 font-semibold">{priorityLead.nextAction}</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {activities.map((activity) => (
                <GlassCard key={activity.id}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold tracking-[-0.02em] text-[#111827]">{activity.title}</p>
                    <span className="text-xs font-medium text-[#98a2b3]">{activity.createdAt}</span>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-[#667085]">{activity.detail}</p>
                  <p className="mt-2 text-xs font-semibold text-[#b88a2d]">{activity.actor} · {activity.type}</p>
                </GlassCard>
              ))}
            </div>
          </Panel>

          <Panel eyebrow="Inventory matching" title="Property recommendations that explain themselves">
            <div className="space-y-4">
              {properties.map((property) => (
                <GlassCard key={property.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold tracking-[-0.02em] text-[#111827]">{property.title}</p>
                      <p className="mt-1 text-sm text-[#667085]">{property.type} · {property.location} · {property.size}</p>
                    </div>
                    <span className="rounded-full bg-[#fff6dc] px-3 py-1 text-xs font-semibold text-[#7a5712] ring-1 ring-[#f3dda2]">{property.fit}% fit</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-xl font-semibold tracking-[-0.04em] text-[#111827]">{property.price}</span>
                    <span className="text-[#667085]">{property.status}</span>
                  </div>
                  <p className="mt-3 rounded-2xl bg-[#f7f4ee] px-3 py-2 text-sm leading-6 text-[#667085]">Why: {property.matchReason}</p>
                </GlassCard>
              ))}
            </div>
          </Panel>
        </div>

        <div id="integrations" className="mt-8 pb-12">
          <Panel eyebrow="Integration options" title="Simple WhatsApp, voice, CRM, and AI setup controls">
            <div className="grid gap-4 lg:grid-cols-4">
              {integrationOptions.map((integration) => (
                <GlassCard key={integration.id} className="flex min-h-full flex-col">
                  <div className="flex min-h-20 flex-col justify-between gap-3">
                    <p className="font-semibold tracking-[-0.02em] text-[#111827]">{integration.name}</p>
                    <Badge tone={integration.status === "Available now" ? "green" : integration.status === "Add credentials" ? "gold" : "soft"}>{integration.status}</Badge>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-[#667085]">{integration.description}</p>
                  <div className="mt-5 space-y-3 border-t border-[#edf1f5] pt-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#b88a2d]">Setup</p>
                      <p className="mt-1 text-sm text-[#111827]">{integration.setupAction}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#b88a2d]">Guardrail</p>
                      <p className="mt-1 text-sm leading-6 text-[#667085]">{integration.guardrail}</p>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </Panel>
        </div>
      </section>
    </main>
  );
}
