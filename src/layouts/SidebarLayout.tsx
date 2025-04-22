
import React from 'react';
import Sidebar from "@/components/Layout/Sidebar";

const SidebarLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-screen w-full">
      <aside className="hidden md:block">
        <Sidebar />
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
};

export default SidebarLayout;
