import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { Topbar } from "./Topbar";

export function AppLayout({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="h-screen flex bg-background overflow-hidden">
      {/* Sidebar — fixed full height, does not scroll with content */}
      <div className="hidden lg:flex h-full shrink-0">
        <AppSidebar />
      </div>
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Topbar — pinned at top of content column */}
        <Topbar title={title} />
        {/* Only the main content area scrolls */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden px-4 lg:px-6 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
