import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calculator, Database, Plus, X } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface PopulationSelectorProps {
  populationSource: 'manual' | 'accounting_lines';
  onPopulationSourceChange: (source: 'manual' | 'accounting_lines') => void;
  
  // Manual values
  manualSize: number;
  manualSum: number;
  onManualSizeChange: (size: number) => void;
  onManualSumChange: (sum: number) => void;
  
  // Accounting lines selection
  selectedStandardNumbers: string[];
  onSelectedStandardNumbersChange: (numbers: string[]) => void;
  
  // Calculated values from accounting data
  calculatedSize?: number;
  calculatedSum?: number;
  isCalculating?: boolean;
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

const PopulationSelector: React.FC<PopulationSelectorProps> = ({
  populationSource,
  onPopulationSourceChange,
  manualSize,
  manualSum,
  onManualSizeChange,
  onManualSumChange,
  selectedStandardNumbers,
  onSelectedStandardNumbersChange,
  calculatedSize,
  calculatedSum,
  isCalculating = false
}) => {

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleStandardAccountToggle = (accountNumber: string) => {
    const isSelected = selectedStandardNumbers.includes(accountNumber);
    if (isSelected) {
      onSelectedStandardNumbersChange(selectedStandardNumbers.filter(n => n !== accountNumber));
    } else {
      onSelectedStandardNumbersChange([...selectedStandardNumbers, accountNumber]);
    }
  };

  const addQuickCombination = (numbers: string[]) => {
    const newSelection = [...new Set([...selectedStandardNumbers, ...numbers])];
    onSelectedStandardNumbersChange(newSelection);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-4 w-4" />
          Populasjonsvalg
        </CardTitle>
        <CardDescription>
          Velg populasjon for utvalgstesting
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Population Source Toggle */}
        <div className="flex gap-2">
          <Button
            variant={populationSource === 'manual' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onPopulationSourceChange('manual')}
          >
            <Calculator className="h-4 w-4 mr-2" />
            Manuell
          </Button>
          <Button
            variant={populationSource === 'accounting_lines' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onPopulationSourceChange('accounting_lines')}
          >
            <Database className="h-4 w-4 mr-2" />
            Fra regnskapsdata
          </Button>
        </div>

        {populationSource === 'manual' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="manualSize">Populasjon antall</Label>
                <Input
                  id="manualSize"
                  type="number"
                  value={manualSize}
                  onChange={(e) => onManualSizeChange(parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="manualSum">Populasjon beløp (NOK)</Label>
                <Input
                  id="manualSum"
                  type="number"
                  value={manualSum}
                  onChange={(e) => onManualSumChange(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>
        )}

        {populationSource === 'accounting_lines' && (
          <div className="space-y-4">
            {/* Quick Combinations */}
            <div>
              <Label className="text-sm font-medium">Vanlige kombinasjoner</Label>
              <div className="flex gap-2 mt-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addQuickCombination(['10', '19'])}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Salgsinntekter
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addQuickCombination(['20', '70'])}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Varekost + Annen drift
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addQuickCombination(['30'])}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Lønnskostnader
                </Button>
              </div>
            </div>

            <Separator />

            {/* Standard Account Selection */}
            <div>
              <Label className="text-sm font-medium">Velg regnskapslinjer</Label>
              <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                {COMMON_STANDARD_ACCOUNTS.map((account) => (
                  <div key={account.number} className="flex items-center space-x-2">
                    <Checkbox
                      id={`account-${account.number}`}
                      checked={selectedStandardNumbers.includes(account.number)}
                      onCheckedChange={() => handleStandardAccountToggle(account.number)}
                    />
                    <Label 
                      htmlFor={`account-${account.number}`}
                      className="flex-1 text-sm cursor-pointer"
                    >
                      <span className="font-mono font-medium">{account.number}</span>
                      <span className="ml-2">{account.name}</span>
                      <Badge variant="outline" className="ml-2 text-xs">
                        {account.category}
                      </Badge>
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Accounts Summary */}
            {selectedStandardNumbers.length > 0 && (
              <div>
                <Label className="text-sm font-medium">Valgte regnskapslinjer</Label>
                <div className="flex gap-1 mt-2 flex-wrap">
                  {selectedStandardNumbers.map((number) => {
                    const account = COMMON_STANDARD_ACCOUNTS.find(a => a.number === number);
                    return (
                      <Badge key={number} variant="secondary" className="gap-1">
                        <span className="font-mono">{number}</span>
                        {account && <span>{account.name}</span>}
                        <X 
                          className="h-3 w-3 cursor-pointer hover:text-destructive" 
                          onClick={() => handleStandardAccountToggle(number)}
                        />
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Calculated Results */}
            {selectedStandardNumbers.length > 0 && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm font-medium mb-2">Beregnet populasjon</div>
                {isCalculating ? (
                  <div className="text-sm text-muted-foreground">Beregner...</div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground">Antall kontoer</div>
                      <div className="text-lg font-semibold">{calculatedSize || 0}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Total beløp</div>
                      <div className="text-lg font-semibold">{formatCurrency(calculatedSum || 0)}</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PopulationSelector;