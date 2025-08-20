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
          <Badge variant="secondary" className="flex items-center gap-1 bg-primary/10 text-primary border-primary/20">
            <Calendar className="w-3 h-3" />
            {selectedFiscalYear}
          </Badge>
        </div>
      )}
      
      <div className="flex items-center gap-2">
        <span className="text-sm text-white">Regnskapsår:</span>
        <Select
          value={selectedFiscalYear.toString()}
          onValueChange={(value) => setSelectedFiscalYear(parseInt(value, 10))}
        >
          <SelectTrigger className="w-[80px] h-8 bg-white/10 border-white/30 text-white hover:bg-white/20 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-200 z-[60]">
            {fiscalYearOptions.map((year) => (
              <SelectItem 
                key={year} 
                value={year.toString()}
                className="text-gray-900 hover:bg-gray-100 focus:bg-gray-100"
              >
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