import React from 'react';
import { Calendar } from 'lucide-react';
import { useAccountingYear } from '@/hooks/useAccountingYear';
import AccountingYearSelector from '@/components/AccountingYearSelector';

interface AccountingYearHeaderProps {
  clientId: string;
  showSelector?: boolean;
  variant?: 'full' | 'compact' | 'badge';
}

const AccountingYearHeader = ({ 
  clientId, 
  showSelector = true, 
  variant = 'full' 
}: AccountingYearHeaderProps) => {
  const { accountingYear, isLoading } = useAccountingYear(clientId);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Calendar className="w-4 h-4" />
        <span>Laster...</span>
      </div>
    );
  }

  if (variant === 'badge') {
    return (
      <div className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-sm font-medium">
        <Calendar className="w-3 h-3" />
        <span>{accountingYear}</span>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Calendar className="w-4 h-4" />
        <span>Regnskapsår: {accountingYear}</span>
        {showSelector && (
          <AccountingYearSelector 
            clientId={clientId} 
            variant="minimal"
            showLabel={false}
          />
        )}
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-blue-800">
          <Calendar className="w-4 h-4" />
          <span className="font-medium">Regnskapsår {accountingYear}</span>
        </div>
        {showSelector && (
          <AccountingYearSelector 
            clientId={clientId} 
            variant="minimal"
            showLabel={false}
          />
        )}
      </div>
    </div>
  );
};

export default AccountingYearHeader;