
import React from 'react';
import { 
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarHeader
} from "@/components/ui/sidebar";
import SidebarNav from "./SidebarNav";

export default function Sidebar() {
  return (
    <ShadcnSidebar>
      <SidebarHeader>
        <div className="p-4">
          <h2 className="text-lg font-semibold">Revio</h2>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarNav />
      </SidebarContent>
    </ShadcnSidebar>
  );
}
