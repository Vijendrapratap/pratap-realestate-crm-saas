import { NextResponse } from "next/server";

import { callTool, createToolContext } from "@/lib/agent/tools";
import {
  activities as mockActivities,
  agentCommands,
  inboundLeads,
  integrationOptions,
  pipelineSummary,
  realEstateTemplateObjects,
  sourceSystemBlueprints,
  syncPrinciples,
} from "@/lib/crm-data";
import { listDecisions } from "@/lib/audit/decisions";
import { getTenantConfig, summarizeConnectivity } from "@/lib/tenant/config";

export const runtime = "nodejs";

type CreateLeadPayload = {
  name?: string;
  phone?: string;
  email?: string;
  requirement?: string;
  location?: string;
  budget?: string;
  source?: string;
  channel?: string;
  tenantId?: string;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tenantId = url.searchParams.get("tenantId") ?? undefined;
  const query = url.searchParams.get("q")?.trim() ?? undefined;
  const stage = url.searchParams.get("stage")?.trim() ?? undefined;

  const tenant = getTenantConfig(tenantId);
  const ctx = createToolContext(tenantId);
  const allLeads = await ctx.twenty.searchLeads({});
  const filteredLeads = await ctx.twenty.searchLeads({
    query,
    stage: stage && stage !== "All" ? stage : undefined,
  });
  const properties = await ctx.twenty.listProperties();

  return NextResponse.json(
    {
      ok: true,
      tenantId: tenant.id,
      generatedAt: new Date().toISOString(),
      connectivity: summarizeConnectivity(tenant),
      externalLinks: {
        twenty: tenant.twenty?.url ?? null,
        wacrm: process.env.WACRM_URL ?? null,
        dograh: tenant.dograh?.url ?? null,
      },
      dataOwnership: {
        owner: tenant.name,
        controls: [
          "View all lead data",
          "Search and filter records",
          "Export JSON",
          "Approve external actions",
          "Open CRM directly when needed",
        ],
        currentPersistence:
          ctx.twenty.mode === "live"
            ? "Backed by Twenty workspace via REST API."
            : "Demo dataset served by the orchestrator until Twenty credentials are configured.",
      },
      filters: { q: query ?? null, stage: stage ?? null, returnedLeads: filteredLeads.length },
      summary: {
        totalLeads: allLeads.length,
        inboundQueue: inboundLeads.length,
        openActivities: mockActivities.length,
        availableProperties: properties.filter((property) => property.status === "Available").length,
        pendingApprovals: listDecisions(tenant.id).filter((d) => d.status === "proposed").length,
      },
      pipeline: pipelineSummary,
      leads: filteredLeads,
      allLeads,
      inboundLeads,
      properties,
      activities: mockActivities,
      agentCommands,
      decisions: listDecisions(tenant.id, 10),
      integrations: integrationOptions,
      sourceSystemBlueprints,
      realEstateTemplateObjects,
      syncPrinciples,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  let body: CreateLeadPayload;
  try {
    body = (await request.json()) as CreateLeadPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.name || !body.phone || !body.requirement) {
    return NextResponse.json(
      { ok: false, error: "Missing required fields", required: ["name", "phone", "requirement"] },
      { status: 400 },
    );
  }

  const ctx = createToolContext(body.tenantId, "Dashboard");
  const call = await callTool(
    "create_lead",
    {
      name: body.name,
      phone: body.phone,
      email: body.email,
      requirement: body.requirement,
      location: body.location,
      budget: body.budget,
      source: body.source ?? "Dashboard manual entry",
      channel: body.channel ?? "Manual",
    },
    ctx,
    { prompt: "dashboard create lead" },
  );

  const result = call.result as { duplicate: boolean; lead: unknown } | null;
  return NextResponse.json(
    {
      ok: true,
      mode: ctx.twenty.mode,
      decisionId: call.decisionId,
      lead: result?.lead,
      audit: {
        duplicateRisk: result?.duplicate ? "High" : "Low",
        activity: result?.duplicate ? "Duplicate detected" : "Lead created and activity logged",
        externalActionFired: false,
      },
      persistenceNote:
        ctx.twenty.mode === "live"
          ? "Persisted to Twenty workspace."
          : "Held in orchestrator memory; connect Twenty to persist across restarts.",
    },
    { status: 201 },
  );
}
