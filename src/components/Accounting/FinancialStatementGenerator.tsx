import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStandardAccounts } from '@/hooks/useChartOfAccounts';

interface FinancialStatementLine {
  id: string;
  standard_number: string;
  standard_name: string;
  line_type: 'detail' | 'subtotal' | 'calculation';
  display_order: number;
  is_total_line: boolean;
  sign_multiplier: number;
  calculation_formula?: string;
  parent_line_id?: string;
  amount?: number;
  children?: FinancialStatementLine[];
}

interface FinancialStatementGeneratorProps {
  clientId: string;
  period: string;
}

const FinancialStatementGenerator = ({ clientId, period }: FinancialStatementGeneratorProps) => {
  const { data: standardAccounts, isLoading } = useStandardAccounts();

  const buildFinancialStatementStructure = (): FinancialStatementLine[] => {
    if (!standardAccounts) return [];

    // Convert to our interface
    const lines: FinancialStatementLine[] = standardAccounts.map(account => ({
      id: account.id,
      standard_number: account.standard_number,
      standard_name: account.standard_name,
      line_type: account.line_type as 'detail' | 'subtotal' | 'calculation',
      display_order: account.display_order || 0,
      is_total_line: account.is_total_line || false,
      sign_multiplier: account.sign_multiplier || 1,
      calculation_formula: account.calculation_formula,
      parent_line_id: account.parent_line_id,
      amount: 0, // TODO: Get actual amounts from trial balance
      children: [] as FinancialStatementLine[]
    }));

    // Sort by display order
    lines.sort((a, b) => a.display_order - b.display_order);

    // Build hierarchy
    const topLevelLines = lines.filter(line => !line.parent_line_id);
    const childLines = lines.filter(line => line.parent_line_id);

    // Add children to their parents
    childLines.forEach(child => {
      const parent = lines.find(line => line.id === child.parent_line_id);
      if (parent) {
        if (!parent.children) parent.children = [];
        parent.children.push(child);
      }
    });

    return topLevelLines;
  };

  const calculateAmount = (line: FinancialStatementLine): number => {
    if (line.line_type === 'detail') {
      // TODO: Get actual amount from trial balance mapping
      return 0;
    }

    if (line.line_type === 'subtotal' && line.children) {
      // Sum all children
      return line.children.reduce((sum, child) => sum + calculateAmount(child), 0);
    }

    if (line.line_type === 'calculation' && line.calculation_formula) {
      // TODO: Parse and calculate formula (e.g., "19 + 79")
      return 0;
    }

    return 0;
  };

  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat('nb-NO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const renderLine = (line: FinancialStatementLine, level: number = 0): React.ReactNode => {
    const amount = calculateAmount(line);
    const indent = level * 20;

    return (
      <div key={line.id}>
        <div 
          className={`flex justify-between items-center py-1 ${
            line.is_total_line ? 'font-bold border-t border-b' : ''
          } ${line.line_type === 'calculation' ? 'bg-muted/50' : ''}`}
          style={{ paddingLeft: `${indent}px` }}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground min-w-[40px]">
              {line.standard_number}
            </span>
            <span className={line.is_total_line ? 'font-semibold' : ''}>
              {line.standard_name}
            </span>
            {line.calculation_formula && (
              <span className="text-xs text-muted-foreground">
                ({typeof line.calculation_formula === 'string' 
                  ? line.calculation_formula 
                  : JSON.stringify(line.calculation_formula)})
              </span>
            )}
          </div>
          <span className={`font-mono ${line.is_total_line ? 'font-bold' : ''}`}>
            {formatAmount(amount)}
          </span>
        </div>
        
        {line.children && line.children.map(child => renderLine(child, level + 1))}
      </div>
    );
  };

  if (isLoading) {
    return <div>Laster regnskapsoppstilling...</div>;
  }

  const financialStatement = buildFinancialStatementStructure();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resultatregnskap</CardTitle>
        <p className="text-sm text-muted-foreground">
          Periode: {period}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {financialStatement.map(line => renderLine(line))}
        </div>
        
        <div className="mt-6 p-4 bg-muted/30 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Merk:</strong> Beløpene er foreløpig satt til 0. For å få riktige beløp må du:
          </p>
          <ul className="text-sm text-muted-foreground mt-2 space-y-1">
            <li>1. Laste opp saldoliste (trial balance) for klienten</li>
            <li>2. Mappe klientens kontoer til standardkontoer</li>
            <li>3. Systemet vil da automatisk beregne alle summer og delsummer</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default FinancialStatementGenerator;