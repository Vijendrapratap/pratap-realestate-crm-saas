"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type WorkspaceLead = {
  id: string;
  name: string;
  phone: string;
  stage: string;
  source: string;
  requirement: string;
  location: string;
  assignedTo: string;
  nextAction: string;
  score: number;
};

export type Connectivity = {
  twenty: "live" | "mock";
  whatsapp: "live" | "mock";
  dograh: "live" | "mock";
  ai: "live" | "deterministic";
};

export type ExternalLinks = {
  twenty: string | null;
  wacrm: string | null;
  dograh: string | null;
};

export type Workspace = {
  tenantId: string;
  leads: WorkspaceLead[];
  loading: boolean;
  connectivity: Connectivity | null;
  externalLinks: ExternalLinks | null;
  selectedLeadId: string | null;
  setSelectedLeadId: (id: string | null) => void;
  refresh: () => Promise<void>;
};

const WorkspaceContext = createContext<Workspace | null>(null);

export function useWorkspace(): Workspace {
  const value = useContext(WorkspaceContext);
  if (!value) throw new Error("useWorkspace must be used inside <WorkspaceProvider>");
  return value;
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [tenantId, setTenantId] = useState("");
  const [leads, setLeads] = useState<WorkspaceLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectivity, setConnectivity] = useState<Connectivity | null>(null);
  const [externalLinks, setExternalLinks] = useState<ExternalLinks | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/crm", { cache: "no-store" });
      const data = await response.json();
      setLeads(data.leads ?? []);
      setTenantId(data.tenantId ?? "");
      setConnectivity(data.connectivity ?? null);
      setExternalLinks(data.externalLinks ?? null);
    } catch {
      // best-effort load; UI shows empty state if backend is down
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial workspace load on mount; subsequent calls are via the refresh()
    // returned from this context.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  const value = useMemo<Workspace>(
    () => ({
      tenantId,
      leads,
      loading,
      connectivity,
      externalLinks,
      selectedLeadId,
      setSelectedLeadId,
      refresh,
    }),
    [tenantId, leads, loading, connectivity, externalLinks, selectedLeadId, refresh],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}
