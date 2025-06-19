
import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import Logo from './Logo';
import AppBreadcrumb from './AppBreadcrumb';

interface AppHeaderProps {
  onToggleRightSidebar?: () => void;
  isRightSidebarOpen?: boolean;
}

const AppHeader = ({ onToggleRightSidebar, isRightSidebarOpen }: AppHeaderProps) => {
  const isMobile = useIsMobile();

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Logo />
          {!isMobile && (
            <div className="border-l border-border pl-4">
              <AppBreadcrumb />
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
              className="h-8 w-8 relative"
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
