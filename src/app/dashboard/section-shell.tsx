"use client";

import Link from "next/link";
import { type ReactNode } from "react";

import { useWorkspace } from "@/app/dashboard/workspace-context";

type StatusTone = "live" | "off" | "neutral";

export function SectionShell({
  eyebrow,
  title,
  subtitle,
  status,
  statusTone = "neutral",
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  status?: string;
  statusTone?: StatusTone;
  children: ReactNode;
}) {
  const { tenantId } = useWorkspace();
  const statusClass =
    statusTone === "live"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : statusTone === "off"
        ? "bg-slate-100 text-slate-500 ring-slate-200"
        : "bg-amber-50 text-amber-700 ring-amber-200";

  return (
    <>
      <header className="flex items-center justify-between border-b border-slate-200/60 bg-white/40 px-6 py-4">
        <div>
          <p className="text-xs font-medium text-slate-500">{tenantId || "—"}</p>
          <p className="text-sm font-semibold tracking-tight">{title}</p>
        </div>
        <div className="flex items-center gap-3">
          {status ? (
            <span className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ${statusClass}`}>
              {status}
            </span>
          ) : null}
          <Link href="/dashboard" className="text-sm font-medium text-slate-600 transition hover:text-[#111827]">
            Chat
          </Link>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-6 py-10">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#b88a2d]">{eyebrow}</p>
          {subtitle ? (
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">{subtitle}</p>
          ) : null}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </>
  );
}

export function EmptyConnect({
  message,
  ctaLabel = "Connect in onboarding",
  href = "/onboarding",
}: {
  message: string;
  ctaLabel?: string;
  href?: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
      <p className="text-sm text-slate-600">{message}</p>
      <Link
        href={href}
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#111827] px-5 py-2 text-sm font-semibold text-white"
      >
        {ctaLabel}
        <span aria-hidden>→</span>
      </Link>
    </div>
  );
}
