import { NextResponse } from "next/server";
import {
  activities,
  agentCommands,
  inboundLeads,
  integrationOptions,
  leads,
  pipelineSummary,
  properties,
  realEstateTemplateObjects,
  sourceSystemBlueprints,
  syncPrinciples,
} from "@/lib/crm-data";

export const runtime = "nodejs";

type CreateLeadPayload = {
  name?: string;
  phone?: string;
  email?: string;
  requirement?: string;
  location?: string;
  budget?: string;
  source?: string;
};

function normalizePhone(phone: string) {
  return phone.replace(/[^+\d]/g, "");
}

function getCrmPayload(request?: Request) {
  const url = request ? new URL(request.url) : null;
  const query = url?.searchParams.get("q")?.trim().toLowerCase() ?? "";
  const stage = url?.searchParams.get("stage")?.trim().toLowerCase() ?? "";

  const filteredLeads = leads.filter((lead) => {
    const matchesQuery = query
      ? [lead.name, lead.phone, lead.email, lead.source, lead.requirement, lead.location, lead.assignedTo, lead.stage]
          .filter(Boolean)
          .some((field) => field!.toLowerCase().includes(query))
      : true;
    const matchesStage = stage ? lead.stage.toLowerCase() === stage : true;
    return matchesQuery && matchesStage;
  });

  return {
    tenantId: "TNT-PRATAP-DEMO",
    generatedAt: new Date().toISOString(),
    dataOwnership: {
      owner: "Brokerage workspace",
      controls: ["View all lead data", "Search and filter records", "Export JSON", "Approve external actions", "Connect own database in production"],
      currentPersistence: "Demo dataset served by the backend API. Production package should attach Postgres/Neon/Supabase so each brokerage controls its own tenant data.",
    },
    filters: {
      q: query || null,
      stage: stage || null,
      returnedLeads: filteredLeads.length,
    },
    summary: {
      totalLeads: leads.length,
      inboundQueue: inboundLeads.length,
      openActivities: activities.length,
      availableProperties: properties.filter((property) => property.status === "Available").length,
      pendingApprovals: agentCommands.filter((command) => command.status === "Needs approval").length,
    },
    pipeline: pipelineSummary,
    leads: filteredLeads,
    allLeads: leads,
    inboundLeads,
    properties,
    activities,
    agentCommands,
    integrations: integrationOptions,
    sourceSystemBlueprints,
    realEstateTemplateObjects,
    syncPrinciples,
    demoAccess: {
      customDashboard: "/dashboard",
      rawCrmApi: "/api/crm",
      agentApi: "/api/agent",
      integrationsApi: "/api/integrations",
      twentyLocalUrl: "http://localhost:3001",
      twentyPublicTunnel: process.env.NEXT_PUBLIC_TWENTY_DEMO_URL ?? "https://pratap-twenty-demo.loca.lt",
      twentyDemoLogin: "tim@apple.dev",
      twentyWorkspace: "Apple demo workspace",
    },
  };
}

export function GET(request: Request) {
  return NextResponse.json(getCrmPayload(request), {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(request: Request) {
  let body: CreateLeadPayload;

  try {
    body = (await request.json()) as CreateLeadPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.name || !body.phone || !body.requirement) {
    return NextResponse.json(
      {
        error: "Missing required lead fields",
        required: ["name", "phone", "requirement"],
      },
      { status: 400 },
    );
  }

  const normalizedPhone = normalizePhone(body.phone);
  const duplicate = leads.find((lead) => normalizePhone(lead.phone) === normalizedPhone);
  const leadId = `LD-${Math.floor(2000 + Math.random() * 7000)}`;

  return NextResponse.json(
    {
      ok: true,
      mode: "demo-serverless-backend",
      persistenceNote: "This proves the backend contract. Production should write this record into the brokerage tenant database instead of returning a demo response only.",
      lead: {
        id: leadId,
        tenantId: "TNT-PRATAP-DEMO",
        name: body.name,
        phone: normalizedPhone,
        email: body.email,
        source: body.source ?? "Website enquiry",
        requirement: body.requirement,
        location: body.location ?? "Needs qualification",
        budget: body.budget ?? "Needs qualification",
        stage: duplicate ? "Contacted" : "New",
        assignedTo: duplicate ? duplicate.assignedTo : "Unassigned",
        nextAction: duplicate ? "Review possible duplicate before creating CRM record" : "Route owner and start qualification workflow",
      },
      audit: {
        duplicateRisk: duplicate ? "High" : "Low",
        duplicateLeadId: duplicate?.id ?? null,
        activity: duplicate ? "Duplicate check completed; manual review required" : "Lead accepted into inbound queue",
        externalActionFired: false,
      },
    },
    { status: 201 },
  );
}
