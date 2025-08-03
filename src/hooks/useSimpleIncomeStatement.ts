import { useMemo } from 'react';
import { useFirmStandardAccounts } from './useFirmStandardAccounts';
import { useTrialBalanceData } from './useTrialBalanceData';
import { useTrialBalanceMappings } from './useTrialBalanceMappings';

interface SimpleIncomeStatementLine {
  id: string;
  standard_number: string;
  standard_name: string;
  display_order: number;
  line_type: string;
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
      type: acc.line_type
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

    // Calculate amounts for each line
    const lines: SimpleIncomeStatementLine[] = resultAccounts.map((account: any) => {
      const mappedAccounts = accountMappings.get(account.standard_number) || [];
      
      // Calculate current period amount
      let amount = 0;
      mappedAccounts.forEach(accountNumber => {
        const trialBalanceEntry = trialBalance.find(tb => tb.account_number === accountNumber);
        if (trialBalanceEntry) {
          amount += (trialBalanceEntry.closing_balance || 0) * account.sign_multiplier;
        }
      });

      // For now, set previous amount to 0 (we'll add this later)
      const previous_amount = 0;

      console.log(`💰 Line ${account.standard_number} (${account.standard_name}): ${amount} (${mappedAccounts.length} accounts)`);

      return {
        id: account.id,
        standard_number: account.standard_number,
        standard_name: account.standard_name,
        display_order: account.display_order || 0,
        line_type: account.line_type,
        amount,
        previous_amount,
        account_count: mappedAccounts.length
      };
    });

    console.log('✅ Final income statement lines:', lines.map(l => ({
      number: l.standard_number,
      name: l.standard_name,
      amount: l.amount,
      order: l.display_order
    })));

    return lines;
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