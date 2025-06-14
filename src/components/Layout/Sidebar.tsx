
import React from 'react';
import { 
  Sidebar as SidebarContainer, 
  SidebarContent, 
  useSidebar
} from '@/components/ui/sidebar';
import SidebarNav from './SidebarNav';
import { ChevronsLeft, ChevronsRight } from "lucide-react";

const Sidebar = () => {
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <SidebarContainer
      className={`
        h-full flex flex-col transition-all duration-300
        shadow-lg border-r border-sidebar-border bg-sidebar z-20
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
      {/* Custom header at top */}
      <div
        className="flex items-center justify-between p-4 h-16 border-b border-sidebar-border bg-card"
        style={{
          background: 'hsl(var(--card))',
          minHeight: '4rem',
          height: '4rem',
        }}
      >
        {/* Collapse/Expand button ALWAYS visible left (so it's NOT overlapping/outside sidebar) */}
        <button
          onClick={toggleSidebar}
          className={`
            flex h-10 w-10 items-center justify-center
            rounded-full border border-gray-300 shadow-xl
            bg-white text-sidebar-primary
            transition-colors transition-shadow duration-200
            hover:bg-sidebar-primary hover:text-sidebar-foreground
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
            z-50 ml-1
          `}
          aria-label={isCollapsed ? "Utvid sidebar" : "Skjul sidebar"}
          type="button"
          tabIndex={0}
          style={{
            borderWidth: 2,
            borderColor: 'hsl(var(--sidebar-border))',
          }}
        >
          {isCollapsed
            ? <ChevronsRight size={22} strokeWidth={2.2} />
            : <ChevronsLeft size={22} strokeWidth={2.2} />
          }
        </button>
        {!isCollapsed && (
          <span className="font-semibold text-sidebar-foreground text-base ml-2">
            Menu
          </span>
        )}
      </div>
      <SidebarContent className="flex-1 p-0">
        <SidebarNav collapsed={isCollapsed} />
      </SidebarContent>
    </SidebarContainer>
  );
};

export default Sidebar;
