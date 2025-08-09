
import React from 'react';
import { cn } from '@/lib/utils';
import AppBreadcrumb from './AppBreadcrumb';

interface GlobalSubHeaderProps {
  title?: string;
  actions?: React.ReactNode;
  filters?: React.ReactNode;
  moduleIndicator?: React.ReactNode;
  className?: string;
}

const GlobalSubHeader: React.FC<GlobalSubHeaderProps> = ({
  title,
  actions,
  filters,
  moduleIndicator,
  className
}) => {
  return (
    <div data-sub-header className={cn('sticky top-[var(--global-header-height)] z-40 bg-background border-b', className)}>
      {/* Main subheader line */}
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <AppBreadcrumb />
          {title && (
            <>
              <div className="h-4 w-px bg-border" />
              <h1 className="text-lg font-semibold">{title}</h1>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {actions}
          {moduleIndicator && (
            <>
              <div className="h-4 w-px bg-border" />
              {moduleIndicator}
            </>
          )}
        </div>
      </div>
      
      {/* Filters section if provided */}
      {filters && (
        <div className="px-6 pb-3">
          {filters}
        </div>
      )}
    </div>
  );
};

export default GlobalSubHeader;
