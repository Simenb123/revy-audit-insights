
import React from 'react';
import { 
  Sidebar as SidebarContainer, 
  SidebarContent, 
  SidebarHeader, 
  useSidebar
} from '@/components/ui/sidebar';
import SidebarNav from './SidebarNav';
import { ChevronsLeft, ChevronsRight } from "lucide-react";

const Sidebar = () => {
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <SidebarContainer
      className={`h-full flex flex-col transition-all duration-300
        ${isCollapsed ? 'w-[var(--sidebar-width-icon)] min-w-0' : 'w-[var(--sidebar-width)]'}
      `}
      style={
        isCollapsed
          ? {
              width: 'var(--sidebar-width-icon)',
              minWidth: 0
            }
          : {
              width: 'var(--sidebar-width)',
              minWidth: 'var(--sidebar-width-icon)'
            }
      }
      data-collapsed={isCollapsed}
    >
      <SidebarHeader className="border-b border-border p-2 flex items-center justify-between">
        <div className="flex items-center w-full">
          {/* Main menu icon (aligned left always) */}
          {/* Removed SidebarTrigger as it's redundant */}
          {!isCollapsed && (
            <span className="font-semibold text-sidebar-foreground ml-2">Menu</span>
          )}
        </div>
        {/* Collapse/Expand button (always rendered in header, top right) */}
        <button
          onClick={toggleSidebar}
          className="ml-auto flex h-8 w-8 items-center justify-center rounded-md text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          type="button"
        >
          {isCollapsed ? <ChevronsRight size={20} /> : <ChevronsLeft size={20} />}
        </button>
      </SidebarHeader>
      
      <SidebarContent className="flex-1 p-0">
        <SidebarNav collapsed={isCollapsed} />
      </SidebarContent>
    </SidebarContainer>
  );
};

export default Sidebar;
