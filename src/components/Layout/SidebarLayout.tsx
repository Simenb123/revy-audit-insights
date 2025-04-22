import React from 'react';
import Sidebar from "@/components/Layout/Sidebar";

const SidebarLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-screen">
      {/* fast header er 64 px ⇒ top‑16 */}
      <aside className="sticky top-16 w-64 shrink-0 border-r bg-white">
        <Sidebar />
      </aside>
      {/* innhold starter også 64 px ned */}
      <main className="flex-1 overflow-y-auto px-6">{children}</main>
    </div>
  );
};

export default SidebarLayout;
