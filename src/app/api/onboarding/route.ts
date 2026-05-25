import { NextResponse } from "next/server";

import { getTenantConfig } from "@/lib/tenant/config";
import {
  getProfile,
  listProfiles,
  saveProfile,
  type OnboardingProfile,
} from "@/lib/onboarding/profile";

export const runtime = "nodejs";

type SubmitPayload = {
  brokerage?: OnboardingProfile["brokerage"];
  sources?: string[];
  pipelineStages?: string[];
  whatsapp?: {
    skipped?: boolean;
    phoneNumberId?: string;
    wabaId?: string;
    verifyToken?: string;
    accessToken?: string;
    appSecret?: string;
  };
  voice?: {
    skipped?: boolean;
    provider?: string;
    accountSid?: string;
    authToken?: string;
    fromNumber?: string;
    callingHoursStart?: string;
    callingHoursEnd?: string;
    languages?: string[];
  };
  ai?: {
    skipped?: boolean;
    provider?: string;
    model?: string;
    apiKey?: string;
    spendCapUsd?: number;
  };
  approvals?: OnboardingProfile["approvals"];
};

function last4(value?: string): string {
  if (!value || value.length <= 4) return "****";
  return `…${value.slice(-4)}`;
}

export async function POST(request: Request) {
  let body: SubmitPayload;
  try {
    body = (await request.json()) as SubmitPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.brokerage?.name) {
    return NextResponse.json(
      { ok: false, error: "Brokerage name is required" },
      { status: 400 },
    );
  }

  const tenant = getTenantConfig();
  const profile: OnboardingProfile = {
    tenantId: tenant.id,
    brokerage: {
      name: body.brokerage.name,
      city: body.brokerage.city ?? "",
      languages: body.brokerage.languages ?? ["English"],
      teamSize: body.brokerage.teamSize ?? 1,
    },
    sources: body.sources ?? [],
    pipelineStages:
      body.pipelineStages && body.pipelineStages.length > 0
        ? body.pipelineStages
        : [
            "New",
            "Contacted",
            "Cold",
            "Warm",
            "Hot",
            "Negotiation",
            "Closed Won",
            "Closed Lost",
          ],
    whatsapp: body.whatsapp?.skipped
      ? { connected: false, skipped: true }
      : body.whatsapp?.phoneNumberId && body.whatsapp.accessToken
        ? {
            connected: true,
            phoneNumberId: body.whatsapp.phoneNumberId,
            wabaId: body.whatsapp.wabaId ?? "",
            verifyTokenLast4: last4(body.whatsapp.verifyToken),
          }
        : { connected: false, skipped: false },
    voice: body.voice?.skipped
      ? { connected: false, skipped: true }
      : body.voice?.provider && body.voice.fromNumber
        ? {
            connected: true,
            provider: body.voice.provider,
            fromNumber: body.voice.fromNumber,
            callingHoursStart: body.voice.callingHoursStart ?? "10:00",
            callingHoursEnd: body.voice.callingHoursEnd ?? "19:00",
            languages: body.voice.languages ?? ["English", "Hindi"],
          }
        : { connected: false, skipped: false },
    ai: body.ai?.skipped
      ? { connected: false, skipped: true }
      : body.ai?.apiKey
        ? {
            connected: true,
            provider: body.ai.provider ?? "openrouter",
            model: body.ai.model ?? "openrouter/auto",
            spendCapUsd: body.ai.spendCapUsd,
          }
        : { connected: false, skipped: false },
    approvals: body.approvals ?? {
      whatsapp: true,
      voice: true,
      dndCheck: true,
      approver: "Owner",
    },
    completedAt: new Date().toISOString(),
  };

  saveProfile(profile);

  // Provisioning is a TODO: in production this would:
  //   1. Twenty: POST /metadata/createObject for Property, SiteVisit, Requirement
  //      Then seed pipeline stages and default sources via the records API.
  //   2. Dograh: POST /api/v1/organizations + /api/v1/telephony/configurations
  //      with the provider creds; upload a default qualification WorkflowModel.
  //   3. WhatsApp: verify creds via verifyPhoneNumber() and store encrypted.
  //   4. AI: store key in vault and set spend cap.
  // For now, save the profile and surface what's connected for the UI.

  return NextResponse.json({
    ok: true,
    tenantId: profile.tenantId,
    profile,
    provisioning: {
      twenty: "scheduled (would create workspace + real-estate template via Metadata API)",
      dograh: profile.voice.connected ? "scheduled (would create org + telephony config)" : "skipped",
      whatsapp: profile.whatsapp.connected ? "scheduled (would verify creds via Meta)" : "skipped",
      ai: profile.ai.connected ? "stored" : "skipped",
    },
  });
}

export function GET(request: Request) {
  const url = new URL(request.url);
  const tenantId = url.searchParams.get("tenantId");
  if (tenantId) {
    const profile = getProfile(tenantId);
    if (!profile) {
      return NextResponse.json({ ok: false, error: "No profile" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, profile });
  }
  return NextResponse.json({ ok: true, profiles: listProfiles() });
}
