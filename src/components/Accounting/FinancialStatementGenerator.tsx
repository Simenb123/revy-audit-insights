import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStandardAccounts } from '@/hooks/useChartOfAccounts';
import { useTrialBalanceMappings } from '@/hooks/useTrialBalanceMappings';
import { useTrialBalanceData } from '@/hooks/useTrialBalanceData';
import { convertAccountType } from '@/utils/accountTypeMapping';
import FinancialStatementValidation from './FinancialStatementValidation';

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

const parseCalculationFormula = (
  formula: string,
  getAmountForStandardAccount: (standardNumber: string) => number
): number => {
  const cleanFormula = formula.replace(/\s/g, '');

  const additionMatch = cleanFormula.match(/^(\d+)\+(\d+)$/);
  if (additionMatch) {
    const [, num1, num2] = additionMatch;
    return (
      getAmountForStandardAccount(num1) +
      getAmountForStandardAccount(num2)
    );
  }

  const subtractionMatch = cleanFormula.match(/^(\d+)-(\d+)$/);
  if (subtractionMatch) {
    const [, num1, num2] = subtractionMatch;
    return (
      getAmountForStandardAccount(num1) -
      getAmountForStandardAccount(num2)
    );
  }

  const singleNumberMatch = cleanFormula.match(/^(\d+)$/);
  if (singleNumberMatch) {
    return getAmountForStandardAccount(singleNumberMatch[1]);
  }

  return 0;
};

const FinancialStatementGenerator = ({ clientId, period }: FinancialStatementGeneratorProps) => {
  const navigate = useNavigate();
  const { data: standardAccounts, isLoading: standardAccountsLoading } = useStandardAccounts();
  const { data: trialBalanceData } = useTrialBalanceData(clientId);
  const { data: mappings = [] } = useTrialBalanceMappings(clientId);
  
  const isLoading = standardAccountsLoading;

  const financialStatement = React.useMemo(() => {
    if (!standardAccounts) return [] as FinancialStatementLine[];

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
      children: [] as FinancialStatementLine[]
    }));

    lines.sort((a, b) => a.display_order - b.display_order);

    const topLevelLines = lines.filter(line => !line.parent_line_id);
    const childLines = lines.filter(line => line.parent_line_id);

    childLines.forEach(child => {
      const parent = lines.find(line => line.id === child.parent_line_id);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(child);
      }
    });

    const lineMap: Record<string, FinancialStatementLine> = {};
    const registerLine = (line: FinancialStatementLine) => {
      lineMap[line.standard_number] = line;
      line.children?.forEach(registerLine);
    };
    topLevelLines.forEach(registerLine);

    function getAmountForStandardAccount(standardNumber: string): number {
      const target = lineMap[standardNumber];
      if (!target) return 0;
      return computeLineAmount(target);
    }

    function computeLineAmount(line: FinancialStatementLine): number {
      if (typeof line.amount === 'number') return line.amount;

      if (line.line_type === 'detail') {
        if (!trialBalanceData || !mappings) {
          line.amount = 0;
          return 0;
        }

        const mappedAccounts = mappings.filter(
          m => m.statement_line_number === line.standard_number
        );
        let total = 0;

        mappedAccounts.forEach(mapping => {
          const account = trialBalanceData.find(
            acc => acc.account_number === mapping.account_number
          );
          if (account) {
            total += account.closing_balance;
          }
        });

        line.amount = total * line.sign_multiplier;
        return line.amount;
      }

      if (line.line_type === 'subtotal' && line.children) {
        line.amount = line.children.reduce(
          (sum, child) => sum + computeLineAmount(child),
          0
        );
        return line.amount;
      }

      if (line.line_type === 'calculation' && line.calculation_formula) {
        line.amount = parseCalculationFormula(
          line.calculation_formula,
          getAmountForStandardAccount
        );
        return line.amount;
      }

      line.amount = 0;
      return 0;
    }

    topLevelLines.forEach(line => {
      line.amount = computeLineAmount(line);
    });

    return topLevelLines;
  }, [standardAccounts, trialBalanceData, mappings]);

  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat('nb-NO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const renderLine = (
    line: FinancialStatementLine,
    level: number = 0
  ): React.ReactNode => {
    const amount = line.amount ?? 0;
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


  // Calculate totals for validation
  const calculateTotals = () => {
    if (!trialBalanceData || !standardAccounts) return { assets: 0, liabilities: 0, equity: 0, revenue: 0, expenses: 0 };
    
    let assets = 0, liabilities = 0, equity = 0, revenue = 0, expenses = 0;
    
    trialBalanceData.forEach(account => {
      // Find which standard account this is mapped to
      const mapping = mappings.find(m => m.account_number === account.account_number);
      if (mapping) {
        const standardAccount = standardAccounts.find(acc => acc.standard_number === mapping.statement_line_number);
        if (standardAccount) {
          const amount = account.closing_balance;
          const normalizedType = convertAccountType(standardAccount.account_type);
          
          switch (normalizedType) {
            case 'eiendeler':
              assets += amount;
              break;
            case 'gjeld':
              liabilities += amount;
              break;
            case 'egenkapital':
              equity += amount;
              break;
            case 'resultat':
              if (amount > 0) revenue += amount;
              else expenses += Math.abs(amount);
              break;
          }
        }
      }
    });
    
    return { assets, liabilities, equity, revenue, expenses };
  };

  const totals = calculateTotals();

  const handleNavigateToMapping = () => {
    navigate(`/clients/${clientId}/accounting?tab=mapping`);
  };

  return (
    <div className="space-y-6">
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
        </CardContent>
      </Card>

      {trialBalanceData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Mapping Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Totalt kontoer:</span>
                  <span>{trialBalanceData.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Mapped kontoer:</span>
                  <span>{mappings.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Umapped kontoer:</span>
                  <span>{trialBalanceData.length - mappings.length}</span>
                </div>
                {trialBalanceData.length - mappings.length > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleNavigateToMapping}
                    className="w-full mt-2"
                  >
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Fullfør mapping
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
          
          <FinancialStatementValidation
            totalAssets={totals.assets}
            totalLiabilities={totals.liabilities}
            totalEquity={totals.equity}
            totalRevenue={totals.revenue}
            totalExpenses={totals.expenses}
            mappingStats={{
              totalAccounts: trialBalanceData.length,
              mappedAccounts: mappings.length,
              unmappedAccounts: trialBalanceData.length - mappings.length
            }}
          />
        </div>
      )}
    </div>
  );
};

export default FinancialStatementGenerator;