
import React from 'react';
import { Minimize2, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import RevyAvatar from '@/components/Revy/RevyAvatar';
import { useRightSidebar } from './RightSidebarContext';

interface CompactSidebarHeaderProps {
  title: string;
}
const CompactSidebarHeader: React.FC<CompactSidebarHeaderProps> = ({ title }) => {
  const { isCollapsed, setIsCollapsed } = useRightSidebar();
  return (
    <div className="flex items-center justify-between h-12 px-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-2">
        <RevyAvatar size="sm" />
        <span className="font-medium text-sm">{title}</span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsCollapsed((prev) => !prev)}
      >
        {isCollapsed ? (
          <Maximize2 className="h-4 w-4" />
        ) : (
          <Minimize2 className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
};

export default CompactSidebarHeader;
