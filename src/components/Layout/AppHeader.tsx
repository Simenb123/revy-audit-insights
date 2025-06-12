
import React from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { PanelRightOpen } from 'lucide-react';

interface AppHeaderProps {
  onRightSidebarToggle?: () => void;
}

const AppHeader = ({ onRightSidebarToggle }: AppHeaderProps) => {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background px-4 sticky top-0 z-40">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1 hover:bg-accent" />
        <span className="font-semibold text-foreground">Revio</span>
      </div>
      
      <div className="flex items-center gap-2">
        {onRightSidebarToggle && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onRightSidebarToggle}
            className="h-8 w-8 hover:bg-accent"
          >
            <PanelRightOpen className="h-4 w-4" />
          </Button>
        )}
      </div>
    </header>
  );
};

export default AppHeader;
