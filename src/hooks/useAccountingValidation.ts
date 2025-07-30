import { useQuery } from '@tanstack/react-query';
import { useGeneralLedgerData } from './useGeneralLedgerData';
import { useTrialBalanceData } from './useTrialBalanceData';

export interface ValidationResult {
  isValid: boolean;
  message: string;
  severity: 'info' | 'warning' | 'error';
}

export interface AccountValidation extends ValidationResult {
  accountId: string;
  accountNumber: string;
  accountName: string;
  generalLedgerTotal: number;
  trialBalanceTotal: number;
  difference: number;
}

export const useAccountingValidation = (clientId: string, selectedGLVersion?: string, selectedTBVersion?: string) => {
  const { data: generalLedgerData } = useGeneralLedgerData(clientId, selectedGLVersion);
  const { data: trialBalanceData } = useTrialBalanceData(clientId, selectedTBVersion);

  return useQuery({
    queryKey: ['accounting-validation', clientId, selectedGLVersion, selectedTBVersion],
    queryFn: async () => {
      if (!generalLedgerData || !trialBalanceData) {
        return {
          overallValidation: {
            isValid: false,
            message: 'Mangler data for validering - både hovedbok og saldobalanse må være lastet inn',
            severity: 'warning' as const
          },
          accountValidations: [] as AccountValidation[]
        };
      }

      const accountValidations: AccountValidation[] = [];

      // Group general ledger transactions by account
      const glByAccount = generalLedgerData.reduce((acc, transaction) => {
        const accountId = transaction.client_account_id;
        if (!acc[accountId]) {
          acc[accountId] = { debit: 0, credit: 0, balance: 0 };
        }
        
        if (transaction.debit_amount !== null) {
          acc[accountId].debit += transaction.debit_amount;
        }
        if (transaction.credit_amount !== null) {
          acc[accountId].credit += transaction.credit_amount;
        }
        if (transaction.balance_amount !== null) {
          acc[accountId].balance += transaction.balance_amount;
        }
        
        return acc;
      }, {} as Record<string, { debit: number; credit: number; balance: number }>);

      // Compare with trial balance
      trialBalanceData.forEach(tbEntry => {
        const glEntry = glByAccount[tbEntry.id];
        const glTotal = glEntry ? (glEntry.debit - glEntry.credit + glEntry.balance) : 0;
        const tbTotal = tbEntry.closing_balance;
        const difference = Math.abs(glTotal - tbTotal);

        const validation: AccountValidation = {
          accountId: tbEntry.id,
          accountNumber: tbEntry.account_number,
          accountName: tbEntry.account_name,
          generalLedgerTotal: glTotal,
          trialBalanceTotal: tbTotal,
          difference,
          isValid: difference <= 1, // Allow 1 kr difference for rounding
          message: difference <= 1 
            ? 'Balanse stemmer' 
            : `Differanse på ${difference.toFixed(2)} kr`,
          severity: difference <= 1 ? 'info' : (difference <= 100 ? 'warning' : 'error')
        };

        accountValidations.push(validation);
      });

      const hasErrors = accountValidations.some(v => !v.isValid);
      const totalDifference = accountValidations.reduce((sum, v) => sum + v.difference, 0);

      return {
        overallValidation: {
          isValid: !hasErrors,
          message: hasErrors 
            ? `${accountValidations.filter(v => !v.isValid).length} kontoer har avvik (total: ${totalDifference.toFixed(2)} kr)`
            : `Alle ${accountValidations.length} kontoer stemmer overens mellom hovedbok og saldobalanse`,
          severity: hasErrors ? (totalDifference > 1000 ? 'error' : 'warning') : 'info'
        } as ValidationResult,
        accountValidations
      };
    },
    enabled: !!clientId && !!generalLedgerData && !!trialBalanceData && generalLedgerData.length > 0 && trialBalanceData.length > 0,
  });
};