
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
  
  // Check if we're in a client context
  const isClientContext = location.pathname.includes('/klienter/') && orgNumber;

  return (
    <div className={cn(
      "h-full bg-sidebar border-r border-sidebar-border transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className="flex flex-col h-full">
        {/* Header with toggle */}
        <div className="p-4 border-b border-sidebar-border">
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
        
        {/* Navigation Content */}
        <div className="flex-1 p-4 overflow-y-auto">
          {isClientContext ? (
            <ClientNav />
          ) : (
            <SidebarNav collapsed={isCollapsed} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
