import { useMemo } from 'react';
import { useTrialBalanceData } from './useTrialBalanceData';
import { usePayrollImports } from './usePayrollImports';
import { useA07AccountMappings } from './useA07AccountMappings';

export interface A07ControlStatementRow {
  accountNumber: string;
  accountName: string;
  trialBalanceAmount: number;
  a07Amount: number;
  difference: number;
  differencePercentage: number;
  hasMapping: boolean;
  mappedA07Codes: string[];
}

export function useA07ControlStatement(clientId: string, selectedVersion?: string, fiscalYear?: number) {
  const { data: trialBalanceData } = useTrialBalanceData(clientId, selectedVersion, fiscalYear);
  const { data: payrollImports } = usePayrollImports(clientId);
  const { data: accountMappings } = useA07AccountMappings(clientId);

  const controlStatement = useMemo(() => {
    if (!trialBalanceData || !payrollImports || !accountMappings) {
      return [];
    }

    // Create mapping lookup
    const mappingsByAccount = accountMappings.reduce((acc, mapping) => {
      if (!acc[mapping.account_number]) {
        acc[mapping.account_number] = [];
      }
      acc[mapping.account_number].push(mapping.a07_performance_code);
      return acc;
    }, {} as Record<string, string[]>);

    // Get A07 totals by performance code
    const a07TotalsByCode: Record<string, number> = {};
    
    payrollImports.forEach(importItem => {
      // Simulate A07 data structure - in real implementation, fetch from payroll_variables
      const performanceCodes = {
        '100': 1000000, // Fast lønn
        '101': 200000,  // Timelønn
        '102': 150000,  // Overtidslønn
        '103': 100000,  // Bonus
        '200': 250000,  // Arbeidsgiveravgift
        '201': 180000,  // Pensjon
        '202': 50000,   // Forsikring
      };

      Object.entries(performanceCodes).forEach(([code, amount]) => {
        a07TotalsByCode[code] = (a07TotalsByCode[code] || 0) + amount;
      });
    });

    // Create control statement rows
    const rows: A07ControlStatementRow[] = trialBalanceData
      .filter(entry => {
        // Filter for salary/payroll related accounts (typically 5xxx and 7xxx series)
        const accountNum = parseInt(entry.account_number);
        return (accountNum >= 5000 && accountNum < 6000) || (accountNum >= 7000 && accountNum < 8000);
      })
      .map(entry => {
        const mappedCodes = mappingsByAccount[entry.account_number] || [];
        const hasMapping = mappedCodes.length > 0;
        
        // Calculate A07 amount for this account
        const a07Amount = mappedCodes.reduce((sum, code) => {
          return sum + (a07TotalsByCode[code] || 0);
        }, 0);

        const trialBalanceAmount = entry.closing_balance || 0;
        const difference = trialBalanceAmount - a07Amount;
        const differencePercentage = a07Amount !== 0 ? (difference / a07Amount) * 100 : 0;

        return {
          accountNumber: entry.account_number,
          accountName: entry.account_name,
          trialBalanceAmount,
          a07Amount,
          difference,
          differencePercentage,
          hasMapping,
          mappedA07Codes: mappedCodes,
        };
      })
      .filter(row => row.trialBalanceAmount !== 0 || row.a07Amount !== 0); // Only show accounts with activity

    return rows.sort((a, b) => a.accountNumber.localeCompare(b.accountNumber));
  }, [trialBalanceData, payrollImports, accountMappings]);

  const summary = useMemo(() => {
    const totalTrialBalance = controlStatement.reduce((sum, row) => sum + row.trialBalanceAmount, 0);
    const totalA07 = controlStatement.reduce((sum, row) => sum + row.a07Amount, 0);
    const totalDifference = totalTrialBalance - totalA07;
    const unmappedAccounts = controlStatement.filter(row => !row.hasMapping).length;
    const significantDifferences = controlStatement.filter(row => Math.abs(row.differencePercentage) > 5).length;

    return {
      totalTrialBalance,
      totalA07,
      totalDifference,
      unmappedAccounts,
      significantDifferences,
      totalAccounts: controlStatement.length,
    };
  }, [controlStatement]);

  return {
    controlStatement,
    summary,
    isLoading: !trialBalanceData || !payrollImports || !accountMappings,
  };
}