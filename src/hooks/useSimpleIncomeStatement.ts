import { useMemo } from 'react';
import { useFirmStandardAccounts } from './useFirmStandardAccounts';
import { useTrialBalanceData } from './useTrialBalanceData';
import { useTrialBalanceMappings } from './useTrialBalanceMappings';
import { evaluateStatementFormula } from '../lib/statementFormula';

interface SimpleIncomeStatementLine {
  id: string;
  standard_number: string;
  standard_name: string;
  display_order: number;
  line_type: string;
  is_total_line: boolean;
  amount: number;
  previous_amount: number;
  account_count: number;
}

export function useSimpleIncomeStatement(clientId: string, selectedVersion?: string) {
  console.log('🔧 useSimpleIncomeStatement called with:', { clientId, selectedVersion });
  
  const { data: standardAccounts = [], isLoading: isLoadingAccounts } = useFirmStandardAccounts();
  const { data: trialBalance = [], isLoading: isLoadingTB } = useTrialBalanceData(clientId, selectedVersion);
  const { data: mappings = [], isLoading: isLoadingMappings } = useTrialBalanceMappings(clientId);
  
  console.log('📊 Raw data:', { 
    standardAccountsCount: standardAccounts.length, 
    trialBalanceCount: trialBalance.length,
    mappingsCount: mappings.length 
  });

  const incomeStatementLines = useMemo(() => {
    if (!standardAccounts.length || !trialBalance.length) {
      console.log('❌ Missing data for income statement calculation');
      return [];
    }

    // Filter only resultat (income statement) accounts and sort by display_order
    const resultAccounts = standardAccounts
      .filter((account: any) => account.account_type === 'resultat')
      .sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0));

    console.log('🎯 Filtered resultat accounts:', resultAccounts.map((acc: any) => ({
      number: acc.standard_number,
      name: acc.standard_name,
      display_order: acc.display_order,
      type: acc.line_type,
      formula: acc.calculation_formula
    })));

    // Create mapping lookup for faster access
    const accountMappings = new Map<string, string[]>();
    mappings.forEach(mapping => {
      const lineNumber = mapping.statement_line_number;
      if (!accountMappings.has(lineNumber)) {
        accountMappings.set(lineNumber, []);
      }
      accountMappings.get(lineNumber)!.push(mapping.account_number);
    });

    console.log('🔗 Account mappings:', Object.fromEntries(accountMappings));

    const calculationCache = new Map<string, number>();

    // Get amount for a specific line (with caching and recursion)
    function getLineAmount(lineNumber: string): number {
      if (calculationCache.has(lineNumber)) {
        return calculationCache.get(lineNumber)!;
      }

      const account = resultAccounts.find((acc: any) => acc.standard_number === lineNumber);
      if (!account) {
        console.warn(`⚠️ Account not found: ${lineNumber}`);
        return 0;
      }

      let amount = 0;

      // Calculate based on line type
      if (account.line_type === 'detail') {
        // Detail lines: sum from trial balance mappings
        const mappedAccounts = accountMappings.get(account.standard_number) || [];
        mappedAccounts.forEach(accountNumber => {
          const trialBalanceEntry = trialBalance.find(tb => tb.account_number === accountNumber);
          if (trialBalanceEntry) {
            amount += (trialBalanceEntry.closing_balance || 0) * account.sign_multiplier;
          }
        });
      } else if (account.line_type === 'subtotal' || account.line_type === 'calculation') {
        if (account.calculation_formula) {
          try {
            amount = evaluateStatementFormula(account.calculation_formula, getLineAmount);
          } catch (error) {
            console.error('❌ Error parsing formula:', account.calculation_formula, error);
          }
        }
      }

      calculationCache.set(lineNumber, amount);
      console.log(`💰 Calculated line ${lineNumber} (${account.standard_name}): ${amount} (type: ${account.line_type})`);
      
      return amount;
    }

    // Calculate amounts for all lines
    const lines: SimpleIncomeStatementLine[] = resultAccounts.map((account: any) => {
      const amount = getLineAmount(account.standard_number);
      const mappedAccounts = accountMappings.get(account.standard_number) || [];
      
      // For now, set previous amount to 0 (we'll add this later)
      const previous_amount = 0;

      return {
        id: account.id,
        standard_number: account.standard_number,
        standard_name: account.standard_name,
        display_order: account.display_order || 0,
        line_type: account.line_type,
        is_total_line: Boolean(account.is_total_line),
        amount,
        previous_amount,
        account_count: mappedAccounts.length
      };
    });

    // Sort: non-total lines first, then totals; within groups by display_order, then numeric/alphanumeric standard_number
    const sorted = [...lines].sort((a, b) => {
      const aName = String(a.standard_name || '').toLowerCase();
      const bName = String(b.standard_name || '').toLowerCase();
      const aIsTotal = !!a.is_total_line || a.line_type === 'subtotal' || a.line_type === 'calculation' || aName.startsWith('sum');
      const bIsTotal = !!b.is_total_line || b.line_type === 'subtotal' || b.line_type === 'calculation' || bName.startsWith('sum');
      if (aIsTotal !== bIsTotal) return aIsTotal ? 1 : -1;
      const byOrder = (a.display_order || 0) - (b.display_order || 0);
      if (byOrder !== 0) return byOrder;
      const aNum = parseInt(String(a.standard_number), 10);
      const bNum = parseInt(String(b.standard_number), 10);
      if (!Number.isNaN(aNum) && !Number.isNaN(bNum) && aNum !== bNum) return aNum - bNum;
      return String(a.standard_number).localeCompare(String(b.standard_number));
    });

    if (import.meta.env?.DEV) {
      try {
        // eslint-disable-next-line no-console
        console.debug('[useSimpleIncomeStatement] order check', sorted.map(l => l.standard_number).slice(0, 20));
        const l20 = sorted.find(l => String(l.standard_number) === '20');
        // eslint-disable-next-line no-console
        console.debug('[useSimpleIncomeStatement] has 20 Varekostnad?', {
          exists: !!l20,
          name: l20?.standard_name,
          is_total_line: l20?.is_total_line,
          line_type: l20?.line_type,
        });
      } catch {}
    }

    return sorted;
  }, [standardAccounts, trialBalance, mappings]);

  const periodInfo = useMemo(() => {
    // Get current year - just use current year for now
    const currentYear = new Date().getFullYear();
    
    return {
      currentYear,
      previousYear: currentYear - 1
    };
  }, []);

  const isLoading = isLoadingAccounts || isLoadingTB || isLoadingMappings;

  console.log('📋 Hook result:', { 
    linesCount: incomeStatementLines.length, 
    isLoading, 
    periodInfo 
  });

  return {
    incomeStatementLines,
    periodInfo,
    isLoading
  };
}