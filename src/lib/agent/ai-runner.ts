import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { dynamicTool, generateText, jsonSchema, stepCountIs, streamText } from "ai";

import {
  callTool,
  createToolContext,
  tools,
  type ToolContext,
  type ToolDef,
} from "@/lib/agent/tools";
import type { AgentResult } from "@/lib/agent/runner";
import { computeTenantSignals } from "@/lib/audit/decisions";
import type { AiCreds } from "@/lib/tenant/config";

const SYSTEM_PROMPT = `You are the Pratap real-estate sales agent.

You operate on a CRM (Twenty) and two channels (WhatsApp via Meta Cloud, voice via Dograh). Use the provided tools to read leads, properties, and activities, and to propose updates. Be specific, concise, and always cite the lead IDs you acted on.

Rules:
- Always start by reading relevant data with search_leads, get_lead, or match_properties_for_lead before recommending.
- For external actions (send_whatsapp, start_call), the tool may return status "needs_approval" — in that case, tell the user the action is queued for approval and what they should approve, do not retry it.
- When reasoning about which lead to focus on, use stage (Hot > Warm > Negotiation > New) and the responseSla field (Breached > At risk > On track).
- When matching properties to a lead, prefer match_properties_for_lead over manually picking.
- Keep replies under 6 sentences unless the user explicitly asks for a longer report.
- Output PLAIN TEXT ONLY. Do not use markdown syntax — no **bold**, no *italics*, no # headers, no \`backticks\`, no bullet markers like -, *, or numbered lists. Separate items with line breaks and prefix them with "• " if a list is needed. The UI shows your text verbatim.`;

function buildSystemPrompt(ctx: ToolContext, focusHint: string): string {
  const signals = computeTenantSignals(ctx.tenant.id);
  let learnedSection = "";
  if (signals.totalDecisions > 0) {
    const perTool = Object.entries(signals.perTool)
      .map(([name, counts]) => {
        const total = counts.proposed;
        const approvalRate = total ? Math.round((counts.approved / total) * 100) : 0;
        const rejectionRate = total ? Math.round((counts.rejected / total) * 100) : 0;
        return `  ${name}: ${total} proposed, ${approvalRate}% approved, ${rejectionRate}% rejected`;
      })
      .join("\n");
    learnedSection = `\n\nLearned from this workspace (last ${signals.totalDecisions} agent decisions):\n${perTool}\n\nIf a tool has a high rejection rate here, propose alternatives or ask the user before using it.`;
  }
  return `${SYSTEM_PROMPT}\n\nWorkspace context: tenant ${ctx.tenant.id}. ${focusHint}${learnedSection}`;
}

function adaptTools(ctx: ToolContext, prompt: string) {
  const adapted: Record<string, ReturnType<typeof dynamicTool>> = {};
  for (const def of tools) {
    adapted[def.name] = dynamicTool({
      description: def.description + (def.requiresApproval ? " [requires human approval]" : ""),
      inputSchema: jsonSchema(def.inputSchema as Parameters<typeof jsonSchema>[0]),
      execute: async (args: unknown) => {
        const call = await callTool(
          def.name,
          (args as Record<string, unknown>) ?? {},
          ctx,
          { prompt },
        );
        return {
          status: call.status,
          decisionId: call.decisionId,
          result: call.result,
        };
      },
    });
  }
  return adapted;
}

type ToolCallSummary = AgentResult["toolCalls"][number];
type RecommendedProperty = AgentResult["recommendedProperties"][number];

function summarizeToolCalls(
  steps: Array<{
    toolCalls?: Array<{ toolName: string; input?: unknown }>;
    toolResults?: Array<{ output?: unknown }>;
  }>,
): { toolCalls: ToolCallSummary[]; properties: RecommendedProperty[] } {
  const toolCalls: ToolCallSummary[] = [];
  const properties: RecommendedProperty[] = [];

  for (const step of steps) {
    const calls = step.toolCalls ?? [];
    const results = step.toolResults ?? [];
    calls.forEach((call, index) => {
      const raw = results[index]?.output as
        | { status?: string; decisionId?: string; result?: unknown }
        | undefined;
      toolCalls.push({
        tool: call.toolName,
        args: (call.input as Record<string, unknown>) ?? {},
        decisionId: raw?.decisionId,
        status: (raw?.status as ToolCallSummary["status"]) ?? "executed",
        result: raw?.result,
      });
      if (call.toolName === "match_properties_for_lead") {
        const data = raw?.result as { matches?: RecommendedProperty[] } | undefined;
        if (data?.matches) properties.push(...data.matches);
      }
      if (call.toolName === "search_properties") {
        const list = raw?.result as
          | Array<{ id: string; title: string; price: string; matchReason?: string }>
          | undefined;
        if (list) {
          properties.push(
            ...list.slice(0, 3).map((property) => ({
              id: property.id,
              title: property.title,
              price: property.price,
              score: 0,
              reason: property.matchReason ?? "manual search",
            })),
          );
        }
      }
    });
  }
  return { toolCalls, properties };
}

function buildFocusHint(leadId?: string): string {
  return leadId
    ? `The user has selected lead ${leadId} in the UI. Prefer that lead unless they reference a different one.`
    : "No specific lead is selected. If the request is about a single lead, look it up first.";
}

export async function runAiAgent(input: {
  message: string;
  leadId?: string;
  tenantId?: string;
  actor?: string;
  ai: AiCreds;
}): Promise<AgentResult> {
  const ctx = createToolContext(input.tenantId, input.actor ?? "User");
  const openrouter = createOpenRouter({ apiKey: input.ai.apiKey });

  const result = await generateText({
    model: openrouter(input.ai.model),
    system: buildSystemPrompt(ctx, buildFocusHint(input.leadId)),
    prompt: input.message,
    tools: adaptTools(ctx, input.message),
    stopWhen: stepCountIs(8),
  });

  const { toolCalls, properties } = summarizeToolCalls(
    (result.steps as Parameters<typeof summarizeToolCalls>[0]) ?? [],
  );

  const focusLead = input.leadId ? await ctx.twenty.getLead(input.leadId) : null;

  return {
    mode: "ai",
    reply: result.text || "(no text returned)",
    toolCalls,
    proposedCrmUpdates: toolCalls
      .filter((call) => call.status === "needs_approval")
      .map((call) => `Awaiting approval: ${call.tool}(${JSON.stringify(call.args)})`),
    recommendedProperties: properties.slice(0, 5),
    selectedLead: focusLead
      ? {
          id: focusLead.id,
          name: focusLead.name,
          stage: focusLead.stage,
          owner: focusLead.assignedTo,
          nextAction: focusLead.nextAction,
        }
      : undefined,
  };
}

export type AiStreamResult = {
  mode: "ai";
  textStream: AsyncIterable<string>;
  /** Resolves when the model has finished all steps. */
  meta: Promise<Omit<AgentResult, "reply" | "mode">>;
};

/**
 * Streaming variant. The response body should be the text chunks followed by
 * a `\n__META__\n<json>` sentinel containing the structured data the UI
 * uses to render cards (toolCalls, recommendedProperties, selectedLead).
 */
export function runAiAgentStream(input: {
  message: string;
  leadId?: string;
  tenantId?: string;
  actor?: string;
  ai: AiCreds;
}): AiStreamResult {
  const ctx = createToolContext(input.tenantId, input.actor ?? "User");
  const openrouter = createOpenRouter({ apiKey: input.ai.apiKey });

  const result = streamText({
    model: openrouter(input.ai.model),
    system: buildSystemPrompt(ctx, buildFocusHint(input.leadId)),
    prompt: input.message,
    tools: adaptTools(ctx, input.message),
    stopWhen: stepCountIs(8),
    onError({ error }) {
      console.error("[ai-stream] error", error);
    },
  });

  const meta: Promise<Omit<AgentResult, "reply" | "mode">> = (async () => {
    const steps = (await result.steps) as Parameters<typeof summarizeToolCalls>[0];
    const { toolCalls, properties } = summarizeToolCalls(steps ?? []);
    const focusLead = input.leadId ? await ctx.twenty.getLead(input.leadId) : null;
    return {
      toolCalls,
      proposedCrmUpdates: toolCalls
        .filter((call) => call.status === "needs_approval")
        .map((call) => `Awaiting approval: ${call.tool}(${JSON.stringify(call.args)})`),
      recommendedProperties: properties.slice(0, 5),
      selectedLead: focusLead
        ? {
            id: focusLead.id,
            name: focusLead.name,
            stage: focusLead.stage,
            owner: focusLead.assignedTo,
            nextAction: focusLead.nextAction,
          }
        : undefined,
    };
  })();

  return { mode: "ai", textStream: result.textStream, meta };
}

export type { ToolDef };
