
import React from 'react';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import Sidebar from "@/components/Layout/Sidebar";

const SidebarLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <aside className="w-56 shrink-0 border-r bg-white lg:block">
          <Sidebar />
        </aside>
        <SidebarInset>
          <main className="flex-1 p-6">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default SidebarLayout;
