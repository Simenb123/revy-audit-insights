import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Minus, X } from 'lucide-react';

export interface FormulaTerm {
  id: string;
  account?: string;
  operator?: '+' | '-' | '*' | '/';
  value?: string;
}

export interface FormulaData {
  type: 'formula';
  terms: FormulaTerm[];
}

interface FormulaBuilderProps {
  value?: FormulaData | null;
  onChange: (formula: FormulaData | null) => void;
  standardAccounts: Array<{ standard_number: string; standard_name: string }>;
  disabled?: boolean;
}

export const FormulaBuilder = ({ value, onChange, standardAccounts, disabled }: FormulaBuilderProps) => {
  const formula: FormulaData = value || { type: 'formula' as const, terms: [] };

  const addTerm = () => {
    const newTerm: FormulaTerm = {
      id: Date.now().toString(),
      operator: '+',
    };
    onChange({
      ...formula,
      terms: [...formula.terms, newTerm],
    });
  };

  const updateTerm = (termId: string, updates: Partial<FormulaTerm>) => {
    onChange({
      ...formula,
      terms: formula.terms.map(term => 
        term.id === termId ? { ...term, ...updates } : term
      ),
    });
  };

  const removeTerm = (termId: string) => {
    const newTerms = formula.terms.filter(term => term.id !== termId);
    if (newTerms.length === 0) {
      onChange(null);
    } else {
      onChange({
        ...formula,
        terms: newTerms,
      });
    }
  };

  const formatPreview = () => {
    if (formula.terms.length === 0) return '';
    
    return formula.terms.map((term, index) => {
      const accountName = standardAccounts.find(acc => acc.standard_number === term.account)?.standard_name || term.account;
      const prefix = index === 0 ? '' : ` ${term.operator} `;
      return `${prefix}${accountName || '[Velg konto]'}`;
    }).join('');
  };

  return (
    <div className="space-y-4">
      {formula.terms.map((term, index) => (
        <div key={term.id} className="flex items-center gap-2 p-3 border rounded-lg">
          {index > 0 && (
            <Select
              value={term.operator}
              onValueChange={(value: '+' | '-' | '*' | '/') => updateTerm(term.id, { operator: value })}
              disabled={disabled}
            >
              <SelectTrigger className="w-16">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="+">+</SelectItem>
                <SelectItem value="-">-</SelectItem>
                <SelectItem value="*">×</SelectItem>
                <SelectItem value="/">÷</SelectItem>
              </SelectContent>
            </Select>
          )}
          
          <Select
            value={term.account}
            onValueChange={(value) => updateTerm(term.id, { account: value })}
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
            type="button"
            variant="outline"
            size="sm"
            onClick={() => removeTerm(term.id)}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={addTerm}
          disabled={disabled}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Legg til ledd
        </Button>
      </div>

      {formula.terms.length > 0 && (
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-sm font-medium mb-1">Formel:</p>
          <p className="text-sm text-muted-foreground">{formatPreview()}</p>
        </div>
      )}
    </div>
  );
};