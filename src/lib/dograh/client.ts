import type { DograhCreds } from "@/lib/tenant/config";

export type DograhCallInitiateInput = {
  workflowId?: number;
  telephonyConfigurationId?: number;
  phoneNumber: string;
  fromPhoneNumberId?: number;
};

export type DograhCallInitiateResult = {
  callId: string;
  status: "queued" | "initiated" | "failed";
  providerMetadata?: Record<string, unknown>;
};

export type DograhWorkflowRun = {
  id: number;
  state: "INITIALIZED" | "RUNNING" | "COMPLETED" | "FAILED";
  gatheredContext?: {
    callId?: string;
    disposition?: string;
    duration?: number;
    transcript?: string;
  };
  recordingUrl?: string;
  transcriptUrl?: string;
  costInfo?: Record<string, unknown>;
};

export class DograhClient {
  readonly mode: "live" | "mock";
  private readonly creds: DograhCreds | null;
  private readonly mockRuns: Map<string, DograhWorkflowRun> = new Map();

  constructor(creds: DograhCreds | null) {
    this.creds = creds;
    this.mode = creds ? "live" : "mock";
  }

  async initiateCall(input: DograhCallInitiateInput): Promise<DograhCallInitiateResult> {
    if (this.mode === "live") {
      return this.liveRequest<DograhCallInitiateResult>(
        "POST",
        "/api/v1/telephony/initiate-call",
        {
          workflow_id: input.workflowId ?? this.creds?.defaultWorkflowId,
          telephony_configuration_id:
            input.telephonyConfigurationId ?? this.creds?.defaultTelephonyConfigId,
          phone_number: input.phoneNumber,
          from_phone_number_id: input.fromPhoneNumberId,
        },
      );
    }
    const callId = `mock-call-${Date.now()}`;
    this.mockRuns.set(callId, {
      id: this.mockRuns.size + 1,
      state: "RUNNING",
      gatheredContext: { callId },
    });
    return { callId, status: "queued", providerMetadata: { mode: "mock" } };
  }

  async getWorkflowRun(idOrCallId: string | number): Promise<DograhWorkflowRun | null> {
    if (this.mode === "live") {
      try {
        return await this.liveRequest<DograhWorkflowRun>(
          "GET",
          `/api/v1/workflow-runs/${idOrCallId}`,
        );
      } catch {
        return null;
      }
    }
    const key = String(idOrCallId);
    const run = this.mockRuns.get(key);
    if (!run) return null;
    // Simulate completion on second poll
    if (run.state === "RUNNING") {
      run.state = "COMPLETED";
      run.gatheredContext = {
        ...run.gatheredContext,
        disposition: "Interested",
        duration: 96,
        transcript: "Mock transcript: prospect confirmed budget and asked for shortlist.",
      };
    }
    return run;
  }

  private async liveRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
    if (!this.creds) throw new Error("Dograh credentials missing");
    const response = await fetch(`${this.creds.url}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.creds.apiKey}`,
        "content-type": "application/json",
        "x-organization-id": this.creds.organizationId,
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`Dograh ${method} ${path} failed: ${response.status}`);
    }
    return (await response.json()) as T;
  }
}
