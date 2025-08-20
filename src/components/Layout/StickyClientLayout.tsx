import React, { useEffect } from 'react';
import ClientSubHeader from './ClientSubHeader';
import FiscalYearSelector from './FiscalYearSelector';
import MaterialitySummary from './MaterialitySummary';
import { useSubHeader } from './SubHeaderContext';
import { formatOrgNumber } from '@/utils/formatOrgNumber';
import GlobalSubHeader from './GlobalSubHeader';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';

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
  showBackButton = false,
  children
}) => {
  const { setSubHeader, clearSubHeader } = useSubHeader();

  useEffect(() => {
    setSubHeader(
      <GlobalSubHeader
        leftContent={
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-medium text-white">{clientName}</h1>
            {orgNumber && (
              <span className="text-xs text-white/70 font-mono bg-white/10 px-2 py-1 rounded">
                {formatOrgNumber(orgNumber)}
              </span>
            )}
          </div>
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
        showBackButton={false}
      />
    );
    return () => clearSubHeader();
  }, [clientName, orgNumber, pageTitle, showBackButton, setSubHeader, clearSubHeader]);

  return (
    <div className="flex-1 min-h-0">
      {children}
    </div>
  );
};

export default StickyClientLayout;