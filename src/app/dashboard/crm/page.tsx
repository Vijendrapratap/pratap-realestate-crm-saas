"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { SectionShell } from "@/app/dashboard/section-shell";
import { useWorkspace } from "@/app/dashboard/workspace-context";

type PipelineStage = {
  stage: string;
  count: number;
  value: string;
  leakageRisk: string;
};

type Property = {
  id: string;
  title: string;
  type: string;
  location: string;
  price: string;
  size: string;
  status: "Available" | "Reserved" | "Sold";
  fit: number;
  matchReason: string;
};

type Summary = {
  totalLeads: number;
  inboundQueue: number;
  openActivities: number;
  availableProperties: number;
  pendingApprovals: number;
};

const STAGE_TONE: Record<string, string> = {
  Hot: "bg-red-500",
  Warm: "bg-amber-400",
  Cold: "bg-slate-300",
  New: "bg-emerald-500",
  Contacted: "bg-blue-400",
  Negotiation: "bg-violet-500",
  "Closed Won": "bg-emerald-700",
  "Closed Lost": "bg-slate-400",
};

const STAGE_TEXT_TONE: Record<string, string> = {
  Hot: "text-red-700 bg-red-50 ring-red-200",
  Warm: "text-amber-700 bg-amber-50 ring-amber-200",
  Cold: "text-slate-600 bg-slate-100 ring-slate-200",
  New: "text-emerald-700 bg-emerald-50 ring-emerald-200",
  Contacted: "text-blue-700 bg-blue-50 ring-blue-200",
  Negotiation: "text-violet-700 bg-violet-50 ring-violet-200",
  "Closed Won": "text-emerald-800 bg-emerald-100 ring-emerald-300",
  "Closed Lost": "text-slate-600 bg-slate-100 ring-slate-200",
};

export default function CrmPage() {
  const router = useRouter();
  const { connectivity, externalLinks, leads: workspaceLeads, setSelectedLeadId } = useWorkspace();
  const [pipeline, setPipeline] = useState<PipelineStage[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/crm", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setPipeline(data.pipeline ?? []);
        setProperties(data.properties ?? []);
        setSummary(data.summary ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const live = connectivity?.twenty === "live";

  function focusLead(id: string) {
    setSelectedLeadId(id);
    router.push("/dashboard");
  }

  return (
    <SectionShell
      eyebrow="CRM"
      title="CRM dashboard"
      subtitle="Pipeline, leads, and inventory in one view. Twenty is the source of truth — when connected, every change here syncs back."
      status={live ? "Twenty connected" : "Mock data"}
      statusTone={live ? "live" : "neutral"}
    >
      {externalLinks?.twenty ? (
        <a
          href={externalLinks.twenty}
          target="_blank"
          rel="noreferrer"
          className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#111827] px-4 py-2 text-sm font-semibold text-white"
        >
          Open in Twenty
          <span aria-hidden>↗</span>
        </a>
      ) : null}

      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : (
        <>
          {summary ? (
            <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Total leads" value={summary.totalLeads} />
              <Stat label="Inbound queue" value={summary.inboundQueue} />
              <Stat label="Properties available" value={summary.availableProperties} />
              <Stat label="Pending approvals" value={summary.pendingApprovals} />
            </div>
          ) : null}

          <section>
            <h3 className="text-sm font-semibold text-slate-700">Pipeline</h3>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-4">
              {pipeline.map((stageItem) => (
                <div
                  key={stageItem.stage}
                  className="rounded-2xl border border-slate-200 bg-white p-3"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${STAGE_TONE[stageItem.stage] ?? "bg-slate-300"}`}
                      aria-hidden
                    />
                    <p className="text-xs font-semibold text-slate-700">{stageItem.stage}</p>
                  </div>
                  <p className="mt-2 text-2xl font-semibold tracking-[-0.02em]">{stageItem.count}</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">{stageItem.value}</p>
                  <p className="mt-1 text-[11px] text-slate-400">{stageItem.leakageRisk}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-8">
            <h3 className="text-sm font-semibold text-slate-700">Leads</h3>
            <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-2.5 text-left">Lead</th>
                    <th className="px-4 py-2.5 text-left">Stage</th>
                    <th className="hidden px-4 py-2.5 text-left md:table-cell">Owner</th>
                    <th className="hidden px-4 py-2.5 text-left lg:table-cell">Next action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {workspaceLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      onClick={() => focusLead(lead.id)}
                      className="cursor-pointer transition hover:bg-slate-50"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">{lead.name}</p>
                        <p className="text-xs text-slate-500">
                          {lead.requirement} · {lead.location}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ${
                            STAGE_TEXT_TONE[lead.stage] ?? "bg-slate-100 text-slate-600 ring-slate-200"
                          }`}
                        >
                          {lead.stage}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3 text-slate-600 md:table-cell">{lead.assignedTo}</td>
                      <td className="hidden px-4 py-3 text-xs text-slate-500 lg:table-cell">
                        {lead.nextAction}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-8">
            <h3 className="text-sm font-semibold text-slate-700">Inventory</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {properties.map((property) => (
                <div key={property.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-800">{property.title}</p>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${
                        property.status === "Available"
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                          : property.status === "Reserved"
                            ? "bg-amber-50 text-amber-700 ring-amber-200"
                            : "bg-slate-100 text-slate-500 ring-slate-200"
                      }`}
                    >
                      {property.status}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    {property.location} · {property.size}
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-700">{property.price}</p>
                  <p className="mt-2 text-[11px] leading-5 text-slate-500">{property.matchReason}</p>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </SectionShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-[-0.02em]">{value}</p>
    </div>
  );
}
