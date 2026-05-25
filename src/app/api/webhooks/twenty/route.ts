import crypto from "node:crypto";

import { NextResponse } from "next/server";

export const runtime = "nodejs";

type TwentyWebhookEvent = {
  event: string;
  data: { record: { id: string } & Record<string, unknown> };
  timestamp: string;
  workspaceId?: string;
};

function verifyTwentySignature(rawBody: string, header: string | null, secret: string): boolean {
  if (!header) return false;
  // Twenty signs `${timestamp}:${payload}` per docs.
  const match = header.match(/t=([^,]+),v1=([0-9a-f]+)/i);
  if (!match) return false;
  const [, timestamp, providedHex] = match;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}:${rawBody}`, "utf8")
    .digest("hex");
  if (expected.length !== providedHex.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(providedHex, "hex"));
}

export async function POST(request: Request) {
  const secret = process.env.TWENTY_WEBHOOK_SECRET;
  const rawBody = await request.text();

  if (secret) {
    const ok = verifyTwentySignature(
      rawBody,
      request.headers.get("x-twenty-webhook-signature"),
      secret,
    );
    if (!ok) {
      return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 401 });
    }
  }

  let event: TwentyWebhookEvent;
  try {
    event = JSON.parse(rawBody) as TwentyWebhookEvent;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  // No persistent log yet — the audit decisions log captures agent-side
  // changes. External Twenty edits are acknowledged so the chat sidebar can
  // refetch on the next interaction. Real-time pushes can hook in later.
  return NextResponse.json({
    ok: true,
    received: event.event,
    recordId: event.data?.record?.id,
    workspaceId: event.workspaceId,
  });
}

export function GET() {
  return NextResponse.json({
    ok: true,
    contract: "POST Twenty webhook payloads here. Set TWENTY_WEBHOOK_SECRET to enforce HMAC.",
  });
}
