import { callTool, createToolContext, type ToolContext } from "@/lib/agent/tools";
import { getTenantConfig } from "@/lib/tenant/config";
import type { TwentyLead, TwentyProperty } from "@/lib/twenty/types";

export type AgentResult = {
  mode: "deterministic" | "ai";
  reply: string;
  toolCalls: Array<{
    tool: string;
    args: Record<string, unknown>;
    decisionId?: string;
    status: "executed" | "needs_approval" | "blocked";
    result?: unknown;
  }>;
  proposedCrmUpdates: string[];
  recommendedProperties: Array<{
    id: string;
    title: string;
    price: string;
    score: number;
    reason: string;
  }>;
  selectedLead?: {
    id: string;
    name: string;
    stage: string;
    owner: string;
    nextAction: string;
  };
};

type Intent =
  | "hot_leads"
  | "stale_leads"
  | "draft_whatsapp"
  | "match_properties"
  | "draft_call"
  | "send_whatsapp"
  | "place_call"
  | "move_stage"
  | "lead_overview"
  | "general";

function detectIntent(message: string): Intent {
  const lower = message.toLowerCase();
  if (lower.match(/\bhot\b|priority|today|focus|action/)) return "hot_leads";
  if (lower.match(/stale|breach|cold|missed|leak/)) return "stale_leads";
  if (lower.match(/draft.+whatsapp|whatsapp.+draft|shortlist/)) return "draft_whatsapp";
  if (lower.match(/match|properties|inventory|shortlist for|fit for/)) return "match_properties";
  if (lower.match(/call script|qualification|voice script|prepare.+call/)) return "draft_call";
  if (lower.match(/send (the )?whatsapp|push the (whatsapp|template)|approve.+whatsapp/)) return "send_whatsapp";
  if (lower.match(/place (a )?call|start.+call|call (now|them)/)) return "place_call";
  if (lower.match(/move to|change stage|set stage/)) return "move_stage";
  if (lower.match(/lead .*overview|tell me about|status of|profile of/)) return "lead_overview";
  return "general";
}

function summarizeLead(lead: TwentyLead): string {
  return `${lead.name} · ${lead.stage} · owner ${lead.assignedTo} · next: ${lead.nextAction}`;
}

async function runDeterministic(
  message: string,
  leadId: string | undefined,
  ctx: ToolContext,
): Promise<AgentResult> {
  const intent = detectIntent(message);
  const result: AgentResult = {
    mode: "deterministic",
    reply: "",
    toolCalls: [],
    proposedCrmUpdates: [],
    recommendedProperties: [],
  };

  async function runTool(name: string, args: Record<string, unknown>, approved = false) {
    const call = await callTool(name, args, ctx, { prompt: message, approved });
    result.toolCalls.push({
      tool: name,
      args,
      decisionId: call.decisionId,
      status: call.status,
      result: call.result,
    });
    return call;
  }

  const focusLead = leadId ? await ctx.twenty.getLead(leadId) : null;
  if (focusLead) {
    result.selectedLead = {
      id: focusLead.id,
      name: focusLead.name,
      stage: focusLead.stage,
      owner: focusLead.assignedTo,
      nextAction: focusLead.nextAction,
    };
  }

  switch (intent) {
    case "hot_leads": {
      const search = await runTool("search_leads", { stage: "Hot" });
      const leads = (search.result as TwentyLead[] | null) ?? [];
      if (leads.length === 0) {
        result.reply = "No leads are currently in the Hot stage. Want me to scan Warm or Negotiation?";
        break;
      }
      result.reply = `${leads.length} lead${leads.length === 1 ? "" : "s"} need attention today:\n` +
        leads.map((lead) => `• ${summarizeLead(lead)}`).join("\n");
      result.proposedCrmUpdates = leads.slice(0, 3).map(
        (lead) => `Confirm next action for ${lead.name}: ${lead.nextAction}`,
      );
      break;
    }
    case "stale_leads": {
      const breached = await runTool("search_leads", {});
      const leads = ((breached.result as TwentyLead[] | null) ?? []).filter(
        (lead) => lead.responseSla === "Breached" || lead.responseSla === "At risk",
      );
      if (leads.length === 0) {
        result.reply = "Nothing is currently flagged as stale. SLA looks healthy.";
        break;
      }
      result.reply = `${leads.length} lead${leads.length === 1 ? "" : "s"} are stale or SLA-breached:\n` +
        leads.map((lead) => `• ${summarizeLead(lead)} (${lead.responseSla})`).join("\n");
      result.proposedCrmUpdates = leads.map((lead) =>
        lead.responseSla === "Breached"
          ? `Reassign or escalate ${lead.name} — SLA breached.`
          : `Retry contact for ${lead.name} before SLA breaches.`,
      );
      break;
    }
    case "match_properties": {
      if (!focusLead) {
        result.reply = "Pick a lead in the sidebar first, then ask again.";
        break;
      }
      const match = await runTool("match_properties_for_lead", { id: focusLead.id });
      const data = match.result as
        | { matches: AgentResult["recommendedProperties"] }
        | null;
      const matches = data?.matches ?? [];
      result.recommendedProperties = matches;
      result.reply = matches.length
        ? `Ranked ${matches.length} options for ${focusLead.name}. Top pick: ${matches[0].title} (score ${matches[0].score}).`
        : `No inventory currently fits ${focusLead.name}. Consider expanding location or budget.`;
      break;
    }
    case "draft_whatsapp": {
      if (!focusLead) {
        result.reply = "Pick a lead first so I know who the message is for.";
        break;
      }
      const intentKeyword = message.toLowerCase().includes("site visit")
        ? "site_visit"
        : message.toLowerCase().includes("shortlist")
          ? "shortlist"
          : message.toLowerCase().includes("callback")
            ? "callback_reminder"
            : "first_touch";
      const draft = await runTool("draft_whatsapp", { id: focusLead.id, intent: intentKeyword });
      const data = draft.result as { text: string } | null;
      result.reply = `Draft for ${focusLead.name} (${intentKeyword.replace("_", " ")}):\n\n"${data?.text ?? ""}"\n\nApprove with "send the whatsapp" to push it.`;
      result.proposedCrmUpdates = [
        `Approval required before WhatsApp send to ${focusLead.name}`,
      ];
      break;
    }
    case "send_whatsapp": {
      if (!focusLead) {
        result.reply = "Pick a lead first.";
        break;
      }
      const draft = await runTool("draft_whatsapp", { id: focusLead.id, intent: "first_touch" });
      const data = draft.result as { text: string } | null;
      const send = await runTool(
        "send_whatsapp",
        { id: focusLead.id, text: data?.text ?? "" },
        true,
      );
      const sendResult = send.result as { sent: boolean; reason?: string; messageId?: string } | null;
      result.reply = sendResult?.sent
        ? `Sent. Meta message ID ${sendResult.messageId}. Logged to ${focusLead.name}'s timeline.`
        : `Could not send: ${sendResult?.reason ?? "unknown reason"}.`;
      break;
    }
    case "draft_call": {
      if (!focusLead) {
        result.reply = "Pick a lead first.";
        break;
      }
      const draft = await runTool("draft_call_script", { id: focusLead.id, language: "hinglish" });
      const data = draft.result as { opener: string; probes: string[] } | null;
      result.reply =
        `Qualification script for ${focusLead.name}:\n\n${data?.opener ?? ""}\n\nProbe order:\n` +
        (data?.probes ?? []).map((p) => `• ${p}`).join("\n");
      break;
    }
    case "place_call": {
      if (!focusLead) {
        result.reply = "Pick a lead first.";
        break;
      }
      const call = await runTool("start_call", { id: focusLead.id }, true);
      const callResult = call.result as { placed: boolean; reason?: string; callId?: string } | null;
      result.reply = callResult?.placed
        ? `Call queued. ID ${callResult.callId}. I'll write the transcript back to the timeline when it completes.`
        : `Could not place call: ${callResult?.reason ?? "unknown reason"}.`;
      break;
    }
    case "move_stage": {
      if (!focusLead) {
        result.reply = "Pick a lead first.";
        break;
      }
      const match = message.match(/move to (\w+(?: \w+)?)/i);
      const stage = match?.[1] ?? null;
      if (!stage) {
        result.reply = "Tell me which stage. Try: \"move to Warm\".";
        break;
      }
      const moved = await runTool("move_stage", { id: focusLead.id, stage });
      const updated = moved.result as TwentyLead | null;
      result.reply = updated
        ? `${focusLead.name} moved from ${focusLead.stage} to ${updated.stage}.`
        : `Could not move stage: ${moved.status}.`;
      break;
    }
    case "lead_overview":
    case "general":
    default: {
      if (focusLead) {
        const matches = await runTool("match_properties_for_lead", { id: focusLead.id });
        const matchResult = matches.result as
          | { matches: AgentResult["recommendedProperties"] }
          | null;
        result.recommendedProperties = matchResult?.matches?.slice(0, 3) ?? [];
        result.reply = `${focusLead.name} · ${focusLead.stage} · owner ${focusLead.assignedTo}. Next: ${focusLead.nextAction}.`;
        result.proposedCrmUpdates = [
          `Confirm next action: ${focusLead.nextAction}`,
          focusLead.assignedTo === "Unassigned"
            ? "Assign an owner before external follow-up"
            : `Keep owner as ${focusLead.assignedTo}`,
        ];
      } else {
        const search = await runTool("search_leads", {});
        const leads = (search.result as TwentyLead[] | null) ?? [];
        result.reply = `I have ${leads.length} leads in this workspace. Pick one or ask: "hot leads", "stale leads", or "match properties".`;
      }
    }
  }

  return result;
}

export async function runAgent(input: {
  message: string;
  leadId?: string;
  tenantId?: string;
  actor?: string;
}): Promise<AgentResult> {
  const tenant = getTenantConfig(input.tenantId);
  if (tenant.ai) {
    try {
      const { runAiAgent } = await import("@/lib/agent/ai-runner");
      return await runAiAgent({
        message: input.message,
        leadId: input.leadId,
        tenantId: input.tenantId,
        actor: input.actor,
        ai: tenant.ai,
      });
    } catch (error) {
      const ctx = createToolContext(input.tenantId, input.actor ?? "User");
      const fallback = await runDeterministic(input.message, input.leadId, ctx);
      return {
        ...fallback,
        reply: `(AI provider error, fell back to deterministic mode: ${
          error instanceof Error ? error.message : String(error)
        })\n\n${fallback.reply}`,
      };
    }
  }

  const ctx = createToolContext(input.tenantId, input.actor ?? "User");
  return runDeterministic(input.message, input.leadId, ctx);
}

export type { TwentyLead, TwentyProperty };
