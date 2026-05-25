"use client";

import { useEffect, useState } from "react";

import { EmptyConnect, SectionShell } from "@/app/dashboard/section-shell";
import { useWorkspace } from "@/app/dashboard/workspace-context";

type Activity = {
  id: string;
  leadId: string;
  type: string;
  title: string;
  detail: string;
  createdAt: string;
  actor: string;
};

export default function VoicePage() {
  const { connectivity, externalLinks } = useWorkspace();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/crm", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const all = (data.activities as Activity[] | undefined) ?? [];
        setActivities(
          all.filter(
            (activity) =>
              /call/i.test(activity.type) || /call/i.test(activity.title) || activity.actor === "AI Voice",
          ),
        );
        setLoading(false);
      })
      .catch(() => setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const live = connectivity?.dograh === "live";

  return (
    <SectionShell
      eyebrow="Voice agent"
      title="Voice qualification calls"
      subtitle="Outbound qualification calls in Hindi or English. Transcripts, dispositions, and retries write back to the CRM."
      status={live ? "Connected" : "Not connected"}
      statusTone={live ? "live" : "off"}
    >
      {!live ? (
        <EmptyConnect message="Add a telephony provider (Twilio, Plivo, Telnyx, Vonage) and a Dograh deployment to start placing AI qualification calls." />
      ) : externalLinks?.dograh ? (
        <a
          href={externalLinks.dograh}
          target="_blank"
          rel="noreferrer"
          className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#111827] px-4 py-2 text-sm font-semibold text-white"
        >
          Open Dograh console
          <span aria-hidden>↗</span>
        </a>
      ) : null}

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-slate-700">Recent call activity</h3>
        {loading ? (
          <p className="mt-2 text-sm text-slate-400">Loading…</p>
        ) : activities.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">
            No calls yet. Ask the agent to place a qualification call from the chat.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {activities.map((activity) => (
              <li key={activity.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-800">{activity.title}</p>
                  <span className="shrink-0 text-xs text-slate-500">{activity.createdAt}</span>
                </div>
                <p className="mt-1 text-xs leading-5 text-slate-600">{activity.detail}</p>
                <p className="mt-2 text-[11px] uppercase tracking-wider text-slate-400">
                  {activity.actor} · {activity.leadId}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </SectionShell>
  );
}
