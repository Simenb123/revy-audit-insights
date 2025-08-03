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
      
      // Handle calculation/subtotal lines with formulas
      if ((line.line_type === 'calculation' || line.line_type === 'subtotal') && line.calculation_formula) {
        console.log(`Calculating formula for ${line.standard_name} (${line.standard_number}):`, line.calculation_formula);
        return parseCalculationFormula(line.calculation_formula, isPrevious);
      }

      // Handle lines with children (sum by aggregating children)
      if (line.children && line.children.length > 0) {
        const childSum = line.children.reduce((sum, child) => {
          const childAmount = calculateAmount(child, isPrevious);
          if (isPrevious) {
            child.previous_amount = childAmount;
          } else {
            child.amount = childAmount;
          }
          return sum + childAmount;
        }, 0);
        
        console.log(`Sum for ${line.standard_name} from children:`, childSum);
        return childSum;
      }

      // Handle detail lines - find mapped trial balance accounts
      const relevantMappings = mappings.filter(mapping => 
        mapping.statement_line_number === line.standard_number
      );

      const amount = relevantMappings.reduce((sum, mapping) => {
        const tbAccount = sourceData.find((tb: any) => tb.account_number === mapping.account_number);
        const accountAmount = tbAccount ? (tbAccount.closing_balance || 0) : 0;
        return sum + accountAmount;
      }, 0);

      const finalAmount = amount * line.sign_multiplier;
      console.log(`Detail line ${line.standard_name} (${line.standard_number}): ${finalAmount}`);
      return finalAmount;
    };

    const parseCalculationFormula = (formula: any, isPrevious = false): number => {
      if (!formula) return 0;

      console.log(`Parsing calculation_formula:`, formula);
      
      // Handle complex object format with terms array
      if (typeof formula === 'object' && formula.type === 'formula' && Array.isArray(formula.terms)) {
        let result = 0;
        
        for (const term of formula.terms) {
          const accountNumber = term.account_number;
          const operator = term.operator || '+'; // Default to addition if no operator
          
          console.log(`Processing term: ${accountNumber} with operator: ${operator}`);
          
          // Find the account with this standard_number
          const referencedAccount = firmAccounts.find((acc: any) => acc.standard_number === accountNumber);
          
          if (referencedAccount) {
            console.log(`Found referenced account: ${referencedAccount.standard_name} (${accountNumber})`);
            
            // Create a temporary line to calculate amount
            const tempLine: FinancialStatementLine = {
              id: referencedAccount.id,
              standard_number: referencedAccount.standard_number,
              standard_name: referencedAccount.standard_name,
              account_type: referencedAccount.account_type,
              display_order: referencedAccount.display_order || 0,
              line_type: referencedAccount.line_type,
              parent_line_id: referencedAccount.parent_line_id,
              calculation_formula: referencedAccount.calculation_formula,
              is_total_line: referencedAccount.is_total_line,
              sign_multiplier: referencedAccount.sign_multiplier,
              children: []
            };
            
            const accountAmount = calculateAmount(tempLine, isPrevious);
            console.log(`Account ${accountNumber} amount: ${accountAmount}`);
            
            if (operator === '+') {
              result += accountAmount;
            } else if (operator === '-') {
              result -= accountAmount;
            }
          } else {
            console.warn(`Account ${accountNumber} not found in formula terms`);
          }
        }
        
        console.log(`Formula result: ${result}`);
        return result;
      }
      
      // Fallback: handle simple string formulas (legacy support)
      if (typeof formula === 'string') {
        console.log(`Parsing string formula: "${formula}"`);
        
        const parts = formula.split(/\s*([+\-])\s*/);
        let result = 0;
        let operator = '+';
        
        for (let i = 0; i < parts.length; i++) {
          if (parts[i] === '+' || parts[i] === '-') {
            operator = parts[i];
          } else if (parts[i].trim()) {
            const accountNumber = parts[i].trim();
            
            const referencedAccount = firmAccounts.find((acc: any) => acc.standard_number === accountNumber);
            
            if (referencedAccount) {
              const tempLine: FinancialStatementLine = {
                id: referencedAccount.id,
                standard_number: referencedAccount.standard_number,
                standard_name: referencedAccount.standard_name,
                account_type: referencedAccount.account_type,
                display_order: referencedAccount.display_order || 0,
                line_type: referencedAccount.line_type,
                parent_line_id: referencedAccount.parent_line_id,
                calculation_formula: referencedAccount.calculation_formula,
                is_total_line: referencedAccount.is_total_line,
                sign_multiplier: referencedAccount.sign_multiplier,
                children: []
              };
              
              const accountAmount = calculateAmount(tempLine, isPrevious);
              
              if (operator === '+') {
                result += accountAmount;
              } else {
                result -= accountAmount;
              }
            }
          }
        }
        
        return result;
      }
      
      console.warn('Unknown formula format:', formula);
      return 0;
    };

    const statement = buildFinancialStatementStructure();
    
    // Calculate amounts for current and previous year
    // Process in dependency order - detail lines first, then calculated lines
    const processLine = (line: FinancialStatementLine) => {
      // First process all children
      if (line.children && line.children.length > 0) {
        line.children.forEach(processLine);
      }
      
      // Then calculate this line's amount
      line.amount = calculateAmount(line, false);
      line.previous_amount = calculateAmount(line, true);
    };
    
    statement.forEach(processLine);

    return statement;
  }, [firmAccounts, trialBalance, mappings, previousTrialBalance]);

  // Extract period information
  const periodInfo = useMemo(() => {
    if (!trialBalance || trialBalance.length === 0) return null;
    
    const firstEntry = trialBalance[0];
    return {
      clientId,
      currentYear: firstEntry.period_year,
      previousYear: firstEntry.period_year - 1,
      periodStart: firstEntry.period_start_date,
      periodEnd: firstEntry.period_end_date
    };
  }, [clientId, trialBalance]);

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