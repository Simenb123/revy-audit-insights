
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
      className={`fixed top-16 left-0 h-[calc(100vh-4rem)] flex flex-col transition-all duration-300
        shadow-lg border-r border-sidebar-border bg-sidebar z-40
        ${isCollapsed ? 'w-[var(--sidebar-width-icon)] min-w-0' : 'w-[var(--sidebar-width)]'}
      `}
      style={
        isCollapsed
          ? {
              width: 'var(--sidebar-width-icon)',
              minWidth: 0,
            }
          : {
              width: 'var(--sidebar-width)',
              minWidth: 'var(--sidebar-width-icon)',
            }
      }
      data-collapsed={isCollapsed}
    >
      <SidebarHeader
        className="flex items-center justify-between p-4 h-16 border-b border-sidebar-border bg-card"
        style={{
          background: 'hsl(var(--card))'
        }}
      >
        {!isCollapsed && (
          <span className="font-semibold text-sidebar-foreground text-base">
            Menu
          </span>
        )}
        {/* Collapse/Expand button */}
        <button
          onClick={toggleSidebar}
          className="
            flex h-8 w-8 items-center justify-center z-50
            rounded-md border border-gray-400
            bg-sidebar-primary text-sidebar-foreground
            shadow-lg ring-2 ring-primary
            hover:bg-sidebar-accent
            hover:text-sidebar-foreground
            transition-colors
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
          "
          aria-label={isCollapsed ? "Utvid sidebar" : "Skjul sidebar"}
          type="button"
        >
          {isCollapsed 
            ? <ChevronsRight size={20} />
            : <ChevronsLeft size={20} />
          }
        </button>
      </SidebarHeader>

      <SidebarContent className="flex-1 p-0">
        <SidebarNav collapsed={isCollapsed} />
      </SidebarContent>
    </SidebarContainer>
  );
};

export default Sidebar;

