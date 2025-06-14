
import React from 'react';
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarHeader,
  useSidebar,
  SidebarTrigger
} from '@/components/ui/sidebar';
import SidebarNav from './SidebarNav';

const Sidebar = () => {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <ShadcnSidebar
      className={`
        h-full flex flex-col transition-all duration-300
        shadow-lg border-r border-sidebar-border bg-sidebar z-20
        ${isCollapsed ? 'w-[var(--sidebar-width-icon)] min-w-0' : 'w-[var(--sidebar-width)]'}
      `}
      style={
        isCollapsed
          ? { width: 'var(--sidebar-width-icon)', minWidth: 0 }
          : { width: 'var(--sidebar-width)', minWidth: 'var(--sidebar-width-icon)' }
      }
      data-collapsed={isCollapsed}
    >
      <SidebarHeader className="flex items-center gap-2 px-4 py-2 h-16 border-b border-sidebar-border bg-card"
        style={{
          background: 'hsl(var(--card))',
          minHeight: '4rem',
          height: '4rem',
        }}
      >
        {/* Collapse/Expand knapp med forbedret synlighet og posisjonering */}
        <SidebarTrigger
          className="
            h-9 w-9 border border-border bg-background/90 backdrop-blur-sm
            hover:bg-accent hover:text-accent-foreground
            transition-all duration-200 shadow-md
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
            flex-shrink-0
          "
          aria-label={isCollapsed ? "Utvid sidebar" : "Skjul sidebar"}
        />
        {!isCollapsed && (
          <span className="font-semibold text-sidebar-foreground text-base ml-2">
            Menu
          </span>
        )}
      </SidebarHeader>
      <SidebarContent className="flex-1 p-0">
        <SidebarNav collapsed={isCollapsed} />
      </SidebarContent>
    </ShadcnSidebar>
  );
};

export default Sidebar;
