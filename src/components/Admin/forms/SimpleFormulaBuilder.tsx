import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

  const formatPreview = () => {
    if (terms.length === 0) return 'Ingen formel definert';
    
    return terms.map((term, index) => {
      const prefix = index === 0 ? '' : ` ${term.operator} `;
      return `${prefix}${term.account_number} (${term.account_name})`;
    }).join('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Beregningsformel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Formula Terms */}
        <div className="space-y-3">
          {terms.map((term, index) => (
            <div key={term.id} className="flex items-center gap-3 p-3 border rounded-md">
              {index > 0 && (
                <Select 
                  value={term.operator} 
                  onValueChange={(operator: '+' | '-') => updateTerm(term.id, { operator })}
                  disabled={disabled}
                >
                  <SelectTrigger className="w-16">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="+">+</SelectItem>
                    <SelectItem value="-">-</SelectItem>
                  </SelectContent>
                </Select>
              )}
              
              <Select 
                value={term.account_number} 
                onValueChange={(value) => handleAccountChange(term.id, value)}
                disabled={disabled}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Velg konto..." />
                </SelectTrigger>
                <SelectContent>
                  {standardAccounts.map((account) => (
                    <SelectItem key={account.standard_number} value={account.standard_number}>
                      {account.standard_number} - {account.standard_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeTerm(term.id)}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* Add Term Button */}
        <Button 
          variant="outline" 
          onClick={addTerm}
          disabled={disabled}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Legg til konto
        </Button>

        {/* Preview */}
        {terms.length > 0 && (
          <div className="mt-4 p-3 bg-muted rounded-md">
            <h4 className="text-sm font-medium mb-2">Forhåndsvisning:</h4>
            <p className="text-sm font-mono">{formatPreview()}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SimpleFormulaBuilder;