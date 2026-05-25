import crypto from "node:crypto";

const META_API_VERSION = "v21.0";
const META_API_BASE = `https://graph.facebook.com/${META_API_VERSION}`;

export type MetaSendResult = { messageId: string };

export type MetaPhoneInfo = {
  id: string;
  display_phone_number: string;
  verified_name?: string;
  quality_rating?: string;
};

type MetaErrorResponse = {
  error?: { message?: string; code?: number; type?: string };
};

async function throwMetaError(response: Response, fallback: string): Promise<never> {
  let message = fallback;
  try {
    const data = (await response.json()) as MetaErrorResponse;
    if (data.error?.message) message = data.error.message;
  } catch {}
  throw new Error(message);
}

export type VerifyPhoneNumberArgs = {
  phoneNumberId: string;
  accessToken: string;
};

export async function verifyPhoneNumber(
  args: VerifyPhoneNumberArgs,
): Promise<MetaPhoneInfo> {
  const url = `${META_API_BASE}/${args.phoneNumberId}?fields=id,display_phone_number,verified_name,quality_rating`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${args.accessToken}` },
  });
  if (!response.ok) {
    await throwMetaError(response, `Meta API error: ${response.status}`);
  }
  return (await response.json()) as MetaPhoneInfo;
}

export type SendTextMessageArgs = {
  phoneNumberId: string;
  accessToken: string;
  to: string;
  text: string;
  contextMessageId?: string;
};

export async function sendTextMessage(
  args: SendTextMessageArgs,
): Promise<MetaSendResult> {
  const url = `${META_API_BASE}/${args.phoneNumberId}/messages`;
  const body: Record<string, unknown> = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: args.to,
    type: "text",
    text: { body: args.text },
  };
  if (args.contextMessageId) body.context = { message_id: args.contextMessageId };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${args.accessToken}`,
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    await throwMetaError(response, `Meta API error: ${response.status}`);
  }
  const data = (await response.json()) as { messages: Array<{ id: string }> };
  return { messageId: data.messages[0].id };
}

export type SendTemplateMessageArgs = {
  phoneNumberId: string;
  accessToken: string;
  to: string;
  templateName: string;
  language?: string;
  params?: string[];
  contextMessageId?: string;
};

export async function sendTemplateMessage(
  args: SendTemplateMessageArgs,
): Promise<MetaSendResult> {
  const url = `${META_API_BASE}/${args.phoneNumberId}/messages`;
  const template: Record<string, unknown> = {
    name: args.templateName,
    language: { code: args.language ?? "en_US" },
  };
  if (args.params && args.params.length > 0) {
    template.components = [
      {
        type: "body",
        parameters: args.params.map((value) => ({ type: "text", text: String(value) })),
      },
    ];
  }
  const body: Record<string, unknown> = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: args.to,
    type: "template",
    template,
  };
  if (args.contextMessageId) body.context = { message_id: args.contextMessageId };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${args.accessToken}`,
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    await throwMetaError(response, `Meta API error: ${response.status}`);
  }
  const data = (await response.json()) as { messages: Array<{ id: string }> };
  return { messageId: data.messages[0].id };
}

export type VerifyWebhookSignatureArgs = {
  rawBody: string;
  signatureHeader: string | null;
  appSecret: string;
};

/**
 * Meta sends `X-Hub-Signature-256: sha256=<hex>`. Verify the raw body against
 * the configured app secret. Constant-time compare.
 */
export function verifyWebhookSignature(args: VerifyWebhookSignatureArgs): boolean {
  if (!args.signatureHeader) return false;
  const expected = crypto
    .createHmac("sha256", args.appSecret)
    .update(args.rawBody, "utf8")
    .digest("hex");
  const provided = args.signatureHeader.replace(/^sha256=/, "");
  if (provided.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(provided, "hex"));
}

export type InboundMessage = {
  messageId: string;
  from: string;
  type: string;
  text?: string;
  timestamp: string;
  phoneNumberId: string;
  contactName?: string;
};

type WebhookValueContact = { wa_id: string; profile?: { name?: string } };
type WebhookValueMessage = {
  id: string;
  from: string;
  timestamp: string;
  type: string;
  text?: { body: string };
};
type WebhookValue = {
  metadata?: { phone_number_id: string };
  contacts?: WebhookValueContact[];
  messages?: WebhookValueMessage[];
};
type WebhookEntryChange = { field: string; value: WebhookValue };
type WebhookEntry = { id: string; changes: WebhookEntryChange[] };
type WebhookPayload = { object: string; entry: WebhookEntry[] };

export function parseInboundMessages(payload: unknown): InboundMessage[] {
  const data = payload as WebhookPayload;
  if (!data || data.object !== "whatsapp_business_account") return [];

  const inbound: InboundMessage[] = [];
  for (const entry of data.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== "messages") continue;
      const value = change.value;
      const phoneNumberId = value.metadata?.phone_number_id ?? "";
      const contactName = value.contacts?.[0]?.profile?.name;
      for (const message of value.messages ?? []) {
        inbound.push({
          messageId: message.id,
          from: message.from,
          type: message.type,
          text: message.text?.body,
          timestamp: message.timestamp,
          phoneNumberId,
          contactName,
        });
      }
    }
  }
  return inbound;
}
