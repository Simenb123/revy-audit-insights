
import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import Logo from './Logo';
import AppBreadcrumb from './AppBreadcrumb';

interface AppHeaderProps {
  onToggleRightSidebar?: () => void;
  isRightSidebarCollapsed?: boolean;
}

const AppHeader = ({ onToggleRightSidebar, isRightSidebarCollapsed }: AppHeaderProps) => {
  const isMobile = useIsMobile();

  return (
    <header className="bg-sidebar border-b border-sidebar-border sticky top-0 z-50 w-full">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Logo />
          {!isMobile && (
            <div className="border-l border-sidebar-border pl-4">
              <div className="text-sidebar-foreground">
                <AppBreadcrumb />
              </div>
            </div>
          )}
        </div>
        
        {/* Right Sidebar Toggle */}
        <div className="flex items-center gap-2">
          {onToggleRightSidebar && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleRightSidebar}
              className="h-8 w-8 relative text-sidebar-foreground hover:bg-sidebar-accent"
              title="Toggle AI-Revi Assistant"
            >
              <MessageSquare className="h-4 w-4" />
              {/* AI indicator */}
              <div className="absolute -top-1 -right-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full p-0.5">
                <div className="h-2 w-2 bg-white rounded-full" />
              </div>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
