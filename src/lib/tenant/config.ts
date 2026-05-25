export type TwentyCreds = {
  url: string;
  apiKey: string;
  workspaceId?: string;
};

export type WhatsappCreds = {
  phoneNumberId: string;
  wabaId: string;
  accessToken: string;
  verifyToken: string;
  appSecret: string;
};

export type DograhCreds = {
  url: string;
  apiKey: string;
  organizationId: string;
  defaultWorkflowId?: number;
  defaultTelephonyConfigId?: number;
};

export type AiCreds = {
  provider: string;
  model: string;
  apiKey: string;
  spendCapUsd?: number;
};

export type TenantPolicy = {
  callingHoursStart: string;
  callingHoursEnd: string;
  approvalRequiredForWhatsapp: boolean;
  approvalRequiredForVoice: boolean;
  dndCheckEnabled: boolean;
};

export type TenantConfig = {
  id: string;
  name: string;
  twenty: TwentyCreds | null;
  whatsapp: WhatsappCreds | null;
  dograh: DograhCreds | null;
  ai: AiCreds | null;
  policy: TenantPolicy;
};

const DEFAULT_POLICY: TenantPolicy = {
  callingHoursStart: "10:00",
  callingHoursEnd: "19:00",
  approvalRequiredForWhatsapp: true,
  approvalRequiredForVoice: true,
  dndCheckEnabled: true,
};

function readTwenty(): TwentyCreds | null {
  const url = process.env.TWENTY_SERVER_URL;
  const apiKey = process.env.TWENTY_API_KEY;
  if (!url || !apiKey) return null;
  return { url, apiKey, workspaceId: process.env.TWENTY_WORKSPACE_ID };
}

function readWhatsapp(): WhatsappCreds | null {
  const phoneNumberId = process.env.META_PHONE_NUMBER_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
  const appSecret = process.env.META_APP_SECRET;
  const wabaId = process.env.META_WABA_ID;
  if (!phoneNumberId || !accessToken || !verifyToken || !appSecret || !wabaId) return null;
  return { phoneNumberId, accessToken, verifyToken, appSecret, wabaId };
}

function readDograh(): DograhCreds | null {
  const url = process.env.DOGRAH_API_URL;
  const apiKey = process.env.DOGRAH_API_KEY;
  const organizationId = process.env.DOGRAH_ORG_ID;
  if (!url || !apiKey || !organizationId) return null;
  return {
    url,
    apiKey,
    organizationId,
    defaultWorkflowId: process.env.DOGRAH_DEFAULT_WORKFLOW_ID
      ? Number(process.env.DOGRAH_DEFAULT_WORKFLOW_ID)
      : undefined,
    defaultTelephonyConfigId: process.env.DOGRAH_DEFAULT_TELEPHONY_CONFIG_ID
      ? Number(process.env.DOGRAH_DEFAULT_TELEPHONY_CONFIG_ID)
      : undefined,
  };
}

function readAi(): AiCreds | null {
  const apiKey =
    process.env.AI_GATEWAY_API_KEY ||
    process.env.OPENROUTER_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return {
    provider: process.env.AI_PROVIDER ?? "openrouter",
    model: process.env.AI_MODEL ?? "openrouter/auto",
    apiKey,
    spendCapUsd: process.env.AI_DAILY_SPEND_LIMIT_USD
      ? Number(process.env.AI_DAILY_SPEND_LIMIT_USD)
      : undefined,
  };
}

const DEMO_TENANT: TenantConfig = {
  id: "TNT-PRATAP-DEMO",
  name: "Pratap Demo Brokerage",
  twenty: readTwenty(),
  whatsapp: readWhatsapp(),
  dograh: readDograh(),
  ai: readAi(),
  policy: DEFAULT_POLICY,
};

export function getTenantConfig(tenantId?: string): TenantConfig {
  if (tenantId && tenantId !== DEMO_TENANT.id) {
    throw new Error(`Unknown tenant: ${tenantId}`);
  }
  return DEMO_TENANT;
}

export function summarizeConnectivity(config: TenantConfig) {
  return {
    twenty: config.twenty ? "live" : "mock",
    whatsapp: config.whatsapp ? "live" : "mock",
    dograh: config.dograh ? "live" : "mock",
    ai: config.ai ? "live" : "deterministic",
  } as const;
}
