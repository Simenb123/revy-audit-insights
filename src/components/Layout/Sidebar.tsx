
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
    <div className="h-full w-full bg-sidebar border-r border-sidebar-border flex flex-col relative">
      {/* Toggle button positioned on the right side inside the sidebar */}
      <div className="absolute top-4 right-2 z-10">
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
      <div className="flex-1 min-h-0 p-4 pt-14 overflow-y-auto">
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
