import { NextResponse } from "next/server";

import { runAgent } from "@/lib/agent/runner";
import { tools } from "@/lib/agent/tools";
import { listDecisions } from "@/lib/audit/decisions";
import { getTenantConfig, summarizeConnectivity } from "@/lib/tenant/config";

export const runtime = "nodejs";

type AgentRequest = {
  message?: string;
  leadId?: string;
  tenantId?: string;
  /** If true and AI is configured, stream the response. */
  stream?: boolean;
};

export const META_DELIMITER = "\n__META__\n";

export function GET() {
  const tenant = getTenantConfig();
  return NextResponse.json(
    {
      ok: true,
      agent: "Pratap real estate sales agent",
      connectivity: summarizeConnectivity(tenant),
      tools: tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        requiresApproval: tool.requiresApproval,
      })),
      recentDecisions: listDecisions(tenant.id, 5),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  let body: AgentRequest;
  try {
    body = (await request.json()) as AgentRequest;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const message = body.message?.trim();
  if (!message) {
    return NextResponse.json(
      { ok: false, error: "Send a message for the agent to process" },
      { status: 400 },
    );
  }

  const tenant = getTenantConfig(body.tenantId);
  const shouldStream = body.stream !== false && Boolean(tenant.ai);

  if (shouldStream && tenant.ai) {
    // Lazy import keeps the AI runner out of deterministic-mode bundles.
    const { runAiAgentStream } = await import("@/lib/agent/ai-runner");
    let stream: ReturnType<typeof runAiAgentStream>;
    try {
      stream = runAiAgentStream({
        message,
        leadId: body.leadId,
        tenantId: body.tenantId,
        ai: tenant.ai,
      });
    } catch (error) {
      return NextResponse.json(
        { ok: false, error: `AI provider failed: ${error instanceof Error ? error.message : String(error)}` },
        { status: 502 },
      );
    }

    const encoder = new TextEncoder();
    const responseStream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of stream.textStream) {
            controller.enqueue(encoder.encode(chunk));
          }
          const meta = await stream.meta;
          controller.enqueue(encoder.encode(META_DELIMITER + JSON.stringify(meta)));
        } catch (error) {
          const errPayload = { error: error instanceof Error ? error.message : String(error) };
          controller.enqueue(encoder.encode(META_DELIMITER + JSON.stringify({ error: errPayload })));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(responseStream, {
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "x-agent-mode": "ai-stream",
        "cache-control": "no-store",
      },
    });
  }

  const result = await runAgent({
    message,
    leadId: body.leadId,
    tenantId: body.tenantId,
  });

  return NextResponse.json({
    ok: true,
    mode: result.mode,
    connectivity: summarizeConnectivity(tenant),
    agentResponse: result.reply,
    reply: result.reply,
    toolCalls: result.toolCalls,
    proposedCrmUpdates: result.proposedCrmUpdates,
    recommendedProperties: result.recommendedProperties,
    selectedLead: result.selectedLead,
  });
}
