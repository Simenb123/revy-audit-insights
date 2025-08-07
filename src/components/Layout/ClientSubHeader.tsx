import React from 'react';
import { cn } from '@/lib/utils';

interface ClientSubHeaderProps {
  leftContent?: React.ReactNode;
  centerContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  className?: string;
}

const ClientSubHeader: React.FC<ClientSubHeaderProps> = ({
  leftContent,
  centerContent,
  rightContent,
  className
}) => {
  return (
    <div
      data-sub-header
      className={cn(
        'sticky top-[var(--global-header-height)] z-40 bg-background border-b h-[var(--sub-header-height)] px-4',
        'flex items-center justify-between',
        className
      )}
    >
      <div className="flex items-center min-w-0">
        {leftContent}
      </div>
      
      <div className="flex items-center justify-center flex-1 min-w-0 mx-4">
        {centerContent}
      </div>
      
      <div className="flex items-center min-w-0">
        {rightContent}
      </div>
    </div>
  );
};

export default ClientSubHeader;