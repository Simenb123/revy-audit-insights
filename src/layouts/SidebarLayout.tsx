
import React from 'react';
import Sidebar from "@/components/Layout/Sidebar";

const SidebarLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex min-h-screen w-full">
      <aside className="hidden md:block w-56 border-r sticky top-0 h-screen bg-white">
        <Sidebar />
      </aside>
      <main className="flex-1 min-w-0 px-6 py-8">{children}</main>
    </div>
  );
};

export default SidebarLayout;
