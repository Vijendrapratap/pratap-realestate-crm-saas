export type AgentDecisionStatus =
  | "proposed"
  | "auto_approved"
  | "approved"
  | "rejected"
  | "executed";

export type AgentDecision = {
  id: string;
  tenantId: string;
  leadId?: string;
  prompt: string;
  proposedTool: string;
  proposedArgs: Record<string, unknown>;
  status: AgentDecisionStatus;
  approvedBy?: string;
  approvedAt?: string;
  executedAt?: string;
  outcome?: "success" | "failure";
  error?: string;
  editedBeforeApproval?: Record<string, unknown>;
  createdAt: string;
};

const decisions: AgentDecision[] = [];

export function recordDecision(input: Omit<AgentDecision, "id" | "createdAt">): AgentDecision {
  const decision: AgentDecision = {
    id: `DEC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    createdAt: new Date().toISOString(),
    ...input,
  };
  decisions.unshift(decision);
  return decision;
}

export function listDecisions(tenantId: string, limit = 50): AgentDecision[] {
  return decisions.filter((d) => d.tenantId === tenantId).slice(0, limit);
}

export function getDecision(id: string): AgentDecision | null {
  return decisions.find((d) => d.id === id) ?? null;
}

export function updateDecision(
  id: string,
  patch: Partial<AgentDecision>,
): AgentDecision | null {
  const index = decisions.findIndex((d) => d.id === id);
  if (index === -1) return null;
  decisions[index] = { ...decisions[index], ...patch };
  return decisions[index];
}

/**
 * Compute per-tenant signals from historical decisions. This is the
 * "learns over time" feedback loop, in deterministic form: aggregate
 * counts that the agent reads at call time. A weekly batch job can
 * replace this with smarter weighting later.
 */
export function computeTenantSignals(tenantId: string) {
  const tenantDecisions = decisions.filter((d) => d.tenantId === tenantId);
  const byTool = new Map<string, { proposed: number; approved: number; rejected: number }>();

  for (const decision of tenantDecisions) {
    const bucket = byTool.get(decision.proposedTool) ?? {
      proposed: 0,
      approved: 0,
      rejected: 0,
    };
    bucket.proposed += 1;
    if (decision.status === "approved" || decision.status === "auto_approved") bucket.approved += 1;
    if (decision.status === "rejected") bucket.rejected += 1;
    byTool.set(decision.proposedTool, bucket);
  }

  return {
    totalDecisions: tenantDecisions.length,
    perTool: Object.fromEntries(byTool),
  };
}
