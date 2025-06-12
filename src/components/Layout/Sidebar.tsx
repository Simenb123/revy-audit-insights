
import React from 'react';
import { 
  Sidebar as SidebarContainer, 
  SidebarContent, 
  SidebarHeader, 
  SidebarTrigger,
  useSidebar
} from '@/components/ui/sidebar';
import SidebarNav from './SidebarNav';

const Sidebar = () => {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  
  return (
    <SidebarContainer className="top-16 h-[calc(100vh-64px)]">
      <SidebarHeader className="border-b border-border p-2">
        <div className="flex items-center gap-2 w-full">
          <SidebarTrigger className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent" />
          {!isCollapsed && (
            <span className="font-semibold text-sidebar-foreground">Menu</span>
          )}
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarNav />
      </SidebarContent>
    </SidebarContainer>
  );
};

export default Sidebar;
