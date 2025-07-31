import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';
import { useFiscalYear } from '@/contexts/FiscalYearContext';

interface FiscalYearSelectorProps {
  clientName?: string;
  showClientName?: boolean;
}

const FiscalYearSelector: React.FC<FiscalYearSelectorProps> = ({ 
  clientName, 
  showClientName = true 
}) => {
  const { selectedFiscalYear, setSelectedFiscalYear, fiscalYearOptions } = useFiscalYear();

  return (
    <div className="flex items-center gap-4">
      {showClientName && clientName && (
        <div className="flex items-center gap-2">
          <span className="font-medium">{clientName}</span>
          <Badge variant="outline" className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {selectedFiscalYear}
          </Badge>
        </div>
      )}
      
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Regnskapsår:</span>
        <Select
          value={selectedFiscalYear.toString()}
          onValueChange={(value) => setSelectedFiscalYear(parseInt(value, 10))}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {fiscalYearOptions.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default FiscalYearSelector;