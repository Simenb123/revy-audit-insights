
import React from 'react';
import { 
  Sidebar as SidebarContainer, 
  SidebarContent, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton,
  useSidebar
} from '@/components/ui/sidebar';
import { 
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import SidebarNav from './SidebarNav';

const Sidebar = () => {
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  
  return (
    <SidebarContainer className="h-[calc(100vh-64px)] border-r border-border">
      <SidebarHeader className="border-b border-border p-2">
        <div className="flex items-center justify-between w-full">
          {!isCollapsed && (
            <span className="font-semibold text-sidebar-foreground ml-2">Menu</span>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex-shrink-0"
            title={isCollapsed ? "Utvid sidebar" : "Trekk inn sidebar"}
          >
            {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarNav />
      </SidebarContent>
    </SidebarContainer>
  );
};

export default Sidebar;
