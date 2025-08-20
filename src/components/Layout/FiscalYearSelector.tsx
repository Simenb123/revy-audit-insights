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
          <SelectTrigger className="w-[120px] bg-white border-white/20 text-foreground hover:bg-white/90">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white/95 backdrop-blur-sm border-border z-[60]">
            {fiscalYearOptions.map((year) => (
              <SelectItem 
                key={year} 
                value={year.toString()}
                className="text-gray-800 hover:bg-accent hover:text-accent-foreground"
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