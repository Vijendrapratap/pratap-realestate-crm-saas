import { activities as mockActivities, leads as mockLeads, properties as mockProperties } from "@/lib/crm-data";
import type { TwentyCreds } from "@/lib/tenant/config";
import type {
  ActivityInput,
  CreateLeadInput,
  TwentyActivity,
  TwentyLead,
  TwentyProperty,
} from "@/lib/twenty/types";

type Filters = {
  query?: string;
  stage?: string;
};

function normalizePhone(phone: string): string {
  return phone.replace(/[^+\d]/g, "");
}

export class TwentyClient {
  readonly mode: "live" | "mock";
  private readonly creds: TwentyCreds | null;
  private readonly tenantId: string;
  private readonly localLeads: TwentyLead[];
  private readonly localActivities: TwentyActivity[];

  constructor(tenantId: string, creds: TwentyCreds | null) {
    this.tenantId = tenantId;
    this.creds = creds;
    this.mode = creds ? "live" : "mock";
    this.localLeads = mockLeads.map((lead) => ({ ...lead }));
    this.localActivities = mockActivities.map((activity) => ({ ...activity }));
  }

  async searchLeads(filters: Filters = {}): Promise<TwentyLead[]> {
    if (this.mode === "live") {
      return this.liveRequest<TwentyLead[]>("GET", `/rest/people${this.buildQuery(filters)}`);
    }
    return this.localLeads.filter((lead) => this.matchesFilters(lead, filters));
  }

  async getLead(id: string): Promise<TwentyLead | null> {
    if (this.mode === "live") {
      try {
        return await this.liveRequest<TwentyLead>("GET", `/rest/people/${id}`);
      } catch {
        return null;
      }
    }
    return this.localLeads.find((lead) => lead.id === id) ?? null;
  }

  async findLeadByPhone(phone: string): Promise<TwentyLead | null> {
    const normalized = normalizePhone(phone);
    if (this.mode === "live") {
      const results = await this.liveRequest<TwentyLead[]>(
        "GET",
        `/rest/people?filter=phone[eq]:${encodeURIComponent(normalized)}`,
      );
      return results[0] ?? null;
    }
    return (
      this.localLeads.find((lead) => normalizePhone(lead.phone) === normalized) ?? null
    );
  }

  async createLead(input: CreateLeadInput): Promise<TwentyLead> {
    const newLead: TwentyLead = {
      id: `LD-${Math.floor(2000 + Math.random() * 7000)}`,
      tenantId: this.tenantId,
      name: input.name,
      phone: normalizePhone(input.phone),
      email: input.email,
      channel: input.channel ?? "Website",
      source: input.source ?? "Website enquiry",
      capturedAt: new Date().toISOString(),
      responseSla: "On track",
      budget: input.budget ?? "Needs qualification",
      requirement: input.requirement ?? "Needs qualification",
      location: input.location ?? "Needs qualification",
      stage: "New",
      score: 0,
      assignedTo: "Unassigned",
      nextAction: "Route owner and start qualification",
      lastActivity: "Inbound capture",
      aiOutcome: "New",
    };
    if (this.mode === "live") {
      return this.liveRequest<TwentyLead>("POST", "/rest/people", newLead);
    }
    this.localLeads.unshift(newLead);
    return newLead;
  }

  async updateLead(id: string, patch: Partial<TwentyLead>): Promise<TwentyLead> {
    if (this.mode === "live") {
      return this.liveRequest<TwentyLead>("PATCH", `/rest/people/${id}`, patch);
    }
    const index = this.localLeads.findIndex((lead) => lead.id === id);
    if (index === -1) throw new Error(`Lead not found: ${id}`);
    this.localLeads[index] = { ...this.localLeads[index], ...patch };
    return this.localLeads[index];
  }

  async addActivity(leadId: string, input: ActivityInput): Promise<TwentyActivity> {
    const activity: TwentyActivity = {
      id: `ACT-${Date.now()}`,
      leadId,
      type: input.type,
      title: input.title,
      detail: input.detail,
      createdAt: new Date().toISOString(),
      actor: input.actor,
    };
    if (this.mode === "live") {
      return this.liveRequest<TwentyActivity>("POST", "/rest/timelineActivities", {
        happensAt: activity.createdAt,
        name: input.type,
        properties: { title: input.title, detail: input.detail, actor: input.actor },
        linkedRecordId: leadId,
      });
    }
    this.localActivities.unshift(activity);
    return activity;
  }

  async listActivities(leadId?: string): Promise<TwentyActivity[]> {
    if (this.mode === "live") {
      const path = leadId
        ? `/rest/timelineActivities?filter=linkedRecordId[eq]:${encodeURIComponent(leadId)}`
        : "/rest/timelineActivities";
      return this.liveRequest<TwentyActivity[]>("GET", path);
    }
    if (!leadId) return this.localActivities;
    return this.localActivities.filter((activity) => activity.leadId === leadId);
  }

  async listProperties(): Promise<TwentyProperty[]> {
    if (this.mode === "live") {
      return this.liveRequest<TwentyProperty[]>("GET", "/rest/properties");
    }
    return mockProperties;
  }

  private matchesFilters(lead: TwentyLead, filters: Filters): boolean {
    if (filters.stage && lead.stage.toLowerCase() !== filters.stage.toLowerCase()) {
      return false;
    }
    if (filters.query) {
      const q = filters.query.toLowerCase();
      const haystack = [
        lead.name,
        lead.phone,
        lead.email,
        lead.source,
        lead.requirement,
        lead.location,
        lead.assignedTo,
        lead.stage,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  }

  private buildQuery(filters: Filters): string {
    const params = new URLSearchParams();
    if (filters.query) params.set("q", filters.query);
    if (filters.stage) params.set("stage", filters.stage);
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  }

  private async liveRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
    if (!this.creds) throw new Error("Twenty credentials missing");
    const response = await fetch(`${this.creds.url}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.creds.apiKey}`,
        "content-type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`Twenty ${method} ${path} failed: ${response.status}`);
    }
    return (await response.json()) as T;
  }
}
