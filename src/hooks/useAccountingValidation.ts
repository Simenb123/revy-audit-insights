import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useGeneralLedgerData } from './useGeneralLedgerData';
import { useTrialBalanceData } from './useTrialBalanceData';
import { useActiveTrialBalanceVersion, useActiveVersionInfo } from './useActiveTrialBalanceVersion';

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

export const useAccountingValidation = (
  clientId: string,
  selectedGLVersion?: string,
  selectedTBVersion?: string
) => {
  // ALWAYS call hooks in the same order - move conditional logic to query function
  const { data: activeVersionInfo } = useActiveVersionInfo(clientId);
  const { data: activeTrialBalanceVersion } = useActiveTrialBalanceVersion(clientId);
  
  // Stabilize version selection with useMemo
  const effectiveGLVersion = useMemo(() => 
    selectedGLVersion || activeVersionInfo?.id, 
    [selectedGLVersion, activeVersionInfo?.id]
  );
  
  const effectiveTBVersion = useMemo(() => 
    selectedTBVersion || activeTrialBalanceVersion?.version, 
    [selectedTBVersion, activeTrialBalanceVersion?.version]
  );
  
  // ALWAYS call these hooks - let them handle empty/null versions
  const { data: generalLedgerData } = useGeneralLedgerData(clientId, effectiveGLVersion);
  const { data: trialBalanceData } = useTrialBalanceData(clientId, effectiveTBVersion);

  // Stabilize query key with useMemo
  const queryKey = useMemo(() => 
    ['accounting-validation', clientId, effectiveGLVersion, effectiveTBVersion],
    [clientId, effectiveGLVersion, effectiveTBVersion]
  );

  console.log('[Validation Hook] GL Data:', generalLedgerData?.length || 0, 'entries');
  console.log('[Validation Hook] TB Data:', trialBalanceData?.length || 0, 'entries');
  console.log('[Validation Hook] Parameters:', { clientId, effectiveGLVersion, effectiveTBVersion });

  return useQuery({
    queryKey,
    queryFn: async () => {
      console.log('[Validation Query] Running with:', { 
        hasGL: !!generalLedgerData, 
        hasTB: !!trialBalanceData,
        glLength: generalLedgerData?.length || 0,
        tbLength: trialBalanceData?.length || 0 
      });

      if (!generalLedgerData || !trialBalanceData) {
        return {
          overallValidation: {
            isValid: true,
            message: 'Venter på data - både hovedbok og saldobalanse må være lastet inn',
            severity: 'info' as const
          },
          accountValidations: [] as AccountValidation[]
        };
      }

      const accountValidations: AccountValidation[] = [];

      // Group general ledger transactions by account_number (stable key across datasets)
      const glByAccount = generalLedgerData.reduce((acc, transaction) => {
        const accountNumber = transaction.account_number;
        if (!acc[accountNumber]) {
          acc[accountNumber] = { debit: 0, credit: 0 };
        }
        if (transaction.debit_amount !== null && transaction.debit_amount !== undefined) {
          acc[accountNumber].debit += transaction.debit_amount;
        }
        if (transaction.credit_amount !== null && transaction.credit_amount !== undefined) {
          acc[accountNumber].credit += transaction.credit_amount;
        }
        return acc;
      }, {} as Record<string, { debit: number; credit: number }>);

      // Compare GL movement with TB closing balance via expected closing (opening + movement)
      trialBalanceData.forEach(tbEntry => {
        const glEntry = glByAccount[tbEntry.account_number];
        const glMovement = glEntry ? (glEntry.debit - glEntry.credit) : 0; // Movement from GL
        const expectedClosing = (tbEntry.opening_balance || 0) + glMovement;
        const tbClosing = tbEntry.closing_balance || 0;
        const difference = Math.abs(expectedClosing - tbClosing);

        const validation: AccountValidation = {
          accountId: tbEntry.id,
          accountNumber: tbEntry.account_number,
          accountName: tbEntry.account_name,
          // Interpret as balances for display: expected (GL-derived) vs TB closing
          generalLedgerTotal: expectedClosing,
          trialBalanceTotal: tbClosing,
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
    enabled: !!clientId, // Always enabled, let queryFn handle missing data
  });
};