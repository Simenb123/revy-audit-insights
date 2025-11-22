import React, { useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Database, ChevronDown, ChevronRight } from 'lucide-react';

interface PopulationSelectorProps {
  selectedStandardNumbers: string[];
  onSelectionChange: (numbers: string[]) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

// Common standard accounts for audit sampling
const COMMON_STANDARD_ACCOUNTS = [
  { number: '10', name: 'Salgsinntekter', category: 'Inntekt' },
  { number: '19', name: 'Sum driftsinntekter', category: 'Inntekt' },
  { number: '20', name: 'Varekostnad', category: 'Kostnad' },
  { number: '70', name: 'Annen driftskostnad', category: 'Kostnad' },
  { number: '30', name: 'Lønn og sosiale kostnader', category: 'Kostnad' },
  { number: '40', name: 'Avskrivninger', category: 'Kostnad' },
  { number: '50', name: 'Nedskrivninger', category: 'Kostnad' },
  { number: '60', name: 'Andre driftskostnader', category: 'Kostnad' },
  { number: '80', name: 'Finansinntekter', category: 'Finans' },
  { number: '81', name: 'Finanskostnader', category: 'Finans' },
];

export const PopulationSelector: React.FC<PopulationSelectorProps> = ({
  selectedStandardNumbers,
  onSelectionChange,
  isExpanded,
  onToggleExpand
}) => {
  const handleAccountToggle = useCallback((accountNumber: string) => {
    const isSelected = selectedStandardNumbers.includes(accountNumber);
    if (isSelected) {
      onSelectionChange(selectedStandardNumbers.filter(n => n !== accountNumber));
    } else {
      onSelectionChange([...selectedStandardNumbers, accountNumber]);
    }
  }, [selectedStandardNumbers, onSelectionChange]);

  return (
    <Card>
      <Collapsible open={isExpanded} onOpenChange={onToggleExpand}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Regnskapslinjer ({selectedStandardNumbers.length} valgt)
              </span>
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </CardTitle>
            <CardDescription>
              Velg hvilke regnskapslinjer som skal inngå i utvalget
            </CardDescription>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* Quick Selection Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSelectionChange(['20'])}
              >
                Kun Varekostnad
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSelectionChange(['20', '70'])}
              >
                Varekost + Annen drift
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSelectionChange(['10', '19'])}
              >
                Kun Omsetning
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSelectionChange([])}
              >
                Nullstill
              </Button>
            </div>

            <Separator />

            {/* Standard Account Grid */}
            <div className="grid gap-2">
              {COMMON_STANDARD_ACCOUNTS.map((account) => (
                <div
                  key={account.number}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id={`standard-${account.number}`}
                      checked={selectedStandardNumbers.includes(account.number)}
                      onCheckedChange={() => handleAccountToggle(account.number)}
                    />
                    <div>
                      <label
                        htmlFor={`standard-${account.number}`}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {account.number} - {account.name}
                      </label>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {account.category}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
