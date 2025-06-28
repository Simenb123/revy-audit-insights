
import React from 'react';
import { Button } from '@/components/ui/button';
import RevyAvatar from '@/components/Revy/RevyAvatar';

interface CompactSidebarHeaderProps {
  title: string;
  onToggle: () => void;
}

const CompactSidebarHeader: React.FC<CompactSidebarHeaderProps> = ({ title, onToggle }) => {
  return (
    <div className="flex items-center justify-between h-12 px-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="p-1 h-8 w-8 hover:bg-accent/50"
          title="Lukk/åpne sidebar"
        >
          <RevyAvatar size="sm" />
        </Button>
        <span className="font-medium text-sm">{title}</span>
      </div>
    </div>
  );
};

export default CompactSidebarHeader;
