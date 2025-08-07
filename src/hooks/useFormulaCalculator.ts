import { useMemo } from 'react';
import { StandardAccountBalance } from './useTrialBalanceWithMappings';
import { HARDCODED_FORMULAS, FormulaCalculation } from './useFormulaVariables';

export interface FormulaCalculationResult {
  value: number;
  formattedValue: string;
  formula: string;
  isValid: boolean;
  error?: string;
}

/**
 * @deprecated Use useFormulaCalculation hook instead for better performance and consistency
 * This hook is kept for backward compatibility but will be removed in future versions
 */
export function useFormulaCalculator(standardAccountBalances: StandardAccountBalance[]) {
  console.warn('useFormulaCalculator is deprecated. Use useFormulaCalculation hook instead.');
  
  const calculator = useMemo(() => {
    return new FormulaCalculator(standardAccountBalances);
  }, [standardAccountBalances]);

  return calculator;
}

/**
 * @deprecated Use edge function calculate-formula instead for better performance
 * This class is kept for backward compatibility but will be removed in future versions
 */
class FormulaCalculator {
  private standardAccountBalances: StandardAccountBalance[];

  constructor(standardAccountBalances: StandardAccountBalance[]) {
    this.standardAccountBalances = standardAccountBalances;
  }

  // Public method to expose calculatePrefixSum
  calculatePrefixSum(prefix: string): number {
    return this.standardAccountBalances
      .filter(account => account.standard_number.startsWith(prefix))
      .reduce((sum, account) => sum + (account.total_balance || 0), 0);
  }

  calculateFormula(variableName: string): FormulaCalculationResult {
    try {
      const formula = HARDCODED_FORMULAS.find(f => f.name === variableName);
      if (!formula) {
        return {
          value: 0,
          formattedValue: '0',
          formula: '',
          isValid: false,
          error: `Formula '${variableName}' not found`
        };
      }

      const value = this.evaluateHardcodedFormula(formula);
      
      return {
        value,
        formattedValue: this.formatValue(value, formula.type),
        formula: formula.formula,
        isValid: true
      };
    } catch (error) {
      return {
        value: 0,
        formattedValue: '0',
        formula: '',
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private evaluateHardcodedFormula(formula: FormulaCalculation): number {
    try {
      // Calculate base values
      const baseValues = this.getBaseValues();
      
      switch (formula.name) {
        case 'liquidity_ratio':
          return baseValues.current_liabilities === 0 ? 0 : baseValues.current_assets / baseValues.current_liabilities;
        case 'equity_ratio':
          return baseValues.total_assets === 0 ? 0 : (baseValues.total_equity / baseValues.total_assets) * 100;
        case 'profit_margin':
          return baseValues.revenue === 0 ? 0 : (baseValues.operating_result / baseValues.revenue) * 100;
        case 'operating_result':
          return baseValues.operating_result;
        default:
          return 0;
      }
    } catch (error) {
      console.error('Error evaluating hardcoded formula:', error);
      return 0;
    }
  }

  private getBaseValues() {
    return {
      current_assets: this.calculatePrefixSum('1') - this.calculatePrefixSum('10'), // Omløpsmidler (1x - 10x)
      current_liabilities: this.calculatePrefixSum('21') + this.calculatePrefixSum('22'), // Kortsiktig gjeld (21x + 22x)
      total_assets: this.calculatePrefixSum('1'), // Sum eiendeler (1x)
      total_equity: this.calculatePrefixSum('20'), // Egenkapital (20x)
      revenue: Math.abs(this.calculatePrefixSum('3')), // Driftsinntekter (3x)
      operating_result: Math.abs(this.calculatePrefixSum('3')) - Math.abs(this.calculatePrefixSum('4')) - Math.abs(this.calculatePrefixSum('5')) // Driftsresultat
    };
  }

  private calculateAccountRangeSum(range: string): number {
    let total = 0;
    
    // Split multiple ranges by comma
    const ranges = range.split(',').map(r => r.trim());
    
    for (const singleRange of ranges) {
      if (singleRange.includes('[') && singleRange.includes(']')) {
        // Pattern matching like "1[1-9]:" or "2[0-2]:"
        total += this.calculatePatternSum(singleRange);
      } else if (singleRange.includes(':')) {
        // Simple range like "1:" or "3:"
        const prefix = singleRange.replace(':', '');
        total += this.calculatePrefixSumInternal(prefix);
      } else {
        // Exact account number
        total += this.getAccountBalance(singleRange);
      }
    }
    
    return total;
  }

  private calculatePatternSum(pattern: string): number {
    // Parse patterns like "1[1-9]:" or "2[0-2]:"
    const match = pattern.match(/^(\d+)\[(\d+)-(\d+)\]:?$/);
    if (!match) return 0;
    
    const [, prefix, start, end] = match;
    const startNum = parseInt(start);
    const endNum = parseInt(end);
    
    let total = 0;
    for (let i = startNum; i <= endNum; i++) {
      const accountPrefix = prefix + i;
      total += this.calculatePrefixSumInternal(accountPrefix);
    }
    
    return total;
  }

  private calculatePrefixSumInternal(prefix: string): number {
    return this.calculatePrefixSum(prefix);
  }

  private getAccountBalance(accountNumber: string): number {
    const account = this.standardAccountBalances.find(
      acc => acc.standard_number === accountNumber
    );
    return account?.total_balance || 0;
  }

  private formatValue(value: number, type: string): string {
    const absValue = Math.abs(value);
    
    switch (type) {
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'ratio':
        return value.toFixed(2);
      case 'amount':
        return `kr ${new Intl.NumberFormat('no-NO').format(absValue)}`;
      default:
        return value.toString();
    }
  }
}