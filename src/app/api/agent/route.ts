import { NextResponse } from "next/server";
import { leads, properties } from "@/lib/crm-data";

export const runtime = "nodejs";

type AgentRequest = {
  message?: string;
  leadId?: string;
};

function getModelStatus() {
  const provider = process.env.AI_PROVIDER ?? "demo-rules-engine";
  const model = process.env.AI_MODEL ?? "deterministic-safe-demo";
  const hasKey = Boolean(process.env.AI_PROVIDER_API_KEY || process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY);

  return {
    provider,
    model,
    connectedToExternalModel: hasKey,
    mode: hasKey ? "external-model-ready" : "safe-demo-no-external-model",
    note: hasKey
      ? "A server-side model key is present. Keep CRM writes and WhatsApp/voice actions permissioned."
      : "No external LLM key is configured in this Vercel/server environment. The demo agent uses deterministic brokerage rules so users can still test the workflow safely.",
  };
}

function pickLead(message: string, leadId?: string) {
  if (leadId) {
    const direct = leads.find((lead) => lead.id.toLowerCase() === leadId.toLowerCase());
    if (direct) return direct;
  }

  const lower = message.toLowerCase();
  return leads.find((lead) => lower.includes(lead.name.split(" ")[0].toLowerCase()) || lower.includes(lead.id.toLowerCase())) ?? leads[0];
}

export function GET() {
  return NextResponse.json(
    {
      ok: true,
      agent: "Real Estate Sales Agent",
      modelConnection: getModelStatus(),
      capabilities: [
        "Summarize lead records",
        "Recommend next actions",
        "Prepare CRM updates",
        "Draft WhatsApp/property follow-ups behind approval gates",
        "Prepare voice-call qualification plan behind approval gates",
      ],
      externalActionFired: false,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  let body: AgentRequest;

  try {
    body = (await request.json()) as AgentRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const message = body.message?.trim();
  if (!message) {
    return NextResponse.json({ error: "Send a message for the agent to process" }, { status: 400 });
  }

  const lead = pickLead(message, body.leadId);
  const matches = properties
    .filter((property) => property.status === "Available")
    .slice(0, 2)
    .map((property) => ({
      id: property.id,
      title: property.title,
      price: property.price,
      reason: property.matchReason,
    }));

  return NextResponse.json({
    ok: true,
    mode: "safe-demo-agent",
    modelConnection: getModelStatus(),
    request: message,
    selectedLead: {
      id: lead.id,
      name: lead.name,
      phone: lead.phone,
      stage: lead.stage,
      owner: lead.assignedTo,
      requirement: lead.requirement,
      nextAction: lead.nextAction,
    },
    agentResponse: `I found ${lead.name}. Current stage is ${lead.stage}, owner is ${lead.assignedTo}, and the next action is: ${lead.nextAction}. I can prepare follow-up and property recommendations, but I will not send WhatsApp or place a call until a human approves.`,
    proposedCrmUpdates: [
      `Log agent review for ${lead.id}`,
      `Keep next action focused on: ${lead.nextAction}`,
      lead.assignedTo === "Unassigned" ? "Assign owner before external follow-up" : `Keep owner as ${lead.assignedTo}`,
    ],
    recommendedProperties: matches,
    approvalGate: {
      externalActionFired: false,
      requiredBeforeSending: ["Brokerage admin approval", "WhatsApp/voice credentials", "Consent/DND check"],
    },
  });
}
