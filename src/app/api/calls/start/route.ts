import { NextResponse } from "next/server";

import { callTool, createToolContext } from "@/lib/agent/tools";

export const runtime = "nodejs";

type StartCallPayload = {
  tenantId?: string;
  leadId?: string;
  workflowId?: number;
  /** Set to true if the call was already approved via the approvals UI. */
  approved?: boolean;
};

export async function POST(request: Request) {
  let body: StartCallPayload;
  try {
    body = (await request.json()) as StartCallPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.leadId) {
    return NextResponse.json(
      { ok: false, error: "Missing leadId" },
      { status: 400 },
    );
  }

  const ctx = createToolContext(body.tenantId, "Calls API");
  const call = await callTool(
    "start_call",
    { id: body.leadId, workflowId: body.workflowId?.toString() },
    ctx,
    { prompt: "/api/calls/start", approved: Boolean(body.approved) },
  );

  return NextResponse.json({
    ok: call.status !== "blocked",
    status: call.status,
    decisionId: call.decisionId,
    result: call.result,
    mode: ctx.dograh.mode,
  });
}
