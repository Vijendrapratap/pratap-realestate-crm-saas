import { NextResponse } from "next/server";

import { callTool, createToolContext } from "@/lib/agent/tools";

export const runtime = "nodejs";

type IngestPayload = {
  tenantId?: string;
  source?: string;
  channel?: string;
  name?: string;
  phone?: string;
  email?: string;
  requirement?: string;
  location?: string;
  budget?: string;
  /**
   * Optional shared secret. If N8N_WEBHOOK_SECRET is set, the request must
   * include the header `x-ingest-secret` with the same value.
   */
};

function checkSecret(request: Request): { ok: true } | { ok: false; reason: string } {
  const expected = process.env.N8N_WEBHOOK_SECRET;
  if (!expected) return { ok: true };
  const header = request.headers.get("x-ingest-secret");
  if (header !== expected) return { ok: false, reason: "Invalid x-ingest-secret" };
  return { ok: true };
}

export async function POST(request: Request) {
  const auth = checkSecret(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.reason }, { status: 401 });
  }

  let body: IngestPayload;
  try {
    body = (await request.json()) as IngestPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.name || !body.phone) {
    return NextResponse.json(
      { ok: false, error: "Missing required fields", required: ["name", "phone"] },
      { status: 400 },
    );
  }

  const ctx = createToolContext(body.tenantId, body.source ?? "Ingest webhook");
  const call = await callTool(
    "create_lead",
    {
      name: body.name,
      phone: body.phone,
      email: body.email,
      requirement: body.requirement,
      location: body.location,
      budget: body.budget,
      source: body.source,
      channel: body.channel,
    },
    ctx,
    { prompt: "ingest" },
  );

  if (call.status === "blocked") {
    return NextResponse.json(
      { ok: false, error: "Lead creation failed", decisionId: call.decisionId },
      { status: 500 },
    );
  }

  const result = call.result as { duplicate: boolean; lead: unknown } | null;
  return NextResponse.json(
    {
      ok: true,
      mode: ctx.twenty.mode,
      tenantId: ctx.tenant.id,
      duplicate: result?.duplicate ?? false,
      lead: result?.lead,
      decisionId: call.decisionId,
    },
    { status: result?.duplicate ? 200 : 201 },
  );
}

export function GET() {
  return NextResponse.json({
    ok: true,
    contract: {
      method: "POST",
      body: {
        tenantId: "string (optional, defaults to demo tenant)",
        name: "string (required)",
        phone: "string (required, any format)",
        email: "string (optional)",
        requirement: "string",
        location: "string",
        budget: "string",
        source: "string e.g. Meta Lead Ads",
        channel: "string e.g. Meta",
      },
      headers: { "x-ingest-secret": "matches N8N_WEBHOOK_SECRET if set" },
    },
  });
}
