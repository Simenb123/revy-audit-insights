
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
      <SidebarHeader 
        className={`flex items-center gap-2 px-4 py-2 h-16 border-b border-sidebar-border bg-card ${isCollapsed ? 'justify-center' : 'justify-between'}`}
        style={{
          background: 'hsl(var(--card))',
          minHeight: '4rem',
          height: '4rem',
        }}
      >
        {!isCollapsed && (
          <span className="font-semibold text-sidebar-foreground text-base">
            Menu
          </span>
        )}
        <SidebarTrigger
          className="h-8 w-8"
          aria-label={isCollapsed ? "Utvid sidebar" : "Skjul sidebar"}
        />
      </SidebarHeader>
      <SidebarContent className="flex-1 p-0">
        <SidebarNav collapsed={isCollapsed} />
      </SidebarContent>
    </ShadcnSidebar>
  );
};

export default Sidebar;
