
import React from 'react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import SidebarNav from './SidebarNav';
import ClientNav from './ClientNav';
import { useLocation, useParams } from 'react-router-dom';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const Sidebar = ({ isCollapsed, onToggle }: SidebarProps) => {
  const location = useLocation();
  const { orgNumber } = useParams<{ orgNumber: string }>();
  
  // Simple check for client context
  const isClientContext = location.pathname.includes('/klienter/') && orgNumber;

  return (
    <div className={cn(
      "h-full bg-sidebar border-r border-sidebar-border flex flex-col relative overflow-hidden transition-all duration-300 ease-in-out",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Toggle button positioned on the right side inside the sidebar */}
      <div className="absolute top-4 right-2 z-150">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent"
          title={isCollapsed ? "Utvid sidebar" : "Trekk inn sidebar"}
        >
          {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </Button>
      </div>
      
      {/* Navigation Content - Scrollable */}
      <div className={cn(
        "flex-1 min-h-0 overflow-y-auto transition-all duration-300 ease-in-out",
        isCollapsed ? "p-2 pt-14" : "p-4 pt-14"
      )}>
        {isClientContext ? (
          <ClientNav />
        ) : (
          <SidebarNav collapsed={isCollapsed} />
        )}
      </div>
    </div>
  );
};

export default Sidebar;
