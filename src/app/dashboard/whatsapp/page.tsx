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

export default function WhatsappPage() {
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
          all.filter((activity) => /whatsapp/i.test(activity.type) || /whatsapp/i.test(activity.title)),
        );
        setLoading(false);
      })
      .catch(() => setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const live = connectivity?.whatsapp === "live";

  return (
    <SectionShell
      eyebrow="WhatsApp"
      title="WhatsApp"
      subtitle="Approved templates, inbound replies, and outbound drafts. Every message becomes a lead activity in the CRM."
      status={live ? "Connected" : "Not connected"}
      statusTone={live ? "live" : "off"}
    >
      {!live ? (
        <EmptyConnect message="Connect your Meta WhatsApp Business credentials to start sending and receiving messages." />
      ) : externalLinks?.wacrm ? (
        <a
          href={externalLinks.wacrm}
          target="_blank"
          rel="noreferrer"
          className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#111827] px-4 py-2 text-sm font-semibold text-white"
        >
          Open wacrm inbox
          <span aria-hidden>↗</span>
        </a>
      ) : null}

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-slate-700">Recent WhatsApp activity</h3>
        {loading ? (
          <p className="mt-2 text-sm text-slate-400">Loading…</p>
        ) : activities.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">
            No WhatsApp activity yet. Once a customer messages your business number, it appears here.
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
