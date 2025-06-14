
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
        className="flex items-center justify-between p-4 h-16 border-b border-sidebar-border bg-card" // endret til bg-card for kontrast
        style={{
          background: 'hsl(var(--card))', // ekstra sikkerhet for kontrast
        }}
      >
        {/* MENU LABEL – only when expanded */}
        {!isCollapsed && (
          <span className="font-semibold text-sidebar-foreground text-base">
            Menu
          </span>
        )}
        {/* Collapse/Expand button */}
        <button
          onClick={toggleSidebar}
          className="
            flex h-8 w-8 items-center justify-center 
            rounded-md border border-sidebar-border 
            bg-white text-sidebar-foreground
            shadow
            hover:bg-sidebar-primary
            hover:text-sidebar-foreground
            transition-colors
            focus-visible:outline-2 focus-visible:outline focus-visible:outline-primary
          "
          style={{
            boxShadow: "0 0 2px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.02)",
          }}
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

