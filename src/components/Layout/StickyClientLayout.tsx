import React from 'react';
import ClientContextHeader from './ClientContextHeader';
import ClientSubHeader from './ClientSubHeader';
import FiscalYearSelector from './FiscalYearSelector';

interface StickyClientLayoutProps {
  clientName: string;
  orgNumber?: string;
  pageTitle: string;
  showBackButton?: boolean;
  children: React.ReactNode;
}

const StickyClientLayout: React.FC<StickyClientLayoutProps> = ({
  clientName,
  orgNumber,
  pageTitle,
  showBackButton = true,
  children
}) => {
  return (
    <div className="flex flex-col h-full">
      <ClientSubHeader
        leftContent={
          <span className="text-xs font-medium text-muted-foreground">Navigation</span>
        }
        centerContent={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-foreground">{clientName}</h1>
              {orgNumber && (
                <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
                  {orgNumber}
                </span>
              )}
            </div>
            <div className="text-muted-foreground">•</div>
            <h2 className="text-sm text-muted-foreground">{pageTitle}</h2>
          </div>
        }
        rightContent={
          <FiscalYearSelector 
            clientName={clientName}
            showClientName={false}
          />
        }
      />
      <div className="flex-1 min-h-0">
        {children}
      </div>
    </div>
  );
};

export default StickyClientLayout;