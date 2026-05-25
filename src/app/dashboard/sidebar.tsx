"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";

import { useWorkspace } from "@/app/dashboard/workspace-context";

const stageTone: Record<string, string> = {
  Hot: "bg-red-500",
  Warm: "bg-amber-400",
  Cold: "bg-slate-300",
  New: "bg-emerald-500",
  Contacted: "bg-blue-400",
  Negotiation: "bg-violet-500",
  "Closed Won": "bg-emerald-700",
  "Closed Lost": "bg-slate-400",
};

type NavItem = {
  href?: string;
  external?: string | null;
  label: string;
  icon: ReactNode;
  disabledHint?: string;
};

function CrmIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <rect x="3" y="4" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3 8h14" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
function ChatIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path
        d="M4 5h12a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H8l-4 3V7a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function ActivityIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path d="M3 10h3l2-6 4 12 2-6h3" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}
function WhatsappIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path
        d="M3.5 16.5l1-3.5a6 6 0 1 1 2.5 2.5l-3.5 1Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function PhoneIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path
        d="M5 4h3l1.5 3.5L8 9a8 8 0 0 0 3 3l1.5-1.5L16 12v3a2 2 0 0 1-2 2A11 11 0 0 1 3 6a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function ExternalIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="ml-auto h-3 w-3 opacity-50">
      <path d="M8 5h7v7M15 5L8 12M5 8v7h7" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { leads, loading, selectedLeadId, setSelectedLeadId, connectivity } = useWorkspace();

  const nav: NavItem[] = [
    { href: "/dashboard", label: "Chat", icon: <ChatIcon /> },
    { href: "/dashboard/crm", label: "CRM", icon: <CrmIcon /> },
    { href: "/dashboard/activity", label: "Activity", icon: <ActivityIcon /> },
    {
      href: "/dashboard/whatsapp",
      label: "WhatsApp",
      icon: <WhatsappIcon />,
      disabledHint: connectivity?.whatsapp === "mock" ? "Not connected" : undefined,
    },
    {
      href: "/dashboard/voice",
      label: "Voice agent",
      icon: <PhoneIcon />,
      disabledHint: connectivity?.dograh === "mock" ? "Not connected" : undefined,
    },
  ];

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-slate-200/80 bg-white/60 sm:w-64">
      <Link href="/" className="flex items-center gap-2.5 px-5 py-5">
        <div className="grid h-8 w-8 place-items-center rounded-full bg-[#111827] text-xs font-semibold text-white">
          P
        </div>
        <span className="text-sm font-semibold tracking-tight">Pratap AI</span>
      </Link>

      <nav className="flex flex-col gap-0.5 px-2 pb-3">
        {nav.map((item) => {
          const active = item.href ? pathname === item.href : false;
          const className = `flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition ${
            active
              ? "bg-[#111827] text-white"
              : item.disabledHint
                ? "text-slate-400 hover:bg-white"
                : "text-slate-700 hover:bg-white"
          }`;
          if (item.external) {
            return (
              <a
                key={item.label}
                href={item.external}
                target="_blank"
                rel="noreferrer"
                className={className}
              >
                <span className="grid h-4 w-4 place-items-center">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                <ExternalIcon />
              </a>
            );
          }
          return (
            <Link
              key={item.label}
              href={item.href ?? "#"}
              className={className}
              title={item.disabledHint ?? undefined}
            >
              <span className="grid h-4 w-4 place-items-center">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.disabledHint ? (
                <span className="text-[10px] uppercase tracking-wider text-slate-400">off</span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center justify-between border-t border-slate-200/60 px-5 pb-2 pt-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Leads</p>
        <span className="text-xs text-slate-400">{leads.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {loading && leads.length === 0 ? (
          <p className="px-3 py-2 text-xs text-slate-400">Loading…</p>
        ) : (
          leads.map((lead) => {
            const active = lead.id === selectedLeadId;
            return (
              <button
                key={lead.id}
                onClick={() => setSelectedLeadId(active ? null : lead.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                  active ? "bg-[#111827] text-white" : "text-slate-700 hover:bg-white"
                }`}
              >
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${stageTone[lead.stage] ?? "bg-slate-300"}`}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{lead.name}</div>
                  <div className={`truncate text-xs ${active ? "text-white/60" : "text-slate-500"}`}>
                    {lead.location}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}
