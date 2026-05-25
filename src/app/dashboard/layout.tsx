import { type ReactNode } from "react";

import { Sidebar } from "@/app/dashboard/sidebar";
import { WorkspaceProvider } from "@/app/dashboard/workspace-context";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <WorkspaceProvider>
      <main className="flex h-screen bg-[#f7f4ee] text-[#111827]">
        <Sidebar />
        <section className="flex flex-1 flex-col">{children}</section>
      </main>
    </WorkspaceProvider>
  );
}
