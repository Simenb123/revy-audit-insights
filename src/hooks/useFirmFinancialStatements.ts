import { useMemo } from 'react';
import { useFirmStandardAccounts } from './useFirmStandardAccounts';
import { useTrialBalanceData } from './useTrialBalanceData';
import { useTrialBalanceMappings } from './useTrialBalanceMappings';

interface FinancialStatementLine {
  id: string;
  standard_number: string;
  standard_name: string;
  account_type: string;
  display_order: number;
  line_type: string;
  parent_line_id?: string;
  calculation_formula?: any;
  is_total_line: boolean;
  sign_multiplier: number;
  children?: FinancialStatementLine[];
  amount?: number;
  previous_amount?: number;
}

export function useFirmFinancialStatements(clientId: string, selectedVersion?: string) {
  const { data: firmAccounts } = useFirmStandardAccounts();
  const { data: trialBalance } = useTrialBalanceData(clientId, selectedVersion);
  const { data: mappings } = useTrialBalanceMappings(clientId);
  
  // Get current year from trial balance
  const currentYear = trialBalance?.[0]?.period_year;
  const { data: previousTrialBalance } = useTrialBalanceData(
    clientId, 
    undefined, 
    currentYear ? currentYear - 1 : undefined
  );

  const financialStatement = useMemo(() => {
    if (!firmAccounts || !trialBalance || !mappings) {
      return null;
    }

    const buildFinancialStatementStructure = (): FinancialStatementLine[] => {
      const lines: FinancialStatementLine[] = firmAccounts
        .map((account: any) => ({
          id: account.id,
          standard_number: account.standard_number,
          standard_name: account.standard_name,
          account_type: account.account_type,
          display_order: account.display_order || 0,
          line_type: account.line_type,
          parent_line_id: account.parent_line_id || undefined,
          calculation_formula: account.calculation_formula,
          is_total_line: account.is_total_line,
          sign_multiplier: account.sign_multiplier,
          children: [] as FinancialStatementLine[],
        }))
        .sort((a: any, b: any) => a.display_order - b.display_order);

      // Build hierarchy
      const lineMap = new Map(lines.map(line => [line.id, line]));
      const rootLines: FinancialStatementLine[] = [];

      lines.forEach(line => {
        if (line.parent_line_id && lineMap.has(line.parent_line_id)) {
          const parent = lineMap.get(line.parent_line_id)!;
          parent.children = parent.children || [];
          parent.children.push(line);
        } else {
          rootLines.push(line);
        }
      });

      return rootLines;
    };

    const calculateAmount = (line: FinancialStatementLine, isPrevious = false): number => {
      const sourceData = isPrevious ? previousTrialBalance : trialBalance;
      
      if (!sourceData) return 0;
      
      if (line.line_type === 'calculation' && line.calculation_formula) {
        return parseCalculationFormula(line.calculation_formula, isPrevious);
      }

      if (line.children && line.children.length > 0) {
        return line.children.reduce((sum, child) => {
          const childAmount = calculateAmount(child, isPrevious);
          if (isPrevious) {
            child.previous_amount = childAmount;
          } else {
            child.amount = childAmount;
          }
          return sum + childAmount;
        }, 0);
      }

      // Find mapped trial balance accounts
      const relevantMappings = mappings.filter(mapping => 
        mapping.statement_line_number === line.standard_number
      );

      const amount = relevantMappings.reduce((sum, mapping) => {
        const tbAccount = sourceData.find((tb: any) => tb.account_number === mapping.account_number);
        return sum + (tbAccount ? (tbAccount.closing_balance || 0) : 0);
      }, 0);

      return amount * line.sign_multiplier;
    };

    const parseCalculationFormula = (formula: any, isPrevious = false): number => {
      if (!formula || !formula.terms) return 0;

      return formula.terms.reduce((result: number, term: any) => {
        const accountAmount = firmAccounts
          .filter((acc: any) => acc.standard_number === term.account)
          .reduce((sum: any, acc: any) => {
            const line = { ...acc, children: [] } as FinancialStatementLine;
            return sum + calculateAmount(line, isPrevious);
          }, 0);

        return term.operator === '+' ? result + accountAmount : result - accountAmount;
      }, 0);
    };

    const statement = buildFinancialStatementStructure();
    
    // Calculate amounts for current and previous year
    statement.forEach(line => {
      line.amount = calculateAmount(line, false);
      line.previous_amount = calculateAmount(line, true);
    });

    return statement;
  }, [firmAccounts, trialBalance, mappings, previousTrialBalance]);

  // Extract period information
  const periodInfo = useMemo(() => {
    if (!trialBalance || trialBalance.length === 0) return null;
    
    const firstEntry = trialBalance[0];
    return {
      currentYear: firstEntry.period_year,
      previousYear: firstEntry.period_year - 1,
      periodStart: firstEntry.period_start_date,
      periodEnd: firstEntry.period_end_date
    };
  }, [trialBalance]);

  const mappingStats = useMemo(() => {
    if (!trialBalance || !mappings) {
      return { totalAccounts: 0, mappedAccounts: 0, unmappedAccounts: 0 };
    }

    const mappedAccountNumbers = new Set(mappings.map(m => m.account_number));
    const totalAccounts = trialBalance.length;
    const mappedAccounts = trialBalance.filter((tb: any) => mappedAccountNumbers.has(tb.account_number)).length;
    const unmappedAccounts = totalAccounts - mappedAccounts;

    return { totalAccounts, mappedAccounts, unmappedAccounts };
  }, [trialBalance, mappings]);

  return {
    financialStatement,
    mappingStats,
    periodInfo,
    isLoading: !firmAccounts || !trialBalance || !mappings
  };
}