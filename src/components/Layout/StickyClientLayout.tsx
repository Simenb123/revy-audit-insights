import React from 'react';
import ClientSubHeader from './ClientSubHeader';
import FiscalYearSelector from './FiscalYearSelector';
import MaterialitySummary from './MaterialitySummary';
import { useSubHeader } from './SubHeaderContext';
import { formatOrgNumber } from '@/utils/formatOrgNumber';

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
  const { setSubHeader, clearSubHeader } = useSubHeader();

  React.useEffect(() => {
    setSubHeader(
      <ClientSubHeader
        leftContent={
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-foreground">{clientName}</h1>
            {orgNumber && (
              <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
                {formatOrgNumber(orgNumber)}
              </span>
            )}
          </div>
        }
        centerContent={
          <h2 className="text-sm text-muted-foreground">{pageTitle}</h2>
        }
        rightContent={
          <div className="flex items-center gap-3">
            <FiscalYearSelector
              clientName={clientName}
              showClientName={false}
            />
            <MaterialitySummary />
          </div>
        }
      />
    );
    return () => clearSubHeader();
  }, [clientName, orgNumber, pageTitle, setSubHeader, clearSubHeader]);

  return (
    <div className="flex-1 min-h-0">
      {children}
    </div>
  );
};

export default StickyClientLayout;