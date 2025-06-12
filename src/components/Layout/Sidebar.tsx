
import React from 'react';
import { 
  Sidebar as SidebarContainer, 
  SidebarContent, 
  SidebarHeader, 
  useSidebar
} from '@/components/ui/sidebar';
import SidebarNav from './SidebarNav';

const Sidebar = () => {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  
  return (
    <SidebarContainer>
      <SidebarHeader className="border-b border-border p-2">
        <div className="flex items-center justify-center w-full">
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
