
import React from 'react';
import RevyAvatar from '@/components/Revy/RevyAvatar';

interface CompactSidebarHeaderProps {
  title: string;
}
const CompactSidebarHeader: React.FC<CompactSidebarHeaderProps> = ({ title }) => {
  return (
    <div className="flex items-center justify-between h-12 px-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-2">
        <RevyAvatar size="sm" />
        <span className="font-medium text-sm">{title}</span>
      </div>
    </div>
  );
};

export default CompactSidebarHeader;
