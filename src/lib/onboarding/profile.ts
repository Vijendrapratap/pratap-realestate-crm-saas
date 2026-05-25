export type OnboardingProfile = {
  tenantId: string;
  brokerage: {
    name: string;
    city: string;
    languages: string[];
    teamSize: number;
  };
  sources: string[];
  pipelineStages: string[];
  whatsapp:
    | {
        connected: true;
        phoneNumberId: string;
        wabaId: string;
        verifyTokenLast4: string;
      }
    | { connected: false; skipped: boolean };
  voice:
    | {
        connected: true;
        provider: string;
        fromNumber: string;
        callingHoursStart: string;
        callingHoursEnd: string;
        languages: string[];
      }
    | { connected: false; skipped: boolean };
  ai:
    | { connected: true; provider: string; model: string; spendCapUsd?: number }
    | { connected: false; skipped: boolean };
  approvals: {
    whatsapp: boolean;
    voice: boolean;
    dndCheck: boolean;
    approver: string;
  };
  completedAt: string;
};

const profiles = new Map<string, OnboardingProfile>();

export function saveProfile(profile: OnboardingProfile): OnboardingProfile {
  profiles.set(profile.tenantId, profile);
  return profile;
}

export function getProfile(tenantId: string): OnboardingProfile | null {
  return profiles.get(tenantId) ?? null;
}

export function listProfiles(): OnboardingProfile[] {
  return Array.from(profiles.values());
}

export const DEFAULT_STAGES = [
  "New",
  "Contacted",
  "Cold",
  "Warm",
  "Hot",
  "Negotiation",
  "Closed Won",
  "Closed Lost",
] as const;

export const SOURCE_OPTIONS = [
  "Meta Lead Ads",
  "Google Forms",
  "99acres",
  "MagicBricks",
  "Website",
  "Walk-in",
  "Referral",
  "Google Sheets / CSV",
  "WhatsApp",
] as const;

export const LANGUAGE_OPTIONS = ["English", "Hindi", "Hinglish", "Marathi", "Punjabi", "Tamil"] as const;
