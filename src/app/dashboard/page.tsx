"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type Lead = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  source: string;
  requirement: string;
  location: string;
  budget: string;
  stage: string;
  score: number;
  assignedTo: string;
  nextAction: string;
  lastActivity: string;
};

type CrmPayload = {
  tenantId: string;
  generatedAt: string;
  dataOwnership: {
    owner: string;
    controls: string[];
    currentPersistence: string;
  };
  summary: {
    totalLeads: number;
    inboundQueue: number;
    openActivities: number;
    availableProperties: number;
    pendingApprovals: number;
  };
  pipeline: Array<{ stage: string; count: number; value: string; leakageRisk: string }>;
  leads: Lead[];
  allLeads: Lead[];
  inboundLeads: Array<{ id: string; name: string; source: string; status: string; ownerSuggestion: string; routingRule: string }>;
  properties: Array<{ id: string; title: string; location: string; price: string; status: string; fit: number; matchReason: string }>;
  agentCommands: Array<{ id: string; userRequest: string; agentResponse: string; crmUpdate: string; status: string; approvalType: string }>;
  integrations: Array<{ id: string; name: string; category: string; status: string; description: string; setupAction: string; guardrail: string }>;
  demoAccess: {
    customDashboard: string;
    rawCrmApi: string;
    agentApi: string;
    integrationsApi: string;
    twentyPublicTunnel: string;
    twentyDemoLogin: string;
    twentyWorkspace: string;
  };
};

type AgentResult = {
  ok: boolean;
  agentResponse: string;
  selectedLead: { id: string; name: string; stage: string; owner: string; nextAction: string };
  proposedCrmUpdates: string[];
  recommendedProperties: Array<{ id: string; title: string; price: string; reason: string }>;
  approvalGate: { externalActionFired: boolean; requiredBeforeSending: string[] };
  modelConnection?: { provider: string; model: string; connectedToExternalModel: boolean; mode: string; note: string };
};

type CreatedLead = {
  ok: boolean;
  lead: { id: string; name: string; stage: string; assignedTo: string; nextAction: string };
  audit: { duplicateRisk: string; externalActionFired: boolean; activity: string };
  persistenceNote: string;
};


type SetupTrack = {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  steps: string[];
  ownerControls: string[];
  crmSync: string;
};

type StudyCard = {
  title: string;
  summary: string;
  takeaway: string;
};

const setupTracks: SetupTrack[] = [
  {
    id: "whatsapp-setup",
    title: "Connect WhatsApp",
    subtitle: "Business owner connects their WhatsApp Business account without reading API docs.",
    status: "Guided setup",
    steps: [
      "Sign in as owner/admin and open Channel Setup.",
      "Choose WhatsApp Business Cloud or a managed BSP later.",
      "Add phone number ID, WABA ID, access token, app secret, and verify token in a secure settings screen.",
      "Send one test message to a sample lead and verify webhook replies land in the Inbox.",
      "Enable approved templates, team inbox, and human approval before any outbound automation."
    ],
    ownerControls: ["Approval before send", "Template library", "Opt-out/DND rules", "Conversation owner", "Cost/activity log"],
    crmSync: "Every inbound/outbound message becomes a CRM activity tied to the lead, property, owner, source, and next action."
  },
  {
    id: "voice-setup",
    title: "Enable Voice Agent",
    subtitle: "A non-technical founder chooses the voice provider, language, timings, and handoff policy.",
    status: "Approval-gated",
    steps: [
      "Choose hosted voice provider first for reliability; keep self-hosted adapter optional later.",
      "Add provider key, from-number, webhook secret, allowed languages, and business calling hours.",
      "Select campaign: new-lead qualification, no-answer retry, site-visit reminder, or reactivation.",
      "Run test call on an internal number and review transcript/outcome inside CRM.",
      "Turn on manager approval or rules-based calling only after consent/DND checks are active."
    ],
    ownerControls: ["Calling hours", "Retry limits", "Consent checks", "Human handoff", "Transcript review"],
    crmSync: "Call transcript, disposition, score change, callback time, and next action are written as CRM activities."
  },
  {
    id: "crm-sync",
    title: "CRM Sync & Data Control",
    subtitle: "The custom dashboard is the simple operating layer; Twenty remains the CRM backbone/template workspace.",
    status: "Core system",
    steps: [
      "Create tenant workspace for each brokerage or agency.",
      "Map real-estate fields: requirement, budget, location, property type, source, project, site visit, deal value.",
      "Normalize every source into one lead object before creating/updating CRM records.",
      "Attach all WhatsApp, voice, note, task, property, and approval events to the same lead timeline.",
      "Expose plain-language search so users can retrieve leads by name, phone, location, project, owner, or stage."
    ],
    ownerControls: ["Workspace separation", "Role permissions", "Audit trail", "Export", "Source mapping"],
    crmSync: "CRM is the source of truth; the AI and dashboard only read/write through audited backend actions."
  },
  {
    id: "ai-setup",
    title: "AI & OpenRouter",
    subtitle: "Use one server-side OpenRouter key for the custom agent; Twenty AI may need an adapter/proxy if its native AI provider list does not expose OpenRouter directly.",
    status: "Backend setting",
    steps: [
      "Store OPENROUTER_API_KEY only on the server, never in browser code.",
      "Set default model, tool permissions, spend limits, and allowed CRM actions per tenant.",
      "Use OpenRouter for the custom sales agent now.",
      "For Twenty AI, first verify the self-hosted version's AI provider settings; if no OpenRouter field exists, add a small OpenAI-compatible proxy/adapter.",
      "Keep external messages/calls approval-gated even when AI is enabled."
    ],
    ownerControls: ["Model choice", "Spend cap", "Tool permissions", "Sandbox mode", "Approval gates"],
    crmSync: "AI suggestions become CRM tasks, notes, stages, or drafts only through permissioned backend mutations."
  }
];

const twentyStudyCards: StudyCard[] = [
  {
    title: "Workspaces",
    summary: "Twenty is workspace-centric: each company/team gets its own CRM surface, objects, people, companies, opportunities, tasks, notes, and automations.",
    takeaway: "For this SaaS, each brokerage should feel like a ready-made real-estate workspace, not a blank generic CRM."
  },
  {
    title: "Real-estate template",
    summary: "Template should pre-create real estate fields, pipeline stages, views, sample tasks, lead-source mappings, and property/opportunity relationships.",
    takeaway: "Users should open the CRM and immediately see Buyers, Sellers, Properties, Site Visits, Deals, Follow-ups, and WhatsApp/Voice Activity."
  },
  {
    title: "MCP + AI direction",
    summary: "Twenty's MCP/AI direction is useful for allowing agents to inspect and operate CRM objects safely, but production should still enforce tenant permissions and audit logs.",
    takeaway: "Use MCP/AI for controlled CRM actions; do not let the model bypass the product's approval and compliance layer."
  },
  {
    title: "OpenRouter",
    summary: "OpenRouter is straightforward for our custom backend because it is OpenAI-compatible. Twenty AI support depends on its current provider hooks/settings.",
    takeaway: "Start with OpenRouter in our agent; then connect Twenty AI via native setting if available or a thin OpenAI-compatible adapter."
  }
];

const stages = ["All", "New", "Contacted", "Cold", "Warm", "Hot", "Negotiation", "Closed Won", "Closed Lost"];

function Pill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "gold" | "green" | "red" | "dark" }) {
  const classes = {
    neutral: "bg-slate-100 text-slate-700 ring-slate-200",
    gold: "bg-[#fff6dc] text-[#7a5712] ring-[#f3dda2]",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    red: "bg-red-50 text-red-700 ring-red-200",
    dark: "bg-[#111827] text-white ring-[#111827]",
  }[tone];
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${classes}`}>{children}</span>;
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-[1.6rem] bg-white p-5 shadow-[0_16px_45px_rgba(15,23,42,0.07)] ring-1 ring-slate-200 ${className}`}>{children}</section>;
}

export default function DashboardPage() {
  const [data, setData] = useState<CrmPayload | null>(null);
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState("All");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [agentMessage, setAgentMessage] = useState("Which hot lead needs action today, and what should we do next?");
  const [agentResult, setAgentResult] = useState<AgentResult | null>(null);
  const [createdLead, setCreatedLead] = useState<CreatedLead | null>(null);
  const [loading, setLoading] = useState(true);

  const loadCrm = useCallback(async (nextQuery = query, nextStage = stage) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (nextQuery.trim()) params.set("q", nextQuery.trim());
    if (nextStage !== "All") params.set("stage", nextStage);
    const response = await fetch(`/api/crm?${params.toString()}`, { cache: "no-store" });
    setData(await response.json());
    setLoading(false);
  }, [query, stage]);

  useEffect(() => {
    // This client demo intentionally fetches the static backend payload once on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCrm("", "All");
  }, [loadCrm]);

  const selectedLead = useMemo(() => {
    if (!data) return null;
    return data.allLeads.find((lead) => lead.id === selectedLeadId) ?? data.allLeads[0] ?? null;
  }, [data, selectedLeadId]);

  async function askAgent() {
    const response = await fetch("/api/agent", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: agentMessage, leadId: selectedLead?.id }),
    });
    setAgentResult(await response.json());
  }

  async function createLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/crm", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form.entries())),
    });
    setCreatedLead(await response.json());
  }

  function exportData() {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${data.tenantId}-crm-export.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-[#111827]">
      <header className="sticky top-0 z-20 border-b border-white/70 bg-[#f7f4ee]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#b88a2d]">Brokerage control room</p>
            <h1 className="text-2xl font-semibold tracking-[-0.05em]">Real Estate CRM Dashboard</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/" className="rounded-full bg-white px-4 py-2 text-sm font-semibold ring-1 ring-slate-200">Landing</Link>
            <a href="#whatsapp-setup" className="rounded-full bg-white px-4 py-2 text-sm font-semibold ring-1 ring-slate-200">WhatsApp setup</a>
            <a href="#voice-setup" className="rounded-full bg-white px-4 py-2 text-sm font-semibold ring-1 ring-slate-200">Voice setup</a>
            <a href="#crm-sync" className="rounded-full bg-white px-4 py-2 text-sm font-semibold ring-1 ring-slate-200">CRM sync</a>
            <button onClick={exportData} className="rounded-full bg-[#111827] px-4 py-2 text-sm font-semibold text-white">Export JSON</button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-5 py-6 sm:px-6 lg:px-8">
        <Card className="bg-gradient-to-br from-[#111827] to-[#26344a] text-white ring-[#111827]">
          <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr] lg:items-center">
            <div>
              <Pill tone="gold">Tenant: {data?.tenantId ?? "Loading"}</Pill>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.06em]">A broker can connect WhatsApp, enable voice calling, query leads, and control CRM data from one simple dashboard.</h2>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-white/70">
                This is the simple operator surface for non-technical real-estate founders: guided channel setup, CRM-synced lead records, approval gates, property matches, and plain-language search. No WhatsApp or call is fired automatically.
              </p>
              {data?.demoAccess ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  <a href={data.demoAccess.twentyPublicTunnel} target="_blank" className="rounded-full bg-[#e8c871] px-4 py-2 text-sm font-semibold text-[#111827]" rel="noreferrer">Open Twenty demo CRM</a>
                  <a href="#whatsapp-setup" className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/15">Setup guide</a>
                </div>
              ) : null}
            </div>
            <div className="rounded-[1.4rem] bg-white/10 p-4 ring-1 ring-white/15">
              <p className="text-sm font-semibold text-[#e8c871]">Data control model</p>
              <p className="mt-2 text-sm leading-6 text-white/72">{data?.dataOwnership.currentPersistence ?? "Loading data ownership details..."}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {data?.dataOwnership.controls.map((control) => <Pill key={control} tone="neutral">{control}</Pill>)}
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-5">
          {data ? Object.entries(data.summary).map(([key, value]) => (
            <Card key={key}>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{key.replace(/([A-Z])/g, " $1")}</p>
              <p className="mt-2 text-3xl font-semibold tracking-[-0.05em]">{value}</p>
            </Card>
          )) : null}
        </div>

        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#b88a2d]">Founder setup wizard</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em]">Connect channels without learning the whole CRM</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Each card explains what the owner connects, what the team can control, and how the information syncs back to CRM so future queries are clean.</p>
            </div>
            <Pill tone="dark">Simple UI first</Pill>
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {setupTracks.map((track) => (
              <section id={track.id} key={track.id} className="rounded-[1.4rem] bg-slate-50 p-4 ring-1 ring-slate-200 scroll-mt-28">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold tracking-[-0.04em]">{track.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{track.subtitle}</p>
                  </div>
                  <Pill tone="gold">{track.status}</Pill>
                </div>
                <ol className="mt-4 space-y-2 text-sm text-slate-700">
                  {track.steps.map((step, index) => (
                    <li key={step} className="flex gap-3 rounded-2xl bg-white p-3 ring-1 ring-slate-200">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#111827] text-xs font-semibold text-white">{index + 1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
                <div className="mt-4 flex flex-wrap gap-2">
                  {track.ownerControls.map((control) => <Pill key={control}>{control}</Pill>)}
                </div>
                <p className="mt-4 rounded-2xl bg-white p-3 text-sm leading-6 text-slate-700 ring-1 ring-slate-200"><strong>CRM sync:</strong> {track.crmSync}</p>
              </section>
            ))}
          </div>
        </Card>

        <div className="grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
          <Card>
            <h2 className="text-xl font-semibold tracking-[-0.04em]">Query CRM data</h2>
            <p className="mt-1 text-sm text-slate-600">Search by name, phone, location, source, owner, or stage.</p>
            <div className="mt-4 grid gap-3">
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Try: Vikram, Meta, Noida, Hot" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#c9a961]" />
              <select value={stage} onChange={(e) => setStage(e.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#c9a961]">
                {stages.map((item) => <option key={item}>{item}</option>)}
              </select>
              <button onClick={() => loadCrm()} className="rounded-2xl bg-[#111827] px-4 py-3 text-sm font-semibold text-white">Run query</button>
            </div>
            <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-xs leading-6 text-slate-600">
              Founder-friendly examples: search <strong>Vikram</strong>, <strong>Noida</strong>, <strong>Hot</strong>, or <strong>Riya</strong>. The backend can still expose APIs, but the UI should show business actions instead of raw JSON.
            </div>
          </Card>

          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold tracking-[-0.04em]">Lead records</h2>
                <p className="mt-1 text-sm text-slate-600">Click a lead to test the agent against that record.</p>
              </div>
              <Pill tone="dark">{loading ? "Loading" : `${data?.leads.length ?? 0} shown`}</Pill>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {data?.leads.map((lead) => (
                <button key={lead.id} onClick={() => setSelectedLeadId(lead.id)} className={`rounded-2xl p-4 text-left ring-1 transition ${selectedLead?.id === lead.id ? "bg-[#111827] text-white ring-[#111827]" : "bg-slate-50 ring-slate-200 hover:bg-white"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{lead.name} <span className="text-xs opacity-60">{lead.id}</span></p>
                      <p className="mt-1 text-sm opacity-70">{lead.requirement} · {lead.location}</p>
                    </div>
                    <Pill tone={lead.stage === "Hot" ? "red" : lead.stage === "New" ? "green" : "gold"}>{lead.stage}</Pill>
                  </div>
                  <p className="mt-3 text-xs opacity-70">Owner: {lead.assignedTo} · Score: {lead.score} · {lead.source}</p>
                  <p className="mt-2 text-xs opacity-80">Next: {lead.nextAction}</p>
                </button>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <h2 className="text-xl font-semibold tracking-[-0.04em]">Test the AI Sales Agent</h2>
            <p className="mt-1 text-sm text-slate-600">Selected lead: <strong>{selectedLead?.name ?? "None"}</strong>. The agent can inspect CRM memory and propose actions, but external sends stay gated.</p>
            <textarea value={agentMessage} onChange={(e) => setAgentMessage(e.target.value)} className="mt-4 min-h-28 w-full rounded-2xl border border-slate-200 p-4 text-sm outline-none focus:border-[#c9a961]" />
            <button onClick={askAgent} className="mt-3 rounded-2xl bg-[#111827] px-5 py-3 text-sm font-semibold text-white">Ask agent</button>
            {agentResult ? (
              <div className="mt-4 rounded-2xl bg-[#f7f4ee] p-4 ring-1 ring-[#eadfca]">
                <Pill tone="green">External action fired: {String(agentResult.approvalGate.externalActionFired)}</Pill>
                {agentResult.modelConnection ? <p className="mt-3 text-xs font-semibold text-slate-600">Model: {agentResult.modelConnection.provider} / {agentResult.modelConnection.model} · external model connected: {String(agentResult.modelConnection.connectedToExternalModel)}</p> : null}
                <p className="mt-3 text-sm leading-6">{agentResult.agentResponse}</p>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
                  {agentResult.proposedCrmUpdates.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            ) : null}
          </Card>

          <Card>
            <h2 className="text-xl font-semibold tracking-[-0.04em]">Create / ingest a lead</h2>
            <p className="mt-1 text-sm text-slate-600">This tests the backend contract a brokerage would connect to website forms, Meta leads, portals, or n8n.</p>
            <form onSubmit={createLead} className="mt-4 grid gap-3 sm:grid-cols-2">
              <input name="name" required placeholder="Lead name" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
              <input name="phone" required placeholder="Phone" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
              <input name="requirement" required placeholder="Requirement" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm sm:col-span-2" />
              <input name="location" placeholder="Location" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
              <input name="budget" placeholder="Budget" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
              <button className="rounded-2xl bg-[#111827] px-5 py-3 text-sm font-semibold text-white sm:col-span-2">Submit to backend</button>
            </form>
            {createdLead ? (
              <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-900 ring-1 ring-emerald-200">
                Created response: {createdLead.lead.id} · {createdLead.lead.stage} · duplicate risk {createdLead.audit.duplicateRisk}.<br />
                {createdLead.persistenceNote}
              </div>
            ) : null}
          </Card>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          <Card>
            <h2 className="text-xl font-semibold tracking-[-0.04em]">Pipeline board</h2>
            <div className="mt-4 space-y-3">
              {data?.pipeline.map((stageItem) => (
                <div key={stageItem.stage} className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
                  <div className="flex items-center justify-between"><strong>{stageItem.stage}</strong><Pill>{stageItem.count} leads</Pill></div>
                  <p className="mt-1 text-xs text-slate-600">{stageItem.leakageRisk} · {stageItem.value}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-semibold tracking-[-0.04em]">Inbound queue</h2>
            <div className="mt-4 space-y-3">
              {data?.inboundLeads.map((lead) => (
                <div key={lead.id} className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
                  <div className="flex items-center justify-between"><strong>{lead.name}</strong><Pill tone="gold">{lead.status}</Pill></div>
                  <p className="mt-1 text-xs text-slate-600">{lead.source} → {lead.ownerSuggestion}</p>
                  <p className="mt-1 text-xs text-slate-500">Rule: {lead.routingRule}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-semibold tracking-[-0.04em]">Property matches</h2>
            <div className="mt-4 space-y-3">
              {data?.properties.map((property) => (
                <div key={property.id} className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
                  <div className="flex items-center justify-between"><strong>{property.title}</strong><Pill tone="green">{property.fit}%</Pill></div>
                  <p className="mt-1 text-xs text-slate-600">{property.location} · {property.price} · {property.status}</p>
                  <p className="mt-1 text-xs text-slate-500">{property.matchReason}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          <Card>
            <h2 className="text-xl font-semibold tracking-[-0.04em]">Twenty CRM demo account</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Twenty is installed separately as a real open-source CRM demo. The next product step is a real-estate workspace template so users do not start from a blank generic CRM.</p>
            <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm leading-6 ring-1 ring-slate-200">
              <p><strong>Workspace:</strong> {data?.demoAccess?.twentyWorkspace ?? "Apple demo workspace"}</p>
              <p><strong>Login:</strong> {data?.demoAccess?.twentyDemoLogin ?? "tim@apple.dev"}</p>
              <p><strong>Password:</strong> demo password shared in handoff only</p>
            </div>
            {data?.demoAccess?.twentyPublicTunnel ? <a href={data.demoAccess.twentyPublicTunnel} target="_blank" rel="noreferrer" className="mt-4 inline-flex rounded-2xl bg-[#111827] px-5 py-3 text-sm font-semibold text-white">Open Twenty</a> : null}
          </Card>

          <Card className="lg:col-span-2">
            <h2 className="text-xl font-semibold tracking-[-0.04em]">Simple integration controls</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {data?.integrations.map((item) => (
                <div key={item.id} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <div className="flex flex-wrap items-center justify-between gap-2"><strong>{item.name}</strong><Pill tone={item.status === "Add credentials" ? "gold" : item.status === "Demo ready" ? "green" : "neutral"}>{item.status}</Pill></div>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{item.category}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{item.description}</p>
                  <p className="mt-2 text-xs text-slate-600"><strong>Setup:</strong> {item.setupAction}</p>
                  <p className="mt-1 text-xs text-slate-500"><strong>Guardrail:</strong> {item.guardrail}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#b88a2d]">Twenty study notes</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em]">What to learn from Twenty and what to customize</h2>
            </div>
            <Pill tone="gold">Real-estate template needed</Pill>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {twentyStudyCards.map((card) => (
              <div key={card.title} className="rounded-[1.3rem] bg-slate-50 p-4 ring-1 ring-slate-200">
                <h3 className="font-semibold tracking-[-0.03em]">{card.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{card.summary}</p>
                <p className="mt-3 rounded-2xl bg-white p-3 text-xs leading-5 text-slate-700 ring-1 ring-slate-200"><strong>Takeaway:</strong> {card.takeaway}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </main>
  );
}
