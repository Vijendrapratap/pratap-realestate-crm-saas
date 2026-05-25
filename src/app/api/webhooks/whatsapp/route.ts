import { NextResponse } from "next/server";

import { createToolContext } from "@/lib/agent/tools";
import { getTenantConfig } from "@/lib/tenant/config";
import { parseInboundMessages, verifyWebhookSignature } from "@/lib/whatsapp/meta-api";

export const runtime = "nodejs";

/**
 * Meta sends a GET verification challenge during webhook setup.
 * Echo `hub.challenge` back if `hub.verify_token` matches the tenant's
 * stored value. Meta requires plain-text response, not JSON.
 */
export function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  const tenant = getTenantConfig();
  if (mode !== "subscribe" || !token || !challenge) {
    return new NextResponse("Bad Request", { status: 400 });
  }
  if (!tenant.whatsapp || tenant.whatsapp.verifyToken !== token) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  return new NextResponse(challenge, {
    status: 200,
    headers: { "content-type": "text/plain" },
  });
}

export async function POST(request: Request) {
  const tenant = getTenantConfig();
  if (!tenant.whatsapp) {
    return NextResponse.json(
      { ok: false, error: "WhatsApp not configured for this tenant" },
      { status: 503 },
    );
  }

  const rawBody = await request.text();
  const signatureValid = verifyWebhookSignature({
    rawBody,
    signatureHeader: request.headers.get("x-hub-signature-256"),
    appSecret: tenant.whatsapp.appSecret,
  });
  if (!signatureValid) {
    return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const inbound = parseInboundMessages(payload);
  const ctx = createToolContext(tenant.id, "WhatsApp inbound");
  const results: Array<{ from: string; leadId: string; created: boolean }> = [];

  for (const message of inbound) {
    let lead = await ctx.twenty.findLeadByPhone(message.from);
    let created = false;
    if (!lead) {
      lead = await ctx.twenty.createLead({
        name: message.contactName ?? `WhatsApp ${message.from}`,
        phone: message.from,
        channel: "WhatsApp",
        source: "WhatsApp inbound",
        requirement: message.text ?? "(WhatsApp inquiry)",
        location: "Needs qualification",
      });
      created = true;
    }
    await ctx.twenty.addActivity(lead.id, {
      type: "WhatsApp inbound",
      title: `Message from ${message.from}`,
      detail: message.text ?? `Non-text message (${message.type}) id ${message.messageId}`,
      actor: "WhatsApp",
    });
    results.push({ from: message.from, leadId: lead.id, created });
  }

  return NextResponse.json({ ok: true, processed: results.length, results });
}
