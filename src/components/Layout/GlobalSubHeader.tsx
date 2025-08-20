
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import AppBreadcrumb from './AppBreadcrumb';

interface GlobalSubHeaderProps {
  title?: string;
  actions?: React.ReactNode;
  filters?: React.ReactNode;
  moduleIndicator?: React.ReactNode;
  className?: string;
  leftContent?: React.ReactNode;
  centerContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  showBackButton?: boolean;
  backButtonText?: string;
  backButtonUrl?: string;
}

const GlobalSubHeader: React.FC<GlobalSubHeaderProps> = ({
  title,
  actions,
  filters,
  moduleIndicator,
  className,
  leftContent,
  centerContent,
  rightContent,
  showBackButton = false,
  backButtonText = "Tilbake til klientliste",
  backButtonUrl = "/clients"
}) => {
    return (
      <div
        data-sub-header
        className={cn(
          'sticky top-[var(--global-header-current-height)] z-40 h-[var(--sub-header-height)]',
          className
        )}
      >
      {/* Main subheader line */}
      <div className="flex items-center justify-between px-6 py-3 min-h-[40px]">
        {/* Use flexible content if provided, otherwise fall back to default layout */}
        {leftContent || centerContent || rightContent ? (
          <>
            <div className="flex items-center min-w-0 flex-1">
              {showBackButton && (
                <Button asChild variant="ghost" size="sm" className="text-white hover:bg-white/10 mr-4">
                  <Link to={backButtonUrl} className="flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    {backButtonText}
                  </Link>
                </Button>
              )}
              {leftContent}
            </div>
            
            <div className="flex items-center justify-center flex-1 min-w-0 mx-4">
              {centerContent}
            </div>
            
            <div className="flex items-center min-w-0 justify-end">
              {rightContent}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-4 min-w-0 flex-1">
              {showBackButton && (
                <Button asChild variant="ghost" size="sm" className="text-white hover:bg-white/10">
                  <Link to={backButtonUrl} className="flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    {backButtonText}
                  </Link>
                </Button>
              )}
              <AppBreadcrumb />
              {title && (
                <>
                  <div className="h-4 w-px bg-white/30" />
                  <h1 className="text-lg font-semibold text-white">{title}</h1>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              {actions}
              {moduleIndicator && (
                <>
                  <div className="h-4 w-px bg-white/30" />
                  {moduleIndicator}
                </>
              )}
            </div>
          </>
        )}
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
