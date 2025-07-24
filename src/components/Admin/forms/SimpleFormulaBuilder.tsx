import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Plus, X } from 'lucide-react';

export interface SimpleFormulaTerm {
  id: string;
  account_number: string;
  account_name: string;
  operator: '+' | '-';
}

export interface SimpleFormulaData {
  type: 'formula';
  terms: SimpleFormulaTerm[];
}

interface SimpleFormulaBuilderProps {
  value?: SimpleFormulaData | null;
  onChange: (formula: SimpleFormulaData | null) => void;
  standardAccounts: Array<{ standard_number: string; standard_name: string }>;
  disabled?: boolean;
}

export const SimpleFormulaBuilder = ({ value, onChange, standardAccounts, disabled }: SimpleFormulaBuilderProps) => {
  const terms = value?.terms || [];

  const addTerm = () => {
    const newTerm: SimpleFormulaTerm = {
      id: `term_${Date.now()}`,
      account_number: '',
      account_name: '',
      operator: '+'
    };
    
    const newFormula: SimpleFormulaData = {
      type: 'formula',
      terms: [...terms, newTerm]
    };
    
    onChange(newFormula);
  };

  const updateTerm = (termId: string, updates: Partial<SimpleFormulaTerm>) => {
    const updatedTerms = terms.map(term => 
      term.id === termId ? { ...term, ...updates } : term
    );
    
    onChange({
      type: 'formula',
      terms: updatedTerms
    });
  };

  const removeTerm = (termId: string) => {
    const filteredTerms = terms.filter(term => term.id !== termId);
    
    if (filteredTerms.length === 0) {
      onChange(null);
    } else {
      onChange({
        type: 'formula',
        terms: filteredTerms
      });
    }
  };

  const handleAccountChange = (termId: string, accountNumber: string) => {
    const selectedAccount = standardAccounts.find(acc => acc.standard_number === accountNumber);
    if (selectedAccount) {
      updateTerm(termId, {
        account_number: accountNumber,
        account_name: selectedAccount.standard_name
      });
    }
  };

  // Sort and prepare options for the searchable select
  const accountOptions = standardAccounts
    .sort((a, b) => {
      const aNum = parseInt(a.standard_number);
      const bNum = parseInt(b.standard_number);
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return aNum - bNum;
      }
      return a.standard_number.localeCompare(b.standard_number);
    })
    .map(account => ({
      value: account.standard_number,
      label: `${account.standard_number} - ${account.standard_name}`
    }));

  const formatPreview = () => {
    if (terms.length === 0) return 'Ingen formel definert';
    
    return terms.map((term, index) => {
      const prefix = index === 0 ? '' : ` ${term.operator} `;
      return `${prefix}${term.account_number} (${term.account_name})`;
    }).join('');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Beregningsformel</h3>
        <Button 
          variant="outline" 
          onClick={addTerm}
          disabled={disabled}
          className="h-7 text-xs px-2"
          size="sm"
        >
          <Plus className="h-3 w-3 mr-1" />
          Legg til
        </Button>
      </div>
      
      {/* Formula Terms - Compact Grid Layout */}
      {terms.length > 0 && (
        <div className="space-y-1 max-h-48 overflow-y-auto border rounded-md p-2 bg-muted/20">
          {terms.map((term, index) => (
            <div key={term.id} className="flex items-center gap-1 text-xs">
              {index > 0 && (
                <Select 
                  value={term.operator} 
                  onValueChange={(operator: '+' | '-') => updateTerm(term.id, { operator })}
                  disabled={disabled}
                >
                  <SelectTrigger className="w-8 h-6 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="+">+</SelectItem>
                    <SelectItem value="-">-</SelectItem>
                  </SelectContent>
                </Select>
              )}
              
              <SearchableSelect
                value={term.account_number}
                onValueChange={(value) => handleAccountChange(term.id, value)}
                options={accountOptions}
                placeholder="Velg konto..."
                searchPlaceholder="Søk..."
                disabled={disabled}
                className="flex-1 h-6 text-xs"
              />
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeTerm(term.id)}
                disabled={disabled}
                className="h-6 w-6 p-0"
              >
                <X className="h-2 w-2" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Preview - More Compact */}
      {terms.length > 0 && (
        <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded border">
          <span className="font-medium">Formel:</span> {formatPreview()}
        </div>
      )}
    </div>
  );
};

export default SimpleFormulaBuilder;