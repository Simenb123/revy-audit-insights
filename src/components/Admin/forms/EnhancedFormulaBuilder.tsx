import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, X, Calculator, Parentheses, Variable } from 'lucide-react';

export interface FormulaTerm {
  id: string;
  type: 'account' | 'variable' | 'constant' | 'parenthesis';
  account?: string;
  variable?: string;
  constant?: number;
  operator?: '+' | '-' | '*' | '/';
  parenthesis?: 'open' | 'close';
}

export interface FormulaData {
  type: 'formula';
  terms: FormulaTerm[];
  variables?: Record<string, any>;
  metadata?: {
    description?: string;
    category?: string;
    complexity_score?: number;
  };
}

interface EnhancedFormulaBuilderProps {
  value?: FormulaData | null;
  onChange: (formula: FormulaData | null) => void;
  standardAccounts: Array<{ standard_number: string; standard_name: string }>;
  disabled?: boolean;
}

const systemVariables = [
  { name: 'gross_profit_margin', display_name: 'Bruttofortjenestegrad', category: 'profitability' },
  { name: 'operating_margin', display_name: 'Driftsgrad', category: 'profitability' },
  { name: 'equity_ratio', display_name: 'Egenkapitalandel', category: 'solvency' },
  { name: 'current_ratio', display_name: 'Likviditetsgrad 1', category: 'liquidity' },
  { name: 'debt_ratio', display_name: 'Gjeldsgrad', category: 'solvency' },
];

export const EnhancedFormulaBuilder = ({ value, onChange, standardAccounts, disabled }: EnhancedFormulaBuilderProps) => {
  const [activeTab, setActiveTab] = useState('basic');
  const formula: FormulaData = value || { type: 'formula' as const, terms: [], variables: {}, metadata: {} };

  const addTerm = (type: FormulaTerm['type'], data?: Partial<FormulaTerm>) => {
    const newTerm: FormulaTerm = {
      id: Date.now().toString(),
      type,
      operator: formula.terms.length > 0 ? '+' : undefined,
      ...data,
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
      let termDisplay = '';
      
      switch (term.type) {
        case 'account':
          const account = standardAccounts.find(acc => acc.standard_number === term.account);
          termDisplay = account ? `${account.standard_number} (${account.standard_name})` : '[Velg konto]';
          break;
        case 'variable':
          const variable = systemVariables.find(v => v.name === term.variable);
          termDisplay = variable ? variable.display_name : '[Velg variabel]';
          break;
        case 'constant':
          termDisplay = term.constant?.toString() || '[Konstant]';
          break;
        case 'parenthesis':
          termDisplay = term.parenthesis === 'open' ? '(' : ')';
          break;
      }
      
      const prefix = index === 0 || term.type === 'parenthesis' ? '' : ` ${term.operator} `;
      return `${prefix}${termDisplay}`;
    }).join('');
  };

  const calculateComplexity = () => {
    const termCount = formula.terms.length;
    const operatorCount = formula.terms.filter(t => t.operator).length;
    const variableCount = formula.terms.filter(t => t.type === 'variable').length;
    const parenthesesCount = formula.terms.filter(t => t.type === 'parenthesis').length;
    
    return Math.min(10, Math.floor(
      (termCount * 0.5) + 
      (operatorCount * 1) + 
      (variableCount * 1.5) + 
      (parenthesesCount * 0.5)
    ));
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Grunnleggende</TabsTrigger>
          <TabsTrigger value="advanced">Avansert</TabsTrigger>
          <TabsTrigger value="variables">Variabler</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Formelbygger
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formula.terms.map((term, index) => (
                <div key={term.id} className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
                  {index > 0 && term.type !== 'parenthesis' && (
                    <Select
                      value={term.operator}
                      onValueChange={(value: '+' | '-' | '*' | '/') => updateTerm(term.id, { operator: value })}
                      disabled={disabled}
                    >
                      <SelectTrigger className="w-16">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-background border shadow-md z-[9999]">
                        <SelectItem value="+">+</SelectItem>
                        <SelectItem value="-">-</SelectItem>
                        <SelectItem value="*">×</SelectItem>
                        <SelectItem value="/">÷</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  
                  <div className="flex-1 flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {term.type === 'account' ? 'Konto' : 
                       term.type === 'variable' ? 'Variabel' :
                       term.type === 'constant' ? 'Konstant' : 'Parentes'}
                    </Badge>
                    
                    {term.type === 'account' && (
                      <Select
                        value={term.account}
                        onValueChange={(value) => updateTerm(term.id, { account: value })}
                        disabled={disabled}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Velg konto..." />
                        </SelectTrigger>
                        <SelectContent className="bg-background border shadow-md z-[9999] max-h-60">
                          {standardAccounts.map((account) => (
                            <SelectItem key={account.standard_number} value={account.standard_number}>
                              {account.standard_number} - {account.standard_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {term.type === 'variable' && (
                      <Select
                        value={term.variable}
                        onValueChange={(value) => updateTerm(term.id, { variable: value })}
                        disabled={disabled}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Velg variabel..." />
                        </SelectTrigger>
                        <SelectContent className="bg-background border shadow-md z-[9999] max-h-60">
                          {systemVariables.map((variable) => (
                            <SelectItem key={variable.name} value={variable.name}>
                              {variable.display_name}
                              <Badge variant="secondary" className="ml-2 text-xs">
                                {variable.category}
                              </Badge>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {term.type === 'constant' && (
                      <Input
                        type="number"
                        value={term.constant || ''}
                        onChange={(e) => updateTerm(term.id, { constant: parseFloat(e.target.value) || 0 })}
                        placeholder="Skriv inn verdi..."
                        disabled={disabled}
                        className="flex-1"
                      />
                    )}

                    {term.type === 'parenthesis' && (
                      <Select
                        value={term.parenthesis}
                        onValueChange={(value: 'open' | 'close') => updateTerm(term.id, { parenthesis: value })}
                        disabled={disabled}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-background border shadow-md z-[9999]">
                          <SelectItem value="open">(</SelectItem>
                          <SelectItem value="close">)</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>

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

              <div className="flex gap-2 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addTerm('account')}
                  disabled={disabled}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Konto
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addTerm('variable')}
                  disabled={disabled}
                  className="flex items-center gap-2"
                >
                  <Variable className="h-4 w-4" />
                  Variabel
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addTerm('constant')}
                  disabled={disabled}
                  className="flex items-center gap-2"
                >
                  <Calculator className="h-4 w-4" />
                  Konstant
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addTerm('parenthesis', { parenthesis: 'open' })}
                  disabled={disabled}
                  className="flex items-center gap-2"
                >
                  <Parentheses className="h-4 w-4" />
                  Parentes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Avanserte innstillinger</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Beskrivelse</label>
                  <Input
                    value={formula.metadata?.description || ''}
                    onChange={(e) => onChange({
                      ...formula,
                      metadata: { ...formula.metadata, description: e.target.value }
                    })}
                    placeholder="Beskriv formelen..."
                    disabled={disabled}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Kategori</label>
                  <Select
                    value={formula.metadata?.category || ''}
                    onValueChange={(value) => onChange({
                      ...formula,
                      metadata: { ...formula.metadata, category: value }
                    })}
                    disabled={disabled}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Velg kategori..." />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-md z-[9999]">
                      <SelectItem value="profitability">Lønnsomhet</SelectItem>
                      <SelectItem value="liquidity">Likviditet</SelectItem>
                      <SelectItem value="solvency">Soliditet</SelectItem>
                      <SelectItem value="efficiency">Effektivitet</SelectItem>
                      <SelectItem value="growth">Vekst</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Kompleksitetsscore</p>
                  <p className="text-sm text-muted-foreground">Automatisk beregnet basert på formelens kompleksitet</p>
                </div>
                <Badge variant={calculateComplexity() > 7 ? 'destructive' : calculateComplexity() > 4 ? 'default' : 'secondary'}>
                  {calculateComplexity()}/10
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="variables" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tilgjengelige variabler</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-2">
                {systemVariables.map((variable) => (
                  <div key={variable.name} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{variable.display_name}</p>
                      <Badge variant="secondary" className="text-xs">
                        {variable.category}
                      </Badge>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addTerm('variable', { variable: variable.name })}
                      disabled={disabled}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {formula.terms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Forhåndsvisning</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-muted rounded-lg font-mono text-sm">
              {formatPreview()}
            </div>
            <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
              <span>Antall ledd: {formula.terms.length}</span>
              <span>Kompleksitet: {calculateComplexity()}/10</span>
              {formula.metadata?.category && (
                <Badge variant="outline">{formula.metadata.category}</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};