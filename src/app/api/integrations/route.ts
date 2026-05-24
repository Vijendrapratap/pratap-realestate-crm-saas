import { NextResponse } from "next/server";
import { integrationOptions } from "@/lib/crm-data";

export const runtime = "nodejs";

const requiredSecrets = {
  whatsapp: ["WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_WABA_ID", "WHATSAPP_ACCESS_TOKEN", "WHATSAPP_APP_SECRET", "WHATSAPP_VERIFY_TOKEN"],
  voice: ["VOICE_PROVIDER", "VOICE_API_KEY", "VOICE_FROM_NUMBER", "VOICE_WEBHOOK_SECRET"],
  model: ["AI_PROVIDER", "AI_MODEL", "AI_PROVIDER_API_KEY"],
};

function statusFor(keys: string[]) {
  const present = keys.filter((key) => Boolean(process.env[key]));
  return {
    configured: present.length === keys.length,
    present: present.map((key) => key.replace(/TOKEN|SECRET|KEY/g, "[REDACTED]")),
    missing: keys.filter((key) => !process.env[key]),
  };
}

export function GET() {
  return NextResponse.json(
    {
      ok: true,
      mode: "demo-integration-readiness",
      explanation:
        "This endpoint answers how the brokerage product connects to Twenty, WhatsApp, voice, and an AI model. Secrets must stay server-side and are never returned.",
      twenty: {
        installed: true,
        localUrl: "http://localhost:3001",
        publicDemoUrl: process.env.NEXT_PUBLIC_TWENTY_DEMO_URL ?? "https://pratap-twenty-demo.loca.lt",
        demoWorkspace: "Apple",
        demoLogin: "tim@apple.dev",
        sampleData: ["companies", "people", "opportunities", "tasks", "notes", "workflows"],
        note: "The public URL is a temporary Cloudflare quick tunnel for demo access. A production Twenty install needs a stable domain and persistent hosting.",
      },
      modelConnection: {
        current: "safe deterministic demo agent",
        connectedToExternalModel: statusFor(requiredSecrets.model).configured,
        productionPath: "Set AI_PROVIDER, AI_MODEL, and AI_PROVIDER_API_KEY, then allow the agent to call server-side CRM tools with audit logs and approval gates.",
        readiness: statusFor(requiredSecrets.model),
      },
      whatsapp: {
        provider: "WhatsApp Business Cloud API",
        productionPath: [
          "Create/verify Meta Business and WhatsApp Business Account",
          "Add phone number and message templates",
          "Store credentials only on the server",
          "Receive webhooks into /api/webhooks/whatsapp",
          "Let AI draft replies; require approval before outbound messages",
        ],
        readiness: statusFor(requiredSecrets.whatsapp),
      },
      voice: {
        recommendedFirstProvider: "Hosted telephony/voice AI provider before self-hosting",
        productionPath: [
          "Choose provider and buy/verify outbound number",
          "Configure webhook URL for call status/transcripts",
          "Map outcomes back to lead activity and next action",
          "Block DND/unconsented leads and require manager approval for sensitive calls",
        ],
        readiness: statusFor(requiredSecrets.voice),
      },
      integrations: integrationOptions,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
