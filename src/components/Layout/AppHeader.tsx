
import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import Logo from './Logo';
import AppBreadcrumb from './AppBreadcrumb';

interface AppHeaderProps {
  onToggleRightSidebar?: () => void;

  isRightSidebarCollapsed?: boolean;
  onOpenMobileSidebar?: () => void;
}

const AppHeader = ({ onToggleRightSidebar, isRightSidebarCollapsed, onOpenMobileSidebar }: AppHeaderProps) => {

  isRightSidebarCollapsed?: boolean; // kept for backward compatibility
}

const AppHeader = ({ onToggleRightSidebar }: AppHeaderProps) => {

  const isMobile = useIsMobile();

  return (
    <header
      className="bg-sidebar border-b border-sidebar-border sticky top-0 z-50 w-full"
      style={{ height: "var(--header-height)" }}
    >
      <div className="flex items-center justify-between px-4" style={{ height: "100%" }}>
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
        
        {/* Right Sidebar Toggle / Mobile Trigger */}
        <div className="flex items-center gap-2">
          {onToggleRightSidebar && !isMobile && (
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
          {onOpenMobileSidebar && isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenMobileSidebar}
              className="h-8 w-8 relative text-sidebar-foreground hover:bg-sidebar-accent"
              title="Åpne AI-chat"
            >
              <MessageSquare className="h-4 w-4" />
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
