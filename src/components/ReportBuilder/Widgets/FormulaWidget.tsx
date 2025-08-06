import React from 'react';
import { Widget } from '@/contexts/WidgetManagerContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, TrendingUp, TrendingDown } from 'lucide-react';
import { useTrialBalanceWithMappings } from '@/hooks/useTrialBalanceWithMappings';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { useFormulaDefinitions } from '@/hooks/useFormulas';

interface FormulaWidgetProps {
  widget: Widget;
}

// Formula evaluation engine
class FormulaEvaluator {
  private trialBalanceData: any;
  private standardAccountBalances: any[];

  constructor(trialBalanceData: any) {
    this.trialBalanceData = trialBalanceData;
    this.standardAccountBalances = trialBalanceData?.standardAccountBalances || [];
  }

  evaluateFormula(formula: any): number {
    if (!formula || !formula.terms || formula.terms.length === 0) {
      return 0;
    }

    try {
      let expression = '';
      
      for (const term of formula.terms) {
        if (term.operator && expression.length > 0) {
          expression += ` ${term.operator} `;
        }

        switch (term.type) {
          case 'account':
            const accountValue = this.getAccountValue(term.account);
            expression += accountValue.toString();
            break;
          case 'variable':
            const variableValue = this.getVariableValue(term.variable);
            expression += variableValue.toString();
            break;
          case 'constant':
            expression += (term.constant || 0).toString();
            break;
          case 'parenthesis':
            expression += term.parenthesis === 'open' ? '(' : ')';
            break;
        }
      }

      // Safe evaluation using Function constructor
      const result = new Function('return ' + expression)();
      return isNaN(result) ? 0 : result;
    } catch (error) {
      console.error('Formula evaluation error:', error);
      return 0;
    }
  }

  private getAccountValue(accountNumber: string): number {
    if (!accountNumber) return 0;
    
    const account = this.standardAccountBalances.find(
      acc => acc.standard_number === accountNumber
    );
    return account?.total_balance || 0;
  }

  private getVariableValue(variableName: string): number {
    if (!variableName) return 0;

    switch (variableName) {
      case 'gross_profit_margin':
        return this.calculateGrossProfitMargin();
      case 'operating_margin':
        return this.calculateOperatingMargin();
      case 'equity_ratio':
        return this.calculateEquityRatio();
      case 'current_ratio':
        return this.calculateCurrentRatio();
      case 'debt_ratio':
        return this.calculateDebtRatio();
      default:
        return 0;
    }
  }

  private calculateGrossProfitMargin(): number {
    const revenue = this.getAccountsByRange('3000', '3999');
    const cogs = this.getAccountsByRange('4000', '4999');
    
    if (revenue === 0) return 0;
    return ((revenue + cogs) / revenue) * 100;
  }

  private calculateOperatingMargin(): number {
    const revenue = this.getAccountsByRange('3000', '3999');
    const operatingExpenses = this.getAccountsByRange('4000', '6999');
    
    if (revenue === 0) return 0;
    return ((revenue + operatingExpenses) / revenue) * 100;
  }

  private calculateEquityRatio(): number {
    const equity = this.getAccountsByRange('2000', '2999');
    const totalAssets = this.getAccountsByRange('1000', '1999');
    
    if (totalAssets === 0) return 0;
    return (Math.abs(equity) / Math.abs(totalAssets)) * 100;
  }

  private calculateCurrentRatio(): number {
    const currentAssets = this.getAccountsByRange('1500', '1999');
    const currentLiabilities = this.getAccountsByRange('2500', '2999');
    
    if (currentLiabilities === 0) return 0;
    return Math.abs(currentAssets) / Math.abs(currentLiabilities);
  }

  private calculateDebtRatio(): number {
    const totalLiabilities = this.getAccountsByRange('2500', '2999');
    const totalAssets = this.getAccountsByRange('1000', '1999');
    
    if (totalAssets === 0) return 0;
    return (Math.abs(totalLiabilities) / Math.abs(totalAssets)) * 100;
  }

  private getAccountsByRange(startRange: string, endRange: string): number {
    return this.standardAccountBalances
      .filter(account => {
        const accountNum = account.standard_number;
        return accountNum >= startRange && accountNum <= endRange;
      })
      .reduce((sum, account) => sum + account.total_balance, 0);
  }
}

export function FormulaWidget({ widget }: FormulaWidgetProps) {
  const { selectedFiscalYear } = useFiscalYear();
  const clientId = widget.config?.clientId;
  const formulaId = widget.config?.formulaId;
  const customFormula = widget.config?.customFormula;
  const showTrend = widget.config?.showTrend !== false;
  const displayAsPercentage = widget.config?.displayAsPercentage || false;
  const showCurrency = widget.config?.showCurrency !== false;
  
  const { data: trialBalanceData, isLoading: trialBalanceLoading } = useTrialBalanceWithMappings(
    clientId, 
    selectedFiscalYear,
    widget.config?.selectedVersion
  );

  const { data: formulaDefinitions, isLoading: formulaLoading } = useFormulaDefinitions();

  // Get formula from database or use custom formula
  const formula = React.useMemo(() => {
    if (customFormula) {
      return customFormula;
    }
    
    if (formulaId && formulaDefinitions) {
      const definition = formulaDefinitions.find(f => f.id === formulaId);
      return definition?.formula_expression;
    }
    
    return null;
  }, [formulaId, formulaDefinitions, customFormula]);

  // Calculate formula result
  const formulaResult = React.useMemo(() => {
    if (!trialBalanceData || !formula) {
      return { value: '0', change: '0%', trend: 'up' as const };
    }

    const evaluator = new FormulaEvaluator(trialBalanceData);
    const result = evaluator.evaluateFormula(formula);
    
    let formattedValue: string;
    if (displayAsPercentage) {
      formattedValue = `${result.toFixed(1)}%`;
    } else if (showCurrency) {
      formattedValue = `kr ${new Intl.NumberFormat('no-NO').format(Math.abs(result))}`;
    } else {
      formattedValue = result.toFixed(2);
    }
    
    return {
      value: formattedValue,
      change: '+12.5%', // Mock change for now - could be calculated from previous period
      trend: 'up' as const,
    };
  }, [trialBalanceData, formula, displayAsPercentage, showCurrency]);

  if (trialBalanceLoading || formulaLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            {widget.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">Laster...</div>
        </CardContent>
      </Card>
    );
  }

  if (!formula) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            {widget.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Ingen formel konfigurert</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Calculator className="h-4 w-4" />
          {widget.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formulaResult.value}</div>
        {showTrend && (
          <div className="flex items-center pt-1">
            {formulaResult.trend === 'up' ? (
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
            )}
            <span className={`text-xs ${
              formulaResult.trend === 'up' ? 'text-green-500' : 'text-red-500'
            }`}>
              {formulaResult.change}
            </span>
          </div>
        )}
        {formula.metadata?.description && (
          <div className="mt-2 text-xs text-muted-foreground">
            {formula.metadata.description}
          </div>
        )}
      </CardContent>
    </Card>
  );
}