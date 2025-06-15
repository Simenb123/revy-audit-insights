
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
      collapsible="icon"
      className={`
        flex flex-col transition-all duration-300
        shadow-lg border-r border-sidebar-border bg-sidebar z-20
        ${isCollapsed ? 'w-[var(--sidebar-width-icon)] min-w-0' : 'w-[var(--sidebar-width)]'}
      `}
      style={{
        top: '4rem',
        height: 'calc(100vh - 4rem)',
        ...(isCollapsed
          ? { width: 'var(--sidebar-width-icon)', minWidth: 0 }
          : { width: 'var(--sidebar-width)', minWidth: 'var(--sidebar-width-icon)' }),
      }}
      data-collapsed={isCollapsed}
    >
      <SidebarHeader 
        className={`flex flex-row items-center px-4 h-14 border-b border-sidebar-border ${isCollapsed ? 'justify-center' : 'justify-between'}`}
      >
        <SidebarTrigger
          className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent"
          aria-label={isCollapsed ? "Utvid sidebar" : "Skjul sidebar"}
        />
        {!isCollapsed && (
          <span className="font-semibold text-sidebar-foreground text-base">
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
