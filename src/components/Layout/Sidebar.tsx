
import React from 'react';
import { 
  Sidebar as SidebarContainer, 
  SidebarContent, 
  SidebarHeader, 
  SidebarTrigger,
  useSidebar
} from '@/components/ui/sidebar';
import SidebarNav from './SidebarNav';
import { ChevronsLeft, ChevronsRight } from "lucide-react";

const Sidebar = () => {
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <SidebarContainer className="h-full flex flex-col">
      <SidebarHeader className="border-b border-border p-2">
        <div className="flex items-center w-full">
          {/* Denne Triggeren er hovedmeny-ikonet øverst */}
          <SidebarTrigger className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent flex-shrink-0" />
          {!isCollapsed && (
            <span className="font-semibold text-sidebar-foreground ml-2">Menu</span>
          )}
        </div>
      </SidebarHeader>
      
      <SidebarContent className="flex-1">
        <SidebarNav />
      </SidebarContent>

      {/* Expand/collapse-knapp nederst i sidebaren */}
      <button
        onClick={toggleSidebar}
        className="m-2 flex items-center justify-center gap-1 rounded-md p-2 text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        type="button"
      >
        {isCollapsed ? <ChevronsRight size={20} /> : <ChevronsLeft size={20} />}
        <span className={isCollapsed ? "sr-only" : "text-sm"}>{isCollapsed ? '' : 'Skjul meny'}</span>
      </button>
    </SidebarContainer>
  );
};

export default Sidebar;

