
import React from 'react';
import Sidebar from "@/components/Layout/Sidebar";

const SidebarLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex min-h-screen w-full">
      <aside className="w-56 shrink-0 border-r bg-white lg:block">
        <Sidebar open={false} onClose={() => {}} />
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
};

export default SidebarLayout;
