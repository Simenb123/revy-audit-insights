import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from 'lucide-react';
import { useAccountingYear } from '@/hooks/useAccountingYear';
import { Skeleton } from '@/components/ui/skeleton';

interface AccountingYearSelectorProps {
  clientId: string;
  showLabel?: boolean;
  variant?: 'default' | 'minimal';
}

const AccountingYearSelector = ({ 
  clientId, 
  showLabel = true, 
  variant = 'default' 
}: AccountingYearSelectorProps) => {
  const { accountingYear, setAccountingYear, isLoading } = useAccountingYear(clientId);

  if (isLoading) {
    return <Skeleton className="h-10 w-32" />;
  }

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

  if (variant === 'minimal') {
    return (
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Regnskapsår:</span>
        <Select value={accountingYear.toString()} onValueChange={(value) => setAccountingYear(parseInt(value))}>
          <SelectTrigger className="w-20 h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {showLabel && (
        <label className="text-sm font-medium flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Regnskapsår
        </label>
      )}
      <Select value={accountingYear.toString()} onValueChange={(value) => setAccountingYear(parseInt(value))}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {years.map((year) => (
            <SelectItem key={year} value={year.toString()}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default AccountingYearSelector;