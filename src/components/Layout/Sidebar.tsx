
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
        z-40
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
      <SidebarHeader className="relative border-b border-border px-2 h-14 flex items-center">
        {/* MENU LABEL – only when expanded */}
        {!isCollapsed && (
          <span className="font-semibold text-sidebar-foreground ml-2">
            Menu
          </span>
        )}
        {/* Collapse/Expand button (always rendered, always visible, at top right of SIDEBAR-header, not "over" main app header) */}
        <button
          onClick={toggleSidebar}
          className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-md text-sidebar-foreground hover:bg-sidebar-accent transition-colors z-50"
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
