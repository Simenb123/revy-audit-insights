
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
    <SidebarContainer className="h-full">
      <SidebarHeader className="border-b border-border p-2">
        <div className="flex items-center w-full">
          <SidebarTrigger className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent flex-shrink-0" />
          {!isCollapsed && (
            <span className="font-semibold text-sidebar-foreground ml-2">Menu</span>
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
