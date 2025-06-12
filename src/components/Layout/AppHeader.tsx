
import React from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { PanelRightOpen } from 'lucide-react';

interface AppHeaderProps {
  onRightSidebarToggle?: () => void;
}

const AppHeader = ({ onRightSidebarToggle }: AppHeaderProps) => {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b px-4 bg-sidebar-background text-sidebar-foreground sticky top-0 z-40">
      <SidebarTrigger className="-ml-1 text-sidebar-foreground hover:bg-sidebar-accent" />
      
      <div className="flex items-center gap-2">
        {onRightSidebarToggle && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onRightSidebarToggle}
            className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <PanelRightOpen className="h-4 w-4" />
          </Button>
        )}
      </div>
    </header>
  );
};

export default AppHeader;
