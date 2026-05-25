"use client";

import { useEffect, useState } from "react";

import { SectionShell } from "@/app/dashboard/section-shell";

type Activity = {
  id: string;
  leadId: string;
  type: string;
  title: string;
  detail: string;
  createdAt: string;
  actor: string;
};

type Decision = {
  id: string;
  tenantId: string;
  leadId?: string;
  proposedTool: string;
  proposedArgs: Record<string, unknown>;
  status: string;
  outcome?: "success" | "failure";
  createdAt: string;
};

type CombinedRow =
  | { kind: "activity"; row: Activity }
  | { kind: "decision"; row: Decision };

const STATUS_TONE: Record<string, string> = {
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  auto_approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  proposed: "bg-amber-50 text-amber-700 ring-amber-200",
  rejected: "bg-red-50 text-red-700 ring-red-200",
  executed: "bg-slate-100 text-slate-600 ring-slate-200",
};

export default function ActivityPage() {
  const [rows, setRows] = useState<CombinedRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [crm, agent] = await Promise.all([
        fetch("/api/crm", { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/agent", { cache: "no-store" }).then((r) => r.json()),
      ]);
      if (cancelled) return;
      const combined: CombinedRow[] = [
        ...(crm.activities as Activity[] | undefined ?? []).map((row) => ({
          kind: "activity" as const,
          row,
        })),
        ...(agent.recentDecisions as Decision[] | undefined ?? []).map((row) => ({
          kind: "decision" as const,
          row,
        })),
      ];
      combined.sort((a, b) => {
        const t = (x: CombinedRow) =>
          x.kind === "activity" ? Date.parse(x.row.createdAt) || 0 : Date.parse(x.row.createdAt) || 0;
        return t(b) - t(a);
      });
      setRows(combined);
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SectionShell
      eyebrow="Activity"
      title="Activity timeline"
      subtitle="Every CRM activity and every agent decision in this workspace. The AI's reasoning shows alongside human actions so nothing is hidden."
    >
      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-slate-500">Nothing yet. Use the chat to take an action.</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((entry) =>
            entry.kind === "activity" ? (
              <ActivityRow key={`a-${entry.row.id}`} activity={entry.row} />
            ) : (
              <DecisionRow key={`d-${entry.row.id}`} decision={entry.row} />
            ),
          )}
        </ul>
      )}
    </SectionShell>
  );
}

function ActivityRow({ activity }: { activity: Activity }) {
  return (
    <li className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold text-slate-800">{activity.title}</p>
        <span className="shrink-0 text-xs text-slate-500">{activity.createdAt}</span>
      </div>
      <p className="mt-1 text-xs leading-5 text-slate-600">{activity.detail}</p>
      <p className="mt-2 text-[11px] uppercase tracking-wider text-slate-400">
        {activity.type} · {activity.actor} · {activity.leadId}
      </p>
    </li>
  );
}

function DecisionRow({ decision }: { decision: Decision }) {
  const tone =
    STATUS_TONE[decision.status] ?? "bg-slate-100 text-slate-600 ring-slate-200";
  const outcome = decision.outcome === "failure" ? "failed" : decision.outcome;
  return (
    <li className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold text-slate-800">
          Agent decision: {decision.proposedTool}
        </p>
        <span className="shrink-0 text-xs text-slate-500">
          {new Date(decision.createdAt).toLocaleString()}
        </span>
      </div>
      <p className="mt-1 truncate text-xs text-slate-600">
        args: <code className="text-slate-700">{JSON.stringify(decision.proposedArgs)}</code>
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ${tone}`}>
          {decision.status.replace("_", " ")}
        </span>
        {outcome ? (
          <span className="text-[11px] uppercase tracking-wider text-slate-400">outcome: {outcome}</span>
        ) : null}
        {decision.leadId ? (
          <span className="text-[11px] uppercase tracking-wider text-slate-400">{decision.leadId}</span>
        ) : null}
      </div>
    </li>
  );
}
