import { recordDecision } from "@/lib/audit/decisions";
import { DograhClient } from "@/lib/dograh/client";
import { getTenantConfig, type TenantConfig } from "@/lib/tenant/config";
import { TwentyClient } from "@/lib/twenty/client";
import type { TwentyLead, TwentyProperty } from "@/lib/twenty/types";
import {
  sendTemplateMessage,
  sendTextMessage,
  type MetaSendResult,
} from "@/lib/whatsapp/meta-api";

export type ToolContext = {
  tenant: TenantConfig;
  twenty: TwentyClient;
  dograh: DograhClient;
  actor: string;
};

export function createToolContext(tenantId?: string, actor = "User"): ToolContext {
  const tenant = getTenantConfig(tenantId);
  return {
    tenant,
    twenty: new TwentyClient(tenant.id, tenant.twenty),
    dograh: new DograhClient(tenant.dograh),
    actor,
  };
}

type ToolHandler = (args: Record<string, unknown>, ctx: ToolContext) => Promise<unknown>;

export type ToolDef = {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, { type: string; description: string; enum?: string[] }>;
    required?: string[];
  };
  requiresApproval: boolean;
  execute: ToolHandler;
};

function requireString(args: Record<string, unknown>, key: string): string {
  const value = args[key];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Missing or invalid argument: ${key}`);
  }
  return value.trim();
}

function optionalString(args: Record<string, unknown>, key: string): string | undefined {
  const value = args[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function scoreLeadAgainstProperty(lead: TwentyLead, property: TwentyProperty): number {
  let score = 0;
  const reqLower = lead.requirement.toLowerCase();
  const titleLower = property.title.toLowerCase();
  if (lead.location && property.location.toLowerCase().includes(lead.location.toLowerCase().split(" ")[0])) {
    score += 35;
  }
  if (reqLower.includes(property.type.toLowerCase())) score += 25;
  if (reqLower.match(/\d+bhk/) && titleLower.includes(reqLower.match(/\d+bhk/)![0])) {
    score += 20;
  }
  if (property.status === "Available") score += 10;
  if (lead.stage === "Hot" || lead.stage === "Warm") score += 10;
  return Math.min(score, 100);
}

function explainMatch(lead: TwentyLead, property: TwentyProperty, score: number): string {
  const reasons: string[] = [];
  if (property.location.toLowerCase().includes(lead.location.toLowerCase().split(" ")[0])) {
    reasons.push("location match");
  }
  if (lead.requirement.toLowerCase().includes(property.type.toLowerCase())) {
    reasons.push(`${property.type.toLowerCase()} requirement match`);
  }
  if (property.status === "Available") reasons.push("available now");
  if (reasons.length === 0) reasons.push("partial fit");
  return `${reasons.join(", ")} (score ${score})`;
}

export const tools: ToolDef[] = [
  {
    name: "search_leads",
    description: "Search leads by free-text query and/or stage. Returns up to 20 leads.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Free-text query: name, phone, location, source." },
        stage: {
          type: "string",
          description: "Pipeline stage filter.",
          enum: ["New", "Contacted", "Cold", "Warm", "Hot", "Negotiation", "Closed Won", "Closed Lost"],
        },
      },
    },
    requiresApproval: false,
    async execute(args, ctx) {
      const results = await ctx.twenty.searchLeads({
        query: optionalString(args, "query"),
        stage: optionalString(args, "stage"),
      });
      return results.slice(0, 20);
    },
  },
  {
    name: "get_lead",
    description: "Fetch a single lead by ID with full profile.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string", description: "Lead ID, e.g. LD-1001." } },
      required: ["id"],
    },
    requiresApproval: false,
    async execute(args, ctx) {
      return ctx.twenty.getLead(requireString(args, "id"));
    },
  },
  {
    name: "find_lead_by_phone",
    description: "Look up a lead by phone number (used for dedup).",
    inputSchema: {
      type: "object",
      properties: { phone: { type: "string", description: "Phone number, any format." } },
      required: ["phone"],
    },
    requiresApproval: false,
    async execute(args, ctx) {
      return ctx.twenty.findLeadByPhone(requireString(args, "phone"));
    },
  },
  {
    name: "create_lead",
    description: "Create a new lead. Dedupes by phone first.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Lead full name." },
        phone: { type: "string", description: "Phone." },
        email: { type: "string", description: "Email (optional)." },
        requirement: { type: "string", description: "What they're looking for." },
        location: { type: "string", description: "Preferred location." },
        budget: { type: "string", description: "Budget band." },
        source: { type: "string", description: "Source label." },
        channel: { type: "string", description: "Channel label." },
      },
      required: ["name", "phone"],
    },
    requiresApproval: false,
    async execute(args, ctx) {
      const phone = requireString(args, "phone");
      const existing = await ctx.twenty.findLeadByPhone(phone);
      if (existing) {
        return { duplicate: true, lead: existing };
      }
      const created = await ctx.twenty.createLead({
        name: requireString(args, "name"),
        phone,
        email: optionalString(args, "email"),
        requirement: optionalString(args, "requirement"),
        location: optionalString(args, "location"),
        budget: optionalString(args, "budget"),
        source: optionalString(args, "source"),
        channel: optionalString(args, "channel"),
      });
      await ctx.twenty.addActivity(created.id, {
        type: "Lead captured",
        title: `Lead created from ${created.source}`,
        detail: `Captured with requirement: ${created.requirement}`,
        actor: ctx.actor,
      });
      return { duplicate: false, lead: created };
    },
  },
  {
    name: "update_lead",
    description: "Update fields on a lead (owner, next action, requirement, notes, etc.).",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Lead ID." },
        assignedTo: { type: "string", description: "New owner." },
        nextAction: { type: "string", description: "Next action text." },
        requirement: { type: "string", description: "Updated requirement." },
        budget: { type: "string", description: "Updated budget." },
        location: { type: "string", description: "Updated location." },
      },
      required: ["id"],
    },
    requiresApproval: false,
    async execute(args, ctx) {
      const id = requireString(args, "id");
      const patch: Record<string, unknown> = {};
      for (const key of ["assignedTo", "nextAction", "requirement", "budget", "location"] as const) {
        const value = optionalString(args, key);
        if (value !== undefined) patch[key] = value;
      }
      const updated = await ctx.twenty.updateLead(id, patch);
      await ctx.twenty.addActivity(id, {
        type: "CRM agent update",
        title: "Lead updated by agent",
        detail: `Fields changed: ${Object.keys(patch).join(", ")}`,
        actor: ctx.actor,
      });
      return updated;
    },
  },
  {
    name: "move_stage",
    description: "Move a lead to a new pipeline stage. Writes an activity.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Lead ID." },
        stage: {
          type: "string",
          description: "New stage.",
          enum: ["New", "Contacted", "Cold", "Warm", "Hot", "Negotiation", "Closed Won", "Closed Lost"],
        },
      },
      required: ["id", "stage"],
    },
    requiresApproval: false,
    async execute(args, ctx) {
      const id = requireString(args, "id");
      const stage = requireString(args, "stage");
      const before = await ctx.twenty.getLead(id);
      const updated = await ctx.twenty.updateLead(id, {
        stage: stage as TwentyLead["stage"],
      });
      await ctx.twenty.addActivity(id, {
        type: "Stage changed",
        title: `Stage ${before?.stage ?? "?"} → ${stage}`,
        detail: `Moved by ${ctx.actor}`,
        actor: ctx.actor,
      });
      return updated;
    },
  },
  {
    name: "add_note",
    description: "Append a free-text note to a lead's timeline.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Lead ID." },
        note: { type: "string", description: "Note text." },
      },
      required: ["id", "note"],
    },
    requiresApproval: false,
    async execute(args, ctx) {
      const id = requireString(args, "id");
      const note = requireString(args, "note");
      return ctx.twenty.addActivity(id, {
        type: "Human note",
        title: "Note added",
        detail: note,
        actor: ctx.actor,
      });
    },
  },
  {
    name: "search_properties",
    description: "List inventory properties available in the workspace.",
    inputSchema: {
      type: "object",
      properties: {
        location: { type: "string", description: "Filter by partial location match." },
        type: { type: "string", description: "Property type filter." },
      },
    },
    requiresApproval: false,
    async execute(args, ctx) {
      const all = await ctx.twenty.listProperties();
      const location = optionalString(args, "location");
      const type = optionalString(args, "type");
      return all.filter((property) => {
        if (location && !property.location.toLowerCase().includes(location.toLowerCase())) return false;
        if (type && !property.type.toLowerCase().includes(type.toLowerCase())) return false;
        return true;
      });
    },
  },
  {
    name: "match_properties_for_lead",
    description:
      "Cross-reference a lead's requirement, budget, and location against the property inventory. Returns ranked matches with explanations.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string", description: "Lead ID." } },
      required: ["id"],
    },
    requiresApproval: false,
    async execute(args, ctx) {
      const lead = await ctx.twenty.getLead(requireString(args, "id"));
      if (!lead) throw new Error("Lead not found");
      const properties = await ctx.twenty.listProperties();
      const ranked = properties
        .map((property) => {
          const score = scoreLeadAgainstProperty(lead, property);
          return {
            id: property.id,
            title: property.title,
            price: property.price,
            status: property.status,
            score,
            reason: explainMatch(lead, property, score),
          };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
      return { lead: { id: lead.id, name: lead.name, requirement: lead.requirement }, matches: ranked };
    },
  },
  {
    name: "draft_whatsapp",
    description:
      "Draft a WhatsApp message for a lead. Does not send. Returns text the user can edit before approval.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Lead ID." },
        intent: {
          type: "string",
          description: "What the message is for.",
          enum: ["first_touch", "shortlist", "site_visit", "callback_reminder", "reactivation"],
        },
      },
      required: ["id", "intent"],
    },
    requiresApproval: false,
    async execute(args, ctx) {
      const lead = await ctx.twenty.getLead(requireString(args, "id"));
      if (!lead) throw new Error("Lead not found");
      const intent = requireString(args, "intent");
      const drafts: Record<string, string> = {
        first_touch: `Hi ${lead.name.split(" ")[0]}, this is from our real estate desk. We saw your interest in ${lead.requirement} around ${lead.location}. Could we share 2-3 matching options on WhatsApp?`,
        shortlist: `Hi ${lead.name.split(" ")[0]}, sharing a curated shortlist for ${lead.requirement} in ${lead.location}. Reply with the one you'd like to visit and we'll lock a slot.`,
        site_visit: `Hi ${lead.name.split(" ")[0]}, ready to confirm your site visit. We have weekend slots open at the project — which time works for you?`,
        callback_reminder: `Hi ${lead.name.split(" ")[0]}, following up on our last conversation. Should we plan a quick call later today or tomorrow?`,
        reactivation: `Hi ${lead.name.split(" ")[0]}, you'd shown interest in ${lead.requirement} earlier. We have new options matching ${lead.location} — want me to share?`,
      };
      const text = drafts[intent] ?? drafts.first_touch;
      return { leadId: lead.id, intent, text, requiresApproval: ctx.tenant.policy.approvalRequiredForWhatsapp };
    },
  },
  {
    name: "send_whatsapp",
    description:
      "Send a WhatsApp message via the Meta Cloud API. Tenant must have WhatsApp connected. Records an approval decision.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Lead ID." },
        text: { type: "string", description: "Free-form text (24-hour window only)." },
        templateName: { type: "string", description: "Approved template name." },
        templateParams: { type: "string", description: "Comma-separated template params." },
        language: { type: "string", description: "Template language code, default en_US." },
        approvalId: { type: "string", description: "Approval row ID if this was pre-approved." },
      },
      required: ["id"],
    },
    requiresApproval: true,
    async execute(args, ctx) {
      const lead = await ctx.twenty.getLead(requireString(args, "id"));
      if (!lead) throw new Error("Lead not found");
      if (!ctx.tenant.whatsapp) {
        return {
          sent: false,
          reason:
            "WhatsApp not connected for this tenant. Add credentials in onboarding step 3 to enable sends.",
        };
      }
      const templateName = optionalString(args, "templateName");
      const text = optionalString(args, "text");
      if (!templateName && !text) {
        throw new Error("Provide either templateName or text");
      }
      let result: MetaSendResult;
      if (templateName) {
        const params = optionalString(args, "templateParams")?.split(",").map((s) => s.trim()) ?? [];
        result = await sendTemplateMessage({
          phoneNumberId: ctx.tenant.whatsapp.phoneNumberId,
          accessToken: ctx.tenant.whatsapp.accessToken,
          to: lead.phone,
          templateName,
          language: optionalString(args, "language"),
          params,
        });
      } else {
        result = await sendTextMessage({
          phoneNumberId: ctx.tenant.whatsapp.phoneNumberId,
          accessToken: ctx.tenant.whatsapp.accessToken,
          to: lead.phone,
          text: text!,
        });
      }
      await ctx.twenty.addActivity(lead.id, {
        type: "WhatsApp send",
        title: templateName ? `Template ${templateName} sent` : "WhatsApp text sent",
        detail: text ?? `Template params: ${optionalString(args, "templateParams") ?? "none"}`,
        actor: ctx.actor,
      });
      return { sent: true, messageId: result.messageId };
    },
  },
  {
    name: "draft_call_script",
    description: "Draft a Hindi/English qualification script for a lead. Does not place the call.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Lead ID." },
        language: {
          type: "string",
          description: "Preferred language.",
          enum: ["english", "hindi", "hinglish"],
        },
      },
      required: ["id"],
    },
    requiresApproval: false,
    async execute(args, ctx) {
      const lead = await ctx.twenty.getLead(requireString(args, "id"));
      if (!lead) throw new Error("Lead not found");
      const lang = optionalString(args, "language") ?? "hinglish";
      const opener =
        lang === "hindi"
          ? `Namaste ${lead.name.split(" ")[0]} ji, main XYZ Realty se baat kar raha hoon.`
          : lang === "hinglish"
            ? `Hi ${lead.name.split(" ")[0]}, main XYZ Realty se baat kar raha hoon — aapne ${lead.requirement} ke liye interest dikhaaya tha.`
            : `Hi ${lead.name.split(" ")[0]}, this is XYZ Realty calling about your interest in ${lead.requirement}.`;
      const probes = [
        `Confirm budget band: ${lead.budget}.`,
        `Confirm location: ${lead.location}.`,
        "Ask timeline to buy / move in.",
        "Ask financing readiness (loan, own funds).",
        "Offer 2-3 matching shortlists or a site visit slot.",
      ];
      return { leadId: lead.id, language: lang, opener, probes };
    },
  },
  {
    name: "start_call",
    description:
      "Trigger an outbound qualification call via Dograh. Tenant must have voice connected. Records a decision.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Lead ID." },
        workflowId: { type: "string", description: "Optional Dograh workflow ID override." },
        approvalId: { type: "string", description: "Approval row ID if pre-approved." },
      },
      required: ["id"],
    },
    requiresApproval: true,
    async execute(args, ctx) {
      const lead = await ctx.twenty.getLead(requireString(args, "id"));
      if (!lead) throw new Error("Lead not found");
      if (!ctx.tenant.dograh) {
        return {
          placed: false,
          reason: "Voice not connected. Add Dograh credentials in onboarding step 4.",
        };
      }
      const result = await ctx.dograh.initiateCall({
        phoneNumber: lead.phone,
        workflowId: optionalString(args, "workflowId")
          ? Number(optionalString(args, "workflowId"))
          : undefined,
      });
      await ctx.twenty.addActivity(lead.id, {
        type: "AI call",
        title: "Outbound qualification call queued",
        detail: `Call ID: ${result.callId}; status ${result.status}`,
        actor: ctx.actor,
      });
      return { placed: true, callId: result.callId, status: result.status };
    },
  },
];

const toolMap = new Map(tools.map((tool) => [tool.name, tool]));

export function getTool(name: string): ToolDef | null {
  return toolMap.get(name) ?? null;
}

export async function callTool(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext,
  options: { prompt?: string; approved?: boolean } = {},
): Promise<{ decisionId: string; result: unknown; status: "executed" | "needs_approval" | "blocked" }> {
  const tool = getTool(name);
  if (!tool) throw new Error(`Unknown tool: ${name}`);

  if (tool.requiresApproval && !options.approved) {
    const decision = recordDecision({
      tenantId: ctx.tenant.id,
      leadId: typeof args.id === "string" ? args.id : undefined,
      prompt: options.prompt ?? "",
      proposedTool: name,
      proposedArgs: args,
      status: "proposed",
    });
    return { decisionId: decision.id, result: null, status: "needs_approval" };
  }

  try {
    const result = await tool.execute(args, ctx);
    const decision = recordDecision({
      tenantId: ctx.tenant.id,
      leadId: typeof args.id === "string" ? args.id : undefined,
      prompt: options.prompt ?? "",
      proposedTool: name,
      proposedArgs: args,
      status: tool.requiresApproval ? "approved" : "auto_approved",
      executedAt: new Date().toISOString(),
      outcome: "success",
    });
    return { decisionId: decision.id, result, status: "executed" };
  } catch (error) {
    const decision = recordDecision({
      tenantId: ctx.tenant.id,
      leadId: typeof args.id === "string" ? args.id : undefined,
      prompt: options.prompt ?? "",
      proposedTool: name,
      proposedArgs: args,
      status: "executed",
      executedAt: new Date().toISOString(),
      outcome: "failure",
      error: error instanceof Error ? error.message : String(error),
    });
    return { decisionId: decision.id, result: null, status: "blocked" };
  }
}
